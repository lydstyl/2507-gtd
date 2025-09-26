import { useState } from 'react'

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
  ariaLabel?: string
}

export function FloatingActionButton({
  onClick,
  className = '',
  ariaLabel = 'Nouvelle tâche'
}: FloatingActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 md:w-16 md:h-16
        bg-blue-600 hover:bg-blue-700
        text-white rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${className}
      `}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <svg
        className='w-6 h-6 md:w-7 md:h-7'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 6v6m0 0v6m0-6h6m-6 0H6'
        />
      </svg>
    </button>
  )
}