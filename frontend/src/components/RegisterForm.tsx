import { useState } from 'react'
import { api, ApiError } from '../utils/api'
import type { RegisterData } from '../types/auth'

interface RegisterFormProps {
  onSuccess: (token: string, user: { id: string; email: string }) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin
}: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setIsLoading(false)
      return
    }

    try {
      await api.register(formData)
      // Après inscription réussie, on se connecte automatiquement
      const loginResponse = await api.login(formData)
      localStorage.setItem('token', loginResponse.token)
      onSuccess(loginResponse.token, loginResponse.user)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Une erreur inattendue s'est produite")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-red-600'>
            Créer un nouveau compte
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Ou{' '}
            <button
              onClick={onSwitchToLogin}
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              se connecter à un compte existant
            </button>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
              {error}
            </div>
          )}

          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Adresse email
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={formData.email}
                onChange={handleChange}
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='votre@email.com'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Mot de passe
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                value={formData.password}
                onChange={handleChange}
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Au moins 6 caractères'
              />
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700'
              >
                Confirmer le mot de passe
              </label>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Répétez votre mot de passe'
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Création du compte...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
