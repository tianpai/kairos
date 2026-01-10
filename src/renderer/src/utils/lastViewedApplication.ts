const STORAGE_KEY = 'last-viewed-application'

export function getLastViewedApplicationId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setLastViewedApplicationId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id)
}

export function clearLastViewedApplicationId(): void {
  localStorage.removeItem(STORAGE_KEY)
}
