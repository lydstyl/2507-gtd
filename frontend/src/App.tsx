import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider } from './stores/AppContext'
import { AppRouter } from './router/AppRouter'
import { ModalRenderer } from './components/ModalRenderer'
import { OfflineIndicator } from './components/OfflineIndicator'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { queryClient } from './services/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <OfflineIndicator />
        <AppRouter />
        <ModalRenderer />
        <PWAInstallPrompt />
        <ReactQueryDevtools initialIsOpen={false} />
      </AppProvider>
    </QueryClientProvider>
  )
}

export default App
