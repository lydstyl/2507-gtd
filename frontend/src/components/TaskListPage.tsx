import React, { useEffect, useState } from 'react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import type { Task } from '../types/task';
import { api } from '../utils/api';

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createTaskParentId, setCreateTaskParentId] = useState<string | undefined>(undefined);

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks();
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTasks().finally(() => setLoading(false));
  }, []);

  const handleTaskCreated = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const handleTaskDeleted = async (taskId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await api.deleteTask(taskId);
        loadTasks();
      } catch (err) {
        console.error('Erreur lors de la suppression de la tâche:', err);
        alert('Erreur lors de la suppression de la tâche');
      }
    }
  };

  const handleCreateTask = () => {
    setCreateTaskParentId(undefined);
    setIsCreateTaskModalOpen(true);
  };

  const handleCreateSubtask = (parentId: string) => {
    setCreateTaskParentId(parentId);
    setIsCreateTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleCloseCreateTaskModal = () => {
    setIsCreateTaskModalOpen(false);
    setCreateTaskParentId(undefined);
  };

  if (loading) return <div className="p-8 text-center">Chargement…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Toutes les tâches</h1>
        <button
          onClick={handleCreateTask}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + Nouvelle tâche
        </button>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Aucune tâche trouvée.
          <br />
          <button
            onClick={handleCreateTask}
            className="text-blue-600 hover:text-blue-800 underline mt-2"
          >
            Créer votre première tâche
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              level={0}
              onEdit={handleEditTask}
              onDelete={handleTaskDeleted}
              onCreateSubtask={handleCreateSubtask}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={handleCloseCreateTaskModal}
        onTaskCreated={handleTaskCreated}
        parentId={createTaskParentId}
      />

      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={handleCloseEditModal}
        onTaskUpdated={handleTaskUpdated}
        task={editingTask}
      />
    </div>
  );
} 