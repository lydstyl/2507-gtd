import { describe, it, expect } from 'vitest'
import { isSaveForm, resolveSaveForm } from '../saveFormOverride'

const liveForm = {
  name: 'Tâche vivante',
  link: '',
  importance: 300,
  complexity: 3,
  status: 'brouillon',
  plannedDate: '2026-11-27',
  dueDate: '2026-11-30',
  tagIds: ['tag-1']
}

/** Événement de clic React minimal : porte une référence circulaire. */
function makeClickEvent() {
  const fiber: Record<string, unknown> = { tag: 'BUTTON' }
  fiber.return = fiber // cycle, comme une FiberNode React
  return {
    type: 'click',
    target: { nodeName: 'BUTTON' },
    _targetInst: fiber,
    preventDefault: () => {}
  }
}

describe('isSaveForm', () => {
  it('accepte un FormState complet', () => {
    expect(isSaveForm(liveForm)).toBe(true)
  })

  it("refuse l'événement de clic React (cause du bug 27/11/2026)", () => {
    const event = makeClickEvent()
    expect(isSaveForm(event)).toBe(false)
    // Preuve du symptôme : c'est exactement ce que faisait saveAll(event)
    expect(() => JSON.stringify(event)).toThrow(/circular/i)
  })

  it('refuse undefined, null, un tableau, un objet partiel', () => {
    expect(isSaveForm(undefined)).toBe(false)
    expect(isSaveForm(null)).toBe(false)
    expect(isSaveForm([])).toBe(false)
    expect(isSaveForm({ name: 'x' })).toBe(false)
    expect(isSaveForm({ ...liveForm, tagIds: [1, 2] })).toBe(false)
    expect(isSaveForm({ ...liveForm, importance: '300' })).toBe(false)
  })
})

describe('resolveSaveForm', () => {
  it('utilise le formulaire modifié quand un raccourci clavier en passe un', () => {
    const changed = { ...liveForm, plannedDate: '2026-12-01', dueDate: '2026-12-05' }
    expect(resolveSaveForm(changed, liveForm)).toBe(changed)
  })

  it("retombe sur le formulaire vivant quand l'argument est un événement de clic", () => {
    const resolved = resolveSaveForm(makeClickEvent(), liveForm)
    expect(resolved).toBe(liveForm)
    // La sauvegarde redevient sérialisable : plus d'erreur « inattendue »
    expect(() => JSON.stringify(resolved)).not.toThrow()
    expect(JSON.parse(JSON.stringify(resolved)).plannedDate).toBe('2026-11-27')
  })

  it('retombe sur le formulaire vivant quand aucun override n’est fourni', () => {
    expect(resolveSaveForm(undefined, liveForm)).toBe(liveForm)
  })
})
