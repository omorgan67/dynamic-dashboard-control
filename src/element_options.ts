export interface ElementOptionItems {
  [key: string]: any
}

export interface ElementOptions {
  [id: string]: ElementOptionItems // ID of component
}

export interface DashboardOptions {
  layouts?: any // DashboardLayout[]
  elements?: ElementOptions
}
