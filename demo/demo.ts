import { LookerEmbedSDK, LookerEmbedLook, LookerEmbedDashboard } from '../src'
import { DashboardEvent, LookerEmbedFilterParams } from '../src/types'
import {
  LookerSDK,
  IApiSettings,
  ITransport,
  IAccessToken,
  IError,
  agentTag,
  ProxySession
} from '@looker/sdk'
import { lookerHost, dashboardId, lookId, dashboardFilterDate, dashboardFilterField, logoUrl } from './demo_config'
import { clearDropdown, loadingIcon, buildTrending, tableSwap, swapVis } from './demo_helpers'

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

LookerEmbedSDK.init(lookerHost, '/auth')

let gEvent: DashboardEvent
let gFilters: LookerEmbedFilterParams = { 'KPIs': 'Total Sale Price,Active Users' }
let gDashboard: LookerEmbedDashboard
let gSDK: LookerSDK
const gUser: any = require('./demo_user.json')

/**
 * Proxy authentication session for this Embed demo
 *
 */
class EmbedSession extends ProxySession {

  constructor (public settings: IApiSettings, transport?: ITransport) {
    super(settings, transport)
  }

  async authenticate (props: any) {
    // get the auth token from the proxy server
    const token = await getProxyToken(gUser.external_user_id)
    if (token) {
      // Assign the token, which will track its expiration time automatically
      this.activeToken.setToken(token)
    }

    if (this.isAuthenticated()) {
      // Session is authenticated
      // set CORS mode (in this scenario)
      props.mode = 'cors'

      // remove any credentials attribute that may have been set
      // because the BrowserTransport defaults to having `same-origin` for credentials
      delete props['credentials']

      // replace the headers argument with required values
      // Note: using new Headers() to construct the headers breaks CORS for the Looker API. Don't know why yet
      props.headers = {
        'Authorization': `Bearer ${token.access_token}`,
        'x-looker-appid': agentTag
      }
    }
    return props
  }
}

const newLayout = (kpis: string[]) => {
  const copyOptions = JSON.parse(JSON.stringify(gEvent.dashboard.options))
  const elements = copyOptions.elements || {}
  const layout = copyOptions.layouts[0]
  const components = (layout.dashboard_layout_components) ? layout.dashboard_layout_components : {}
  const copyLayout = Object.assign({},layout)
  const newComponents: any = []
  Object.keys(elements).forEach(key => {
    const found = components.filter((c: any) => c.dashboard_element_id.toString() === key)[0]
    if (kpis.indexOf(elements[key]['title']) > -1) {
      newComponents.push(found)
    } else {
      newComponents.push(Object.assign(found,{ row: 0, column: 0, height: 0, width: 0 }))
    }
  })
  copyLayout.dashboard_layout_components = newComponents
  const copies = Object.assign({},elements)
  Object.keys(copies).forEach(key => {
    copies[key]['title_hidden'] = true //(copies[key]['vis_config']['type'] !== 'single_value')
  })
  gDashboard.setOptions({ layouts: [copyLayout], elements: copies })
}

const session = new EmbedSession({
  base_url: `https://${lookerHost}:19999`,
  api_version: '3.1'
} as IApiSettings)
gSDK = new LookerSDK(session)

interface IProxyToken {
  token: IAccessToken
}

const getProxyToken = async (externalUserId?: string) => {
  const token = await gSDK.ok(gSDK.authSession.transport.request<IProxyToken,IError>('GET',
    // TODO use the config variable for the server URL
    `http://embed.demo:8080/token${(externalUserId) ? `?external_user_id=${externalUserId}` : ''}`
  ))
  return token.token
}

const setupDashboard = async (dashboard: LookerEmbedDashboard) => {
  gDashboard = dashboard
  const dropdownFilter = document.querySelector('#dropdown-filter')
  if (dropdownFilter) {
    dropdownFilter.addEventListener('change', (event) => {
      dashboard.updateFilters({ [dashboardFilterField]: (event.target as HTMLSelectElement).value })
      dashboard.run()
    })
  }

  await buildTrending(null, gSDK)
  const visSwapper = document.querySelector('#vis-swap')
  if (visSwapper) {
    visSwapper.addEventListener('click', (event) => {
      swapVis(visSwapper, gEvent, gDashboard)
    })
  }

  const tableSwapper = document.querySelector('#table-swap')
  if (tableSwapper) {
    tableSwapper.addEventListener('click', (event) => {
      if (gFilters && gFilters['KPIs']) {
        tableSwap(tableSwapper, gEvent, gDashboard, gFilters)
      }
    })
  }
}

