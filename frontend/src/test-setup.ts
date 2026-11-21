import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// jsdom 27 + vitest : le getter `localStorage`/`sessionStorage` de la window
// jsdom renvoie undefined une fois les globals copiés dans le contexte VM
// (l'origine vue cross-realm est traitée comme opaque). On branche les
// stockages réels de la window jsdom sur le global du test.
// (régression testée le 19/11/2026 — tous les tests composants échouaient
// sur `localStorage.getItem`.)
for (const [globalKey, winKey] of [
  ['localStorage', '_localStorage'],
  ['sessionStorage', '_sessionStorage'],
] as const) {
  if (typeof (globalThis as Record<string, unknown>)[globalKey] === 'undefined') {
    const dom = (globalThis as Record<string, any>).jsdom
    const storage = dom?.window?.[winKey]
    if (storage) {
      Object.defineProperty(globalThis, globalKey, {
        value: storage,
        configurable: true,
        writable: true,
      })
    }
  }
}

// Extends Vitest's expect method with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
  // La persistance des filtres utilise localStorage (partagé entre les tests
  // jsdom). On le vide à chaque test pour restaurer l'isolation.
  localStorage.clear()
  // Les filtres sont aussi miroités dans l'URL (query params). Le window jsdom
  // est partagé entre les tests du fichier : on réinitialise l'URL pareil.
  window.history.replaceState(null, '', '/')
})