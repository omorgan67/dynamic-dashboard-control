// The address of your Looker instance. Required.
export const lookerHost = 'saleseng.dev.looker.com'

// A dashboard that the user can see. Set to 0 to disable dashboard.
export const dashboardId = 715

// A Look that the user can see. Set to 0 to disable look.
export const lookId = 0


export const queryFilterField: string = 'users.state'
export const dashboardFilterField: string = 'State'
export const elementToVisSwap: string = '4141'

export const queryMeasureField: string = 'period_over_period'
export const dashboardFilterDate: string = 'Dates'
export const queryFilterDate: string = 'order_items.previous_period_filter'

export const logoUrl: string = 'https://lever-client-logos.s3.amazonaws.com/8409767c-5cbe-4597-9d88-193437980b30-1537395984831.png'

export const apiDropdownQuery = {

    "view": "order_items",
    "fields": [
        "this_period",
        "previous_period",
        "users.state"
    ],
    "filters": {
        "order_items.previous_period_filter": "30 days",
        "users.country": "USA"
    },
    "sorts": [
        "period_over_period desc"
    ],
    "limit": "500",
    "model": "thelook",
    "dynamic_fields": "[{\"measure\":\"this_period\",\"based_on\":\"order_items.total_sale_price\",\"label\":\"This Period\",\"value_format\":null,\"value_format_name\":null,\"_kind_hint\":\"measure\",\"_type_hint\":\"number\",\"filter_expression\":\"${order_items.previous_period} = \\\"This Period\\\"\"},{\"measure\":\"previous_period\",\"based_on\":\"order_items.total_sale_price\",\"label\":\"Previous Period\",\"value_format\":null,\"value_format_name\":null,\"_kind_hint\":\"measure\",\"_type_hint\":\"number\",\"filter_expression\":\"${order_items.previous_period} = \\\"Previous Period\\\"\"},{\"table_calculation\":\"period_over_period\",\"label\":\"Period Over Period\",\"expression\":\"${this_period} / ${previous_period} - 1\",\"value_format\":null,\"value_format_name\":\"percent_1\",\"_kind_hint\":\"measure\",\"_type_hint\":\"number\"}]"
}

export const visSwap = {
  'type': 'looker_bar',
  'show_x_axis_label': false,
  "series_colors": {
    "order_items.first_purchase_count": "#149888",
    "Female - users.count": "#FFB690",
    "Male - users.count": "#8643B1"
},
}