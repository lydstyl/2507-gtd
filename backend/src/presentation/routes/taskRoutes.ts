import { Router } from 'express'
import { TaskController } from '../controllers/TaskController'
import { authMiddleware } from '../middleware/authMiddleware'

export function createTaskRoutes(taskController: TaskController): Router {
  const router = Router()

  router.use(authMiddleware)

  // GET /api/tasks - Get all tasks with optional filters
  router.get('/', taskController.getAllTasks.bind(taskController))

  // GET /api/tasks/root - Get only root tasks (for TaskListPage)
  router.get('/root', taskController.getAllRootTasks.bind(taskController))

  // POST /api/tasks - Create a new task
  router.post('/', taskController.createTask.bind(taskController))

  // GET /api/tasks/export - Export all tasks as CSV
  router.get('/export', taskController.exportTasks.bind(taskController))

  // POST /api/tasks/import - Import tasks from CSV
  router.post('/import', taskController.importTasks.bind(taskController))

  // DELETE /api/tasks/all - Supprimer toutes les tâches de l'utilisateur connecté
  router.delete('/all', taskController.deleteAllUserTasks.bind(taskController))

  // GET /api/tasks/:id - Get a specific task by ID
  router.get('/:id', taskController.getTaskById.bind(taskController))

  // PUT /api/tasks/:id - Update a specific task
  router.put('/:id', taskController.updateTask.bind(taskController))

  // DELETE /api/tasks/:id - Delete a specific task
  router.delete('/:id', taskController.deleteTask.bind(taskController))

  return router
}
