import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { useState } from 'react'
import { NoteEditor, buildResponseBlockHTML } from '../NoteEditor'

describe('buildResponseBlockHTML', () => {
  it('insère un trait, un titre daté et un paragraphe vide', () => {
    const html = buildResponseBlockHTML(new Date(2026, 10, 12)) // 12/11/2026
    expect(html).toBe(
      '<hr><h2>Réponse de Gabriel du 12/11/2026 :</h2><p></p>'
    )
  })

  it('pad les jours et mois sur deux chiffres', () => {
    const html = buildResponseBlockHTML(new Date(2027, 0, 5)) // 05/01/2027
    expect(html).toBe('<hr><h2>Réponse de Gabriel du 05/01/2027 :</h2><p></p>')
  })

  it('utilise la date du jour par défaut', () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    expect(buildResponseBlockHTML()).toContain(
      `Réponse de Gabriel du ${day}/${month}/${now.getFullYear()} :`
    )
  })
})

/** Harnais : reproduit l'usage réel (NoteModal détient le state, l'éditeur renvoie du HTML). */
function Harness() {
  const [content, setContent] = useState('<p>Note existante</p>')
  return (
    <>
      <NoteEditor content={content} onChange={setContent} />
      <output data-testid='html'>{content}</output>
    </>
  )
}

describe('NoteEditor — bouton « Réponse »', () => {
  afterEach(cleanup)

  it('insère le bloc daté dans la note au clic', async () => {
    render(<Harness />)

    const button = await screen.findByTitle(/Insérer « Réponse de Gabriel/)
    fireEvent.click(button)

    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')

    await waitFor(() => {
      const html = screen.getByTestId('html').textContent || ''
      expect(html).toContain(`Réponse de Gabriel du ${day}/${month}/${now.getFullYear()} :`)
      expect(html).toContain('<hr>')
      // La note existante est conservée, le bloc est ajouté
      expect(html).toContain('Note existante')
    })
  })

  it('déclenche la même insertion avec Ctrl+Alt+R quand l’éditeur a le focus', async () => {
    render(<Harness />)

    const editable = document.querySelector('[contenteditable="true"]') as HTMLElement
    expect(editable).toBeTruthy()
    fireEvent.focus(editable)
    fireEvent.click(editable)

    // En vrai, un keydown a pour target l'élément focalisé (pas window)
    fireEvent.keyDown(editable, { key: 'r', ctrlKey: true, altKey: true })

    await waitFor(() => {
      const html = screen.getByTestId('html').textContent || ''
      expect(html).toContain('Réponse de Gabriel du')
    })
  })
})

/** Harnais : une note contenant un tableau HTML (format des réponses IA). */
function TableHarness() {
  const [content, setContent] = useState(
    '<p>Intro</p><table><tbody><tr><th>Indice</th><th>Valeur</th></tr><tr><td>tok/s</td><td>11.6</td></tr></tbody></table>'
  )
  return (
    <>
      <NoteEditor content={content} onChange={setContent} />
      <output data-testid='html'>{content}</output>
    </>
  )
}

describe('NoteEditor — tableaux', () => {
  afterEach(cleanup)

  it('préserve le tableau des notes IA à l’ouverture (pas de strip HTML)', async () => {
    render(<TableHarness />)

    await waitFor(() => {
      const editorEl = document.querySelector('.tiptap') as HTMLElement
      expect(editorEl.querySelector('table')).toBeTruthy()
      expect(editorEl.querySelector('th')?.textContent).toBe('Indice')
      const cells = editorEl.querySelectorAll('td')
      expect(cells[0]?.textContent).toBe('tok/s')
      expect(cells[1]?.textContent).toBe('11.6')
    })
  })

  it('insère un tableau 3×3 avec en-tête au clic sur le bouton toolbar', async () => {
    render(<TableHarness />)

    const button = await screen.findByTitle(/Insérer un tableau/)
    fireEvent.click(button)

    await waitFor(() => {
      const html = screen.getByTestId('html').textContent || ''
      expect(html).toContain('<table')
      expect(html).toContain('<th')
      // La note existante (avec son tableau) est conservée
      expect(html).toContain('Indice')
    })
  })
})

/** Harnais : une note contenant un lien (scénario du rapport de bug). */
function LinkHarness() {
  const [content, setContent] = useState(
    '<p>Voir <a href="https://example.com/ressource">la ressource</a></p>'
  )
  return (
    <>
      <NoteEditor content={content} onChange={setContent} />
      <output data-testid='html'>{content}</output>
    </>
  )
}

describe('NoteEditor — liens : clic gauche ouvre dans un nouvel onglet', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('appelle window.open(href, _blank, noopener) au clic sur un lien', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<LinkHarness />)

    await waitFor(() => {
      const editorEl = document.querySelector('.tiptap') as HTMLElement
      expect(editorEl.querySelector('a')).toBeTruthy()
    })
    const a = document.querySelector('.tiptap a') as HTMLAnchorElement
    fireEvent.click(a)

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/ressource',
      '_blank',
      'noopener'
    )
  })

  it('ne casse pas les clics hors lien (pas de window.open)', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<LinkHarness />)

    await waitFor(() => {
      const editorEl = document.querySelector('.tiptap') as HTMLElement
      expect(editorEl.querySelector('a')).toBeTruthy()
    })
    const p = document.querySelector('.tiptap p') as HTMLElement
    fireEvent.click(p)

    expect(openSpy).not.toHaveBeenCalled()
  })
})
