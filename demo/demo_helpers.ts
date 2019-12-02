import { queryFilterField, queryFilterDate, queryMeasureField, apiDropdownQuery, visSwap, elementToVisSwap } from "./demo_config"
import { LookerSDK } from "@looker/sdk"
import { DashboardEvent, LookerEmbedFilterParams, LookerEmbedEvent } from "../src/types"
import { LookerEmbedDashboard } from "../src"


const dropdownHeader = (innerHTML: string) => {
  const header = document.createElement('div')
  header.classList.add('header')
  header.innerHTML = innerHTML
  return header
}

const dropdownItem = (row: any) => {
  const item = document.createElement('div')
  item.setAttribute('data-value',row[queryFilterField])
  item.classList.add('item')
  const options = (row[queryMeasureField] > 0) ? ['green','▲'] : (row[queryMeasureField] < 0) ? ['red','▼'] : ['black','']
  const format = Number(row[queryMeasureField]).toLocaleString(undefined,{ style: 'percent', minimumFractionDigits: 2 })
  item.innerHTML = `${row[queryFilterField]} <font color="${options[0]}">${options[1]} ${format}</font>`
  return item
}

export const loadingIcon = (loading: boolean) => {
  const loader = document.getElementById('dropdown-icon-loader')
  const icon = document.getElementById('dropdown-icon')
  if (loader && icon) {
    icon.style.display = (loading) ? 'none' : ''
    loader.style.display = (loading) ? '' : 'none'
  }
  if (loading) {
    clearDropdown()
  }
}

export const clearDropdown = () => {
  const text = document.getElementById('dropdown-text')
  if (text) {
    text.innerHTML = 'States'
    text.classList.add('default')
  }
}

export const buildTrending = async (dateFilter: string | null = null, SDK: LookerSDK) => {
  
  const queryUpdate: any = apiDropdownQuery
  if (dateFilter && queryUpdate && queryUpdate['filters']) {
    queryUpdate['filters'][queryFilterDate] = dateFilter
  }
  // const query: any = await SDK.ok(SDK.create_query(queryUpdate))
  // const data: any = await SDK.ok(SDK.run_query({
  //   result_format: 'json',
  //   query_id: query.id
  // }))
  const query: any = await fetch(`/query?Query=${JSON.stringify(queryUpdate)}`)
  const data = await query.json()
  console.log(data)
  loadingIcon(false)
  const menu = document.createElement('div')
  data.forEach((row: any) => {
    menu.appendChild(dropdownItem(row))
  })
  const dropdown = document.getElementById('dropdown-menu')
  if (dropdown) {
    dropdown.innerHTML = menu.innerHTML || ''
  }
}

export const tableSwap = (tableSwapper: any, Event: DashboardEvent, Dashboard: LookerEmbedDashboard, Filters: LookerEmbedFilterParams) => {
  const swapTargets = ['looker_line','looker_bar', 'looker_column', 'looker_area']
  const newElements: any = {}
  const elements = (Event && Event.dashboard && Event.dashboard.options && Event.dashboard.options && Event.dashboard.options.elements)
    ? JSON.parse(JSON.stringify(Event.dashboard.options.elements))
    : {}
  if (tableSwapper.getAttribute('data-value') === '0') {
    Object.keys(elements).forEach((key: string) => {
      if (elements[key] && elements[key]['vis_config'] && elements[key]['vis_config']['type'] && swapTargets.indexOf(elements[key]['vis_config']['type']) > -1) {
        newElements[key] = elements[key]
        newElements[key]['vis_config']['type'] = 'looker_grid'
      }
    })
    tableSwapper.setAttribute('data-value','1')
    tableSwapper.classList.add('violet')
    tableSwapper.classList.remove('black')
    Dashboard.setOptions({ elements: newElements })
  } else {
    Object.keys(elements).forEach((key: string) => {
      if (elements[key] && elements[key]['vis_config'] && elements[key]['vis_config']['type'] && swapTargets.indexOf(elements[key]['vis_config']['type']) > -1) {
        // if (Filters && Filters['KPIs'] && Filters['KPIs'].indexOf(elements[key]['title']) > -1) {
          newElements[key] = elements[key]
        // }
      }
    })
    tableSwapper.setAttribute('data-value','0')
    tableSwapper.classList.add('black')
    tableSwapper.classList.remove('violet')
  }

  if (newElements !== {}) {
    Dashboard.setOptions({ elements: newElements })
  }
}

export const swapVis = (visSwapper: any, Event: DashboardEvent, Dashboard: LookerEmbedDashboard) => {
  const changeVisConfig = Object.keys(visSwap)
  const original = (Event && Event.dashboard && Event.dashboard.options && Event.dashboard.options.elements && Event.dashboard.options.elements[elementToVisSwap])
    ? Event.dashboard.options.elements[elementToVisSwap].vis_config
    : {}
  let elements: any = {}
  if (visSwapper.getAttribute('data-value') === '1') {
    visSwapper.classList.add('black')
    visSwapper.classList.remove('violet')
    visSwapper.setAttribute('data-value', '0')
    elements = { [elementToVisSwap]: { vis_config: visSwap , title_hidden: true}}
  } else {
    visSwapper.classList.add('violet')
    visSwapper.classList.remove('black')
    visSwapper.setAttribute('data-value', '1')
    elements = { [elementToVisSwap]: { vis_config: {},title_hidden: true } }
    changeVisConfig.forEach(key => {
      elements[elementToVisSwap]['vis_config'][key] = original[key]
    })
  }
  Dashboard.setOptions({ elements })
}