import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Heading from '@tiptap/extension-heading'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function NoteEditor({
  content,
  onChange,
  placeholder
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
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
      })
    ],
    content: content || '',
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
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  if (!editor) {
    return null
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
    <div className='border border-gray-300 rounded-lg overflow-hidden'>
      {/* Toolbar */}
      <div className='bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1'>
        {/* Text formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive('bold')
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-200'
          }`}
          title='Gras'
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
          title='Italique'
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
          title='Souligné'
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
          title='Barré'
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
          title='Titre 1'
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
          title='Titre 2'
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
          title='Titre 3'
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
          title='Liste à puces'
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
          title='Liste numérotée'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M2 6a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6zM14 6a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V6zM14 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z' />
          </svg>
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
          title='Ajouter un lien'
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
      </div>

      {/* Editor content */}
      <div className='bg-white'>
        <EditorContent editor={editor} />
        {!content && placeholder && (
          <div className='absolute top-0 left-0 p-4 text-gray-400 pointer-events-none'>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
