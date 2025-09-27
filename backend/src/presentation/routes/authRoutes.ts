import express, { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository'
import { AuthService } from '../../services/authService'
import { AuthController } from '../controllers/AuthController'

const router: Router = Router()
const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)
const authController = new AuthController(authService)

router.post('/register', authController.register.bind(authController))
router.post('/login', authController.login.bind(authController))

export default router
