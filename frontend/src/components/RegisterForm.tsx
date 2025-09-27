import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../hooks/useAuth'
import { Button, Input } from './ui'

const registerSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const navigate = useNavigate()
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password
      })
      navigate('/tasks')
     } catch {
       // Error is handled by the mutation
     }
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
            <Link
              to="/login"
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              se connecter à un compte existant
            </Link>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          {registerMutation.error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
              {registerMutation.error.message}
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
              placeholder='Au moins 6 caractères'
              autoComplete='new-password'
              error={errors.password?.message}
            />

            <Input
              {...register('confirmPassword')}
              type='password'
              label='Confirmer le mot de passe'
              placeholder='Répétez votre mot de passe'
              autoComplete='new-password'
              error={errors.confirmPassword?.message}
            />
          </div>

          <div>
            <Button
              type='submit'
              isLoading={registerMutation.isPending}
              className='w-full'
            >
              Créer le compte
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}