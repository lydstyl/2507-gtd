import { useState } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <h1 className='text-2xl font-bold text-blue-600'>🚀 GTD App</h1>
            </div>

            <nav className='flex items-center space-x-4'>
              {!isLoggedIn ? (
                <div className='flex items-center space-x-3'>
                  <button className='text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors'>
                    Se connecter
                  </button>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'>
                    S'inscrire
                  </button>
                </div>
              ) : (
                <div className='flex items-center space-x-4'>
                  <span className='text-gray-700 text-sm font-medium'>
                    Utilisateur
                  </span>
                  <button className='border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors'>
                    Déconnexion
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>
        {!isLoggedIn ? (
          /* Hero Section */
          <div className='relative overflow-hidden'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
              <div className='text-center'>
                <h2 className='text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl'>
                  Organisez votre vie avec la méthode{' '}
                  <span className='text-blue-600'>GTD</span>
                </h2>
                <p className='mt-6 max-w-2xl mx-auto text-xl text-gray-500'>
                  Une application simple et efficace pour gérer vos tâches,
                  projets et idées selon la méthode Getting Things Done.
                </p>

                {/* Features Grid */}
                <div className='mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
                  <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
                    <div className='text-3xl mb-4'>📋</div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      Gestion des tâches
                    </h3>
                    <p className='text-gray-600 text-sm'>
                      Créez et organisez vos tâches avec des priorités et des
                      échéances
                    </p>
                  </div>

                  <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
                    <div className='text-3xl mb-4'>🏷️</div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      Système de tags
                    </h3>
                    <p className='text-gray-600 text-sm'>
                      Catégorisez vos tâches avec des tags personnalisés
                    </p>
                  </div>

                  <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
                    <div className='text-3xl mb-4'>🔐</div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      Sécurisé
                    </h3>
                    <p className='text-gray-600 text-sm'>
                      Vos données sont protégées et privées
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className='mt-12 flex flex-col sm:flex-row gap-4 justify-center'>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors'>
                    Commencer maintenant
                  </button>
                  <button className='border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-colors'>
                    En savoir plus
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard */
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Tableau de bord
              </h2>
              <p className='text-gray-600 mb-8'>
                Bienvenue dans votre espace de travail GTD !
              </p>

              {/* Stats Grid */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='bg-blue-50 rounded-lg p-6 text-center'>
                  <div className='text-3xl font-bold text-blue-600 mb-2'>0</div>
                  <div className='text-sm font-medium text-gray-600'>
                    Tâches en cours
                  </div>
                </div>

                <div className='bg-green-50 rounded-lg p-6 text-center'>
                  <div className='text-3xl font-bold text-green-600 mb-2'>
                    0
                  </div>
                  <div className='text-sm font-medium text-gray-600'>
                    Tâches terminées
                  </div>
                </div>

                <div className='bg-purple-50 rounded-lg p-6 text-center'>
                  <div className='text-3xl font-bold text-purple-600 mb-2'>
                    0
                  </div>
                  <div className='text-sm font-medium text-gray-600'>
                    Tags créés
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-400'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <p className='text-sm'>
              &copy; 2025 GTD App. Construit avec React et Node.js.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
