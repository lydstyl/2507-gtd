import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider } from './stores/AppContext'
import { AppRouter } from './router/AppRouter'
import { ModalRenderer } from './components/ModalRenderer'
import { queryClient } from './services/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppRouter />
        <ModalRenderer />
        <ReactQueryDevtools initialIsOpen={false} />
      </AppProvider>
    </QueryClientProvider>
  )
}

export default App
