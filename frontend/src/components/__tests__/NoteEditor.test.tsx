import { describe, it, expect, afterEach } from 'vitest'
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

    fireEvent.keyDown(window, { key: 'r', ctrlKey: true, altKey: true })

    await waitFor(() => {
      const html = screen.getByTestId('html').textContent || ''
      expect(html).toContain('Réponse de Gabriel du')
    })
  })
})
