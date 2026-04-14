export interface ServerNavigationModule {
  id: string
  items?: string[]
}

export interface ServerNavigationPayload {
  modules: ServerNavigationModule[]
}