const setupLook = (look: LookerEmbedLook) => {
  const runButton = document.querySelector('#run')
  if (runButton) {
    runButton.addEventListener('click', () => look.run())
  }
  const dropdownFilter = document.querySelector('#state')
  if (dropdownFilter) {
    dropdownFilter.addEventListener('change', (event) => {
      look.updateFilters({ 'users.state': (event.target as HTMLSelectElement).value })
    })
  }
}

const dashboardRunComplete = (event: DashboardEvent) => {
  if (!gEvent || !gEvent.dashboard) {
    gEvent = event
  }
  clearDropdown()
  newLayout(event.dashboard.dashboard_filters['KPIs'].split(','))
}

document.addEventListener('DOMContentLoaded', function () {
  const logo = document.getElementById('logo')
  if (logo) { logo.setAttribute('src',logoUrl)}
  if (dashboardId) {
    LookerEmbedSDK.createDashboardWithId(dashboardId)
      .appendTo('#dashboard')
      .withClassName('looker-embed')
      .withFilters(gFilters)
      .on('dashboard:run:complete', dashboardRunComplete)
      .on('dashboard:filters:changed', filtersChanged)
      .build()
      .connect()
      .then(setupDashboard)
      .catch((error: Error) => {
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#demo-dashboard')!.style.display = 'none'
  }

  if (lookId) {
    LookerEmbedSDK.createLookWithId(lookId)
      .appendTo('#look')
      .on('look:run:start', () => updateState('#look-state', 'Running'))
      .on('look:run:complete', () => updateState('#look-state', 'Done'))
      .withClassName('looker-embed')
      .withFilters({ 'users.state': 'California' })
      .build()
      .connect()
      .then(setupLook)
      .catch((error: Error) => {
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#demo-look')!.style.display = 'none'
  }
})

const updateState = (selector: string, state: string) => {
  const dashboardState = document.querySelector(selector)
  if (dashboardState) {
    dashboardState.textContent = state
  }
}

const canceller = (event: any) => {
  updateState('#dashboard-state', `${event.label} clicked`)
  return { cancel: !event.modal }
}


// Javascript Event handlers

const filtersChanged = async (event: DashboardEvent) => {
  const filters = (event.dashboard.dashboard_filters) ? event.dashboard.dashboard_filters : {}
  const visSwapper = document.querySelector('#vis-swap')
  const tableSwapper = document.querySelector('#table-swap')
  if (gEvent) {
    if (filters[dashboardFilterDate] && gFilters && gFilters[dashboardFilterDate] && filters[dashboardFilterDate] !== gFilters[dashboardFilterDate]) {
      loadingIcon(true)
      await buildTrending(filters[dashboardFilterDate], gSDK)
      gDashboard.run()
    }
    if (filters['KPIs']) {
      if (gFilters && filters['KPIs'] !== gFilters['KPIs']) {
        newLayout(filters['KPIs'].split(','))
        if (filters['KPIs'].indexOf('Active Users') === -1 && visSwapper) {
          visSwapper.setAttribute('data-value','1')
          visSwapper.classList.add('violet')
          visSwapper.classList.add('disabled')
          visSwapper.classList.remove('black')
        } else {
          if (visSwapper) {
            visSwapper.classList.remove('disabled')
          }
        }
        if (tableSwapper) {
          tableSwapper.setAttribute('data-value','0')
          tableSwapper.classList.add('black')
          tableSwapper.classList.remove('violet')
        }
      }
    } else {
      newLayout([''])
    }
    if ((filters[dashboardFilterField] && gFilters[dashboardFilterField] && filters[dashboardFilterField] !== gFilters[dashboardFilterField] ||
        (!filters[dashboardFilterField] && gFilters[dashboardFilterField]) ||
        (filters[dashboardFilterField] && !gFilters[dashboardFilterField])
    )) {
      gDashboard.run()
    }
  }
  gFilters = filters
}