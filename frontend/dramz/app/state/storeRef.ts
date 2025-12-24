import type { AppStore } from './store'

let globalStore: AppStore | null = null

export function setGlobalStore(store: AppStore) {
  globalStore = store
}

export function getGlobalStore(): AppStore | null {
  return globalStore
}

