import { useState } from 'react'
import { api } from '../utils/api'

interface CSVImportExportProps {
  onImportSuccess: () => void
}

export function CSVImportExport({ onImportSuccess }: CSVImportExportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState<string>('')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Vérifier que le token existe
      const token = localStorage.getItem('token')
      console.log('🔑 Token présent:', !!token)

      const csvContent = await api.exportTasks()
      console.log('📄 Contenu CSV reçu:', csvContent.size, 'bytes')

      // Créer un lien de téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `tasks-export-${new Date().toISOString().split('T')[0]}.csv`
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      alert("Erreur lors de l'export des tâches")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportErrors([])
    setImportSuccess('')

    try {
      const text = await file.text()

      const response = await api.importTasks(text)

      if (response.errors && response.errors.length > 0) {
        setImportErrors(response.errors)
      }

      if (response.importedCount > 0) {
        setImportSuccess(
          `${response.importedCount} tâches importées avec succès !`
        )
        onImportSuccess()
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error)
      alert("Erreur lors de l'import des tâches")
    } finally {
      setIsImporting(false)
      // Réinitialiser l'input file
      event.target.value = ''
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Export / Import CSV
      </h3>

      <div className='space-y-4'>
        {/* Export */}
        <div>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>
            Exporter vos tâches
          </h4>
           <p className='text-sm text-gray-600 mb-3'>
             Téléchargez vos tâches actives au format CSV pour les sauvegarder ou
             les partager. Les tâches terminées ne sont pas incluses dans l'export.
           </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
          >
            {isExporting ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Export en cours...
              </>
            ) : (
              <>
                <svg
                  className='w-5 h-5 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                Exporter en CSV
              </>
            )}
          </button>
        </div>

        <div className='border-t border-gray-200 pt-4'>
          {/* Import */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-2'>
              Importer des tâches
            </h4>
            <p className='text-sm text-gray-600 mb-3'>
              Importez des tâches depuis un fichier CSV. Les tags seront créés
              automatiquement si ils n'existent pas.
            </p>
            <div className='flex items-center space-x-3'>
              <label className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50'>
                <input
                  type='file'
                  accept='.csv'
                  onChange={handleImport}
                  disabled={isImporting}
                  className='hidden'
                />
                {isImporting ? (
                  <>
                    <svg
                      className='animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Import en cours...
                  </>
                ) : (
                  <>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                      />
                    </svg>
                    Choisir un fichier CSV
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Messages de succès/erreur */}
          {importSuccess && (
            <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-md'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <svg
                    className='h-5 w-5 text-green-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <p className='text-sm text-green-800'>{importSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-md'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <svg
                    className='h-5 w-5 text-red-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Erreurs lors de l'import ({importErrors.length})
                  </h3>
                  <div className='mt-2 text-sm text-red-700'>
                    <ul className='list-disc pl-5 space-y-1'>
                      {importErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {importErrors.length > 5 && (
                        <li>... et {importErrors.length - 5} autres erreurs</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informations sur le format */}
        <div className='mt-6 p-4 bg-gray-50 rounded-md'>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>
            Format du fichier CSV
          </h4>
          <div className='text-sm text-gray-600 space-y-1'>
            <p>Le fichier CSV doit contenir les colonnes suivantes :</p>
            <ul className='list-disc pl-5 space-y-1'>
              <li>
                <strong>Nom</strong> : Nom de la tâche (obligatoire)
              </li>
              <li>
                <strong>Lien</strong> : URL associée (optionnel)
              </li>
              <li>
                <strong>Importance</strong> : 1-9 (1 = critique, 9 = faible)
              </li>
              <li>
                <strong>Urgence</strong> : 1-9 (1 = critique, 9 = faible)
              </li>
              <li>
                <strong>Priorité</strong> : 1-9 (1 = critique, 9 = faible)
              </li>
              <li>
                <strong>Date prévue</strong> : YYYY-MM-DD (optionnel)
              </li>
              <li>
                <strong>Tags</strong> : Séparés par des points-virgules
                (optionnel)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
