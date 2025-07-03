import { Router } from 'express'
import { TaskController } from '../controllers/taskController'

const router = Router()
const taskController = new TaskController()

// GET /api/tasks - Get all tasks with optional filters
router.get('/', taskController.getAllTasks.bind(taskController))

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask.bind(taskController))

// GET /api/tasks/:id - Get a specific task by ID
router.get('/:id', taskController.getTaskById.bind(taskController))

// PUT /api/tasks/:id - Update a specific task
router.put('/:id', taskController.updateTask.bind(taskController))

// DELETE /api/tasks/:id - Delete a specific task
router.delete('/:id', taskController.deleteTask.bind(taskController))

export default router
