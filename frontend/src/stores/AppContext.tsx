import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// App State Interface
export interface AppState {
  // UI State
  currentView: 'login' | 'register' | 'dashboard' | 'tasklist'
  isLoading: boolean

  // Modal States
  modals: {
    createTask: {
      isOpen: boolean
      parentId?: string
    }
    editTask: {
      isOpen: boolean
      taskId?: string
    }
    createTag: {
      isOpen: boolean
    }
    editTag: {
      isOpen: boolean
      tagId?: string
    }
    tagManager: {
      isOpen: boolean
    }
    assignParent: {
      isOpen: boolean
      taskId?: string
    }
    note: {
      isOpen: boolean
      taskId?: string
    }
  }

  // Filter States
  filters: {
    search: string
    importance: number | ''
    importanceType: 'exact' | 'gte'
    urgency: number | ''
    urgencyType: 'exact' | 'gte'
    priority: number | ''
    priorityType: 'exact' | 'gte'
    tagId: string
    dateFilter: string
  }

  // UI Preferences
  preferences: {
    showFilters: boolean
    showShortcutsHelp: boolean
    selectedTaskId: string | null
    pinnedTaskId: string | null
  }
}

// Action Types
export type AppAction =
  | { type: 'SET_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: { modal: keyof AppState['modals']; data?: any } }
  | { type: 'CLOSE_MODAL'; payload: keyof AppState['modals'] }
  | { type: 'SET_FILTER'; payload: { key: keyof AppState['filters']; value: any } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_PREFERENCE'; payload: { key: keyof AppState['preferences']; value: any } }
  | { type: 'RESET_STATE' }

// Initial State
const initialState: AppState = {
  currentView: 'login',
  isLoading: false,
  modals: {
    createTask: { isOpen: false },
    editTask: { isOpen: false },
    createTag: { isOpen: false },
    editTag: { isOpen: false },
    tagManager: { isOpen: false },
    assignParent: { isOpen: false },
    note: { isOpen: false },
  },
  filters: {
    search: '',
    importance: '',
    importanceType: 'gte',
    urgency: '',
    urgencyType: 'gte',
    priority: '',
    priorityType: 'gte',
    tagId: '',
    dateFilter: '',
  },
  preferences: {
    showFilters: true,
    showShortcutsHelp: true,
    selectedTaskId: null,
    pinnedTaskId: null,
  },
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'OPEN_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: {
            isOpen: true,
            ...action.payload.data,
          },
        },
      }

    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: { isOpen: false },
        },
      }

    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      }

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
      }

    case 'SET_PREFERENCE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value,
        },
      }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}

// Context
const AppStateContext = createContext<AppState | undefined>(undefined)
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined)

// Provider Component
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

// Custom Hooks
export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider')
  }
  return context
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext)
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider')
  }
  return context
}

// Combined Hook
export function useApp() {
  return {
    state: useAppState(),
    dispatch: useAppDispatch(),
  }
}