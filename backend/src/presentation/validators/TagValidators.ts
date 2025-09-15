import { ValidationSchema, Validator } from './BaseValidator'

export const createTagSchema = new ValidationSchema()
  .field('name', Validator.required(), Validator.string(), Validator.maxLength(100))
  .field('color', Validator.optional(Validator.string()), Validator.optional(Validator.maxLength(7)))

export const updateTagSchema = new ValidationSchema()
  .field('name', Validator.optional(Validator.string()), Validator.optional(Validator.maxLength(100)))
  .field('color', Validator.optional(Validator.string()), Validator.optional(Validator.maxLength(7)))