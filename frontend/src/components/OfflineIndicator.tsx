import { useOnlineStatus } from '../hooks/useOnlineStatus'
 import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 flex items-center justify-center space-x-2 shadow-lg">
      <ExclamationTriangleIcon className="h-5 w-5" />
      <span className="font-medium">You're offline</span>
      <span className="hidden sm:inline">- Some features may be limited</span>
    </div>
  )
}