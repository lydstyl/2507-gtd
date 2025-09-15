import { ValidationSchema, Validator } from './BaseValidator'

export const registerSchema = new ValidationSchema()
  .field('email', Validator.required(), Validator.string(), Validator.email())
  .field('password', Validator.required(), Validator.string(), Validator.minLength(6))

export const loginSchema = new ValidationSchema()
  .field('email', Validator.required(), Validator.string(), Validator.email())
  .field('password', Validator.required(), Validator.string())