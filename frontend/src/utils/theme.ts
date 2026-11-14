export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'gtd-theme'

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme, animate = true): void {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 300)
  }
  root.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // stockage indisponible (navigation privée) : le thème ne sera pas mémorisé
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#1f2937')
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
