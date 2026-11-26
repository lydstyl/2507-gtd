import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Heading from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { uploadImage, imageSrcWithToken, fileEmbedHtml, refreshEmbeddedTokens } from '../services/imageApi'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

/**
 * Bloc « Réponse de Gabriel » inséré au curseur : trait de séparation + titre
 * daté + paragraphe vide prêt à recevoir la réponse à un LLM.
 * La date est celle du jour, au format français dd/mm/yyyy.
 */
export function buildResponseBlockHTML(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `<hr><h2>Réponse de Gabriel du ${day}/${month}/${year} :</h2><p></p>`
}

export function NoteEditor({
  content,
  onChange,
  placeholder
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      // Pas d'Image dans le StarterKit 2.27+ → extension Image dédiée
      // (upload serveur, pas de data URLs base64 dans les notes).
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer'
        }
      }),
      Underline,
      Strike,
      Heading.configure({
        levels: [1, 2, 3]
      }),
      // Image : collage d'une image → upload serveur, insertion de l'URL
      // (plutôt que base64 dans le HTML de la note).
      Image.configure({
        HTMLAttributes: {
          // Curseur pointer : signale que l'image est cliquable (→ nouvel onglet).
          style: 'cursor: pointer'
        },
        handlePaste: async (file: File, ed) => {
          try {
            const { url, name } = await uploadImage(file)
            ed
              .chain()
              .focus()
              .setImage({ src: imageSrcWithToken(url), alt: name })
              .run()
            return true
          } catch (err) {
            console.error('Échec upload image (paste):', err)
            alert(`Échec de l'upload de l'image : ${(err as Error).message}`)
            return false
          }
        }
      }),
      // Tableaux : rend les <table> des notes (réponses IA, notes manuelles)
      // visibles et modifiables. resizable:false = pas de poignées de redimension.
      Table.configure({
        resizable: false
      }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: refreshEmbeddedTokens(content || ''),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4'
      }
    }
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Tokens embarqués rafraîchis : les images des notes anciennes
      // (JWT de 7 jours expiré dans le src) rechargent au lieu de casser.
      editor.commands.setContent(refreshEmbeddedTokens(content || ''))
    }
  }, [content, editor])

  // État upload (bouton Image + bouton Fichier + drop)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Mode lecture : note centrée, largeur max ~600 px (confort de lecture).
  // Préférence persistée (localStorage) — identique pour toutes les notes.
  const [comfortMode, setComfortMode] = useState(() => {
    try {
      return localStorage.getItem('gtd-note-comfort') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('gtd-note-comfort', comfortMode ? '1' : '0')
    } catch {
      /* stockage indisponible : le mode reste actif pour la session */
    }
  }, [comfortMode])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileAnyRef = useRef<HTMLInputElement>(null)

  // Raccourcis de navigation de note : boutons « ↑ Haut » / « ↓ Bas » qui
  // scrollent la fenêtre tout en haut / tout en bas de la note (sans scroller).
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollToTop = () =>
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

  // Bouton « Image » : sélection multiple → upload → insertion au curseur.
  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || !editor) return
    setUploadingImage(true)
    try {
      for (const file of files) {
        const { url, name } = await uploadImage(file)
        editor
          .chain()
          .focus()
          .setImage({ src: imageSrcWithToken(url), alt: name })
          .run()
      }
    } catch (err) {
      console.error('Échec upload image (bouton):', err)
      alert(`Échec de l'upload de l'image : ${(err as Error).message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  // Bouton « Fichier » : audio / vidéo / PDF → upload → insertion au curseur.
  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || !editor) return
    setUploadingFile(true)
    try {
      for (const file of files) {
        const { url } = await uploadImage(file)
        editor
          .chain()
          .focus()
          .insertContent(fileEmbedHtml(file, url))
          .run()
      }
    } catch (err) {
      console.error('Échec upload fichier (bouton):', err)
      alert(`Échec de l'upload du fichier : ${(err as Error).message}`)
    } finally {
      setUploadingFile(false)
    }
  }

  // Glisser-déposer d'images dans l'éditeur → upload (capture avant ProseMirror).
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const onDrop = (e: DragEvent) => {
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('audio/') ||
        f.type.startsWith('video/') ||
        f.type === 'application/pdf'
      )
      if (files.length === 0) return
      e.preventDefault()
      e.stopPropagation()
      const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
      const insertPos = coords?.pos ?? editor.state.selection.from
      setUploadingImage(true)
      void (async () => {
        try {
          for (const file of files) {
            const { url, name } = await uploadImage(file)
            const html = file.type.startsWith('image/')
              ? `<img src="${imageSrcWithToken(url)}" alt="${name}">`
              : fileEmbedHtml(file, url)
            editor
              .chain()
              .focus()
              .insertContentAt(insertPos, html)
              .run()
          }
        } catch (err) {
          console.error('Échec upload image (drop):', err)
          alert(`Échec de l'upload de l'image : ${(err as Error).message}`)
        } finally {
          setUploadingImage(false)
        }
      })()
    }
    dom.addEventListener('drop', onDrop, true)
    return () => dom.removeEventListener('drop', onDrop, true)
  }, [editor])

  // Clic sur une image → l'ouvre dans un nouvel onglet (vue pleine taille).
  // Délégué sur le DOM de l'éditeur : couvre toutes les images (bouton,
  // collage, glisser-déposer) sans toucher aux chemins d'insertion.
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (t && t.tagName === 'IMG') {
        e.preventDefault()
        window.open((t as HTMLImageElement).src, '_blank', 'noopener')
      }
    }
    dom.addEventListener('click', onClick)
    return () => dom.removeEventListener('click', onClick)
  }, [editor])

  // Raccourcis clavier des boutons de mise en forme de la note.
  // Gérés ici (pas dans les raccourcis globaux) : ils ne s'activent QUE quand
  // le focus est DANS l'éditeur (editor.isFocused). Quand le focus est dans
  // l'éditeur, les raccourcis de la page (B/P/L/R/…, D/W/M/T/E, 1-9…) sont
  // inactifs (focus dans un champ) → aucun doublon possible.
  // Gras (Ctrl+B), Italique (Ctrl+I) et Barré (Ctrl+Shift+S) sont déjà gérés
  // nativement par TipTap → on ne les redéfinit PAS (double toggle = nul).
  // Évite volontairement Ctrl+S (sauvegarde) et Escape (retour), qui marchent
  // partout y compris dans l'éditeur.
  useEffect(() => {
    if (!editor) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!editor.isFocused) return
      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      // Souligné : Ctrl+U
      if (mod && !event.altKey && !event.shiftKey && key === 'u') {
        event.preventDefault()
        editor.chain().focus().toggleUnderline().run()
        return
      }

      // Lien : Ctrl+K
      if (mod && !event.altKey && !event.shiftKey && key === 'k') {
        event.preventDefault()
        const url = window.prompt("Entrez l'URL du lien:")
        if (url) editor.chain().focus().setLink({ href: url }).run()
        return
      }

      // Listes (convention Word) : Ctrl+Shift+8 = puces, Ctrl+Shift+7 = numérotée.
      if (mod && event.shiftKey && !event.altKey) {
        if (event.key === '8') {
          event.preventDefault()
          editor.chain().focus().toggleBulletList().run()
          return
        }
        if (event.key === '7') {
          event.preventDefault()
          editor.chain().focus().toggleOrderedList().run()
          return
        }
      }

      // Famille Ctrl+Alt : Titres 1-3 · Haut/Bas · Lecture · Réponse
      if (mod && event.altKey) {
        const level = parseInt(event.key, 10)
        if (level >= 1 && level <= 3) {
          event.preventDefault()
          editor.chain().focus().toggleHeading({ level }).run()
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
          return
        }
        if (key === 'l') {
          event.preventDefault()
          setComfortMode((v) => !v)
          return
        }
        if (key === 'r') {
          event.preventDefault()
          editor.chain().focus().insertContent(buildResponseBlockHTML()).run()
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor])

  if (!editor) {
    return null
  }

  const insertResponseBlock = () => {
    editor.chain().focus().insertContent(buildResponseBlockHTML()).run()
  }

  const addLink = () => {
    const url = window.prompt("Entrez l'URL du lien:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
  }

  return (
    // Pas d'overflow-hidden ici : un parent en overflow:hidden devient le
    // référentiel de la sticky et annulerait le collage au scroll (NoteModal).
    <div ref={containerRef} className='border border-gray-300 rounded-lg'>
      {/* Toolbar sticky : reste visible en haut du scroll de la note */}
      <div className='sticky top-0 z-10 bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1 rounded-t-lg'>
        {/* Text formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive('bold')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Gras (Ctrl+B)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M12.6 18H6V2h4.5a4.5 4.5 0 0 1 3.5 1.5 4.5 4.5 0 0 1 1.5 3.5 4.5 4.5 0 0 1-1.5 3.5A4.5 4.5 0 0 1 12.6 18zm0-12a2.5 2.5 0 0 0-2.5-2.5H8v5h2.1a2.5 2.5 0 0 0 2.5-2.5z' />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive('italic')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Italique (Ctrl+I)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M8 2h8v2h-3l-1 6h4v2H6V2h2z' />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${
            editor.isActive('underline')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Souligné (Ctrl+U)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M3 17.25V21h14v-3.75H3zM5 2v10h2V9h6v3h2V2H5z' />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded ${
            editor.isActive('strike')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Barré (Ctrl+Shift+S)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M7.24 8.75a6 6 0 0 0 2.24 4.61l1.36-1.36a4 4 0 0 1-1.84-3.25H7.24zm8.52-1.5H9.5a4 4 0 0 1 1.84-3.25l1.36 1.36a6 6 0 0 0-2.24 4.61h2.24z' />
          </svg>
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Headings */}
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-2 rounded ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Titre 1 (Ctrl+Alt+1)'
        >
          H1
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-2 rounded ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Titre 2 (Ctrl+Alt+2)'
        >
          H2
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`p-2 rounded ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Titre 3 (Ctrl+Alt+3)'
        >
          H3
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${
            editor.isActive('bulletList')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Liste à puces (Ctrl+Shift+8)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${
            editor.isActive('orderedList')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Liste numérotée (Ctrl+Shift+7)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M2 6a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6zM14 6a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V6zM14 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z' />
          </svg>
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Tableaux — insertion + gestion lignes/colonnes */}
        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className='p-2 rounded hover:bg-gray-200'
          title="Insérer un tableau 3×3 avec en-tête"
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
            <rect x='3' y='4' width='18' height='16' rx='1' />
            <path d='M3 10h18M3 15h18M9 4v16M15 4v16' />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className='p-2 rounded hover:bg-gray-200 text-xs'
          title='Ajouter une ligne après la ligne courante'
        >
          + Ligne
        </button>

        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          className='p-2 rounded hover:bg-gray-200 text-xs'
          title='Supprimer la ligne courante'
        >
          − Ligne
        </button>

        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className='p-2 rounded hover:bg-gray-200 text-xs'
          title='Ajouter une colonne après la colonne courante'
        >
          + Col
        </button>

        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className='p-2 rounded hover:bg-gray-200 text-xs'
          title='Supprimer la colonne courante'
        >
          − Col
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          className={`p-2 rounded text-xs ${
            editor.isActive('table') && editor.isActive('tableHeaderRow')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title="Activer/désactiver la ligne d'en-tête"
        >
          En-tête
        </button>

        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          className='p-2 rounded hover:bg-gray-200 text-xs text-red-600'
          title='Supprimer le tableau'
        >
          Suppr
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Links */}
        <button
          onClick={addLink}
          className={`p-2 rounded ${
            editor.isActive('link')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Ajouter un lien (Ctrl+K)'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5.5 5.5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z' />
          </svg>
        </button>

        {editor.isActive('link') && (
          <button
            onClick={removeLink}
            className='p-2 rounded hover:bg-gray-200 text-red-600'
            title='Supprimer le lien'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' />
            </svg>
          </button>
        )}

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Bloc réponse à un LLM — inséré au curseur */}
        <button
          onClick={insertResponseBlock}
          className='p-2 rounded hover:bg-gray-200 flex items-center gap-1 text-xs font-semibold text-blue-700'
          title='Insérer « Réponse de Gabriel du JJ/MM/AAAA : » au curseur (Ctrl+Alt+R)'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M8 10h8M8 14h5M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z'
            />
          </svg>
          Réponse
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Images — bouton multiple + coller + glisser-déposer */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className='p-2 rounded hover:bg-gray-200 flex items-center gap-1 text-xs font-semibold text-blue-700 disabled:opacity-50'
          title='Ajouter des images (bouton, collage Ctrl+V, ou glisser-déposer)'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          {uploadingImage ? '…' : 'Image'}
        </button>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={onFilesSelected}
        />

        {/* Fichiers — audio / vidéo / PDF (bouton + glisser-déposer) */}
        <button
          onClick={() => fileAnyRef.current?.click()}
          disabled={uploadingFile}
          className='p-2 rounded hover:bg-gray-200 flex items-center gap-1 text-xs font-semibold text-blue-700 disabled:opacity-50'
          title='Ajouter un fichier : audio, vidéo ou PDF (bouton ou glisser-déposer)'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.171 7'
            />
          </svg>
          {uploadingFile ? '…' : 'Fichier'}
        </button>
        <input
          ref={fileAnyRef}
          type='file'
          accept='audio/*,video/*,application/pdf'
          multiple
          className='hidden'
          onChange={onFileSelected}
        />

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Navigation de note : sauter tout en haut / tout en bas (sans scroller) */}
        <button
          onClick={scrollToTop}
          className='p-2 rounded hover:bg-gray-200 flex items-center gap-1 text-xs font-semibold text-gray-700'
          title='Aller tout en haut de la note (Ctrl+Alt+↑)'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M5 15l7-7 7 7M5 19l7-7 7 7' />
          </svg>
          Haut
        </button>
        <button
          onClick={scrollToBottom}
          className='p-2 rounded hover:bg-gray-200 flex items-center gap-1 text-xs font-semibold text-gray-700'
          title='Aller tout en bas de la note (Ctrl+Alt+↓)'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7M19 5l-7 7-7-7' />
          </svg>
          Bas
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        {/* Mode lecture : note centrée, largeur max ~600 px (confort de lecture) */}
        <button
          onClick={() => setComfortMode((v) => !v)}
          className={`p-2 rounded flex items-center gap-1 text-xs font-semibold ${
            comfortMode
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200 text-gray-700'
          }`}
          title='Mode lecture : note centrée, largeur max ~600 px (Ctrl+Alt+L)'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M7 12h10M10 18h4' />
          </svg>
          Lecture
        </button>
      </div>

      {/* Editor content — mode lecture : colonne centrée ~600 px */}
      <div className={`bg-white ${comfortMode ? 'mx-auto max-w-[600px]' : ''}`}>
        <EditorContent editor={editor} />
        {/* Ancre bas de note : cible du bouton « ↓ Bas » (scrollIntoView block:end). */}
        <div ref={bottomRef} aria-hidden='true'></div>
        {!content && placeholder && (
          <div className='absolute top-0 left-0 p-4 text-gray-400 pointer-events-none'>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
