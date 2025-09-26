import { Workbox } from 'workbox-window'

let wb: Workbox | undefined

export function registerSW() {
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js')

    wb.addEventListener('controlling', () => {
      // Service worker is controlling the page
      console.log('Service worker is controlling the page')
    })

    wb.addEventListener('waiting', () => {
      // A new service worker is waiting to take control
      console.log('A new service worker is waiting')
      // You could show a prompt to the user to refresh the page
      if (confirm('New version available! Refresh to update?')) {
        wb?.addEventListener('controlling', () => {
          window.location.reload()
        })
        wb?.messageSkipWaiting()
      }
    })

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('Service worker updated')
      } else {
        console.log('Service worker installed for the first time')
      }
    })

    wb.register()
      .then(() => {
        console.log('Service worker registered successfully')
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error)
      })
  }
}

export function getWB() {
  return wb
}

// Check if the app is running as a PWA
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true
}

// Check if the app can be installed
export function canInstall(): boolean {
  return 'beforeinstallprompt' in window
}

// Install prompt management
let deferredPrompt: any = null

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e
  })
}

export function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      deferredPrompt = null
    })
  }
}

export function hasInstallPrompt(): boolean {
  return deferredPrompt !== null
}