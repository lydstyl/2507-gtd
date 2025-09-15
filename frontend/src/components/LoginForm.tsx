import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import { Button, Input } from './ui'

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data)
      navigate('/tasks')
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Se connecter à votre compte
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Ou{' '}
            <Link
              to="/register"
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              créer un nouveau compte
            </Link>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {loginMutation.error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
              {loginMutation.error.message}
            </div>
          )}

          <div className='space-y-4'>
            <Input
              {...register('email')}
              type='email'
              label='Adresse email'
              placeholder='votre@email.com'
              autoComplete='email'
              error={errors.email?.message}
            />

            <Input
              {...register('password')}
              type='password'
              label='Mot de passe'
              placeholder='Votre mot de passe'
              autoComplete='current-password'
              error={errors.password?.message}
            />
          </div>

          <div>
            <Button
              type='submit'
              isLoading={loginMutation.isPending}
              className='w-full'
            >
              Se connecter
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
