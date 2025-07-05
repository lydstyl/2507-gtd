import React, { useEffect, useState } from 'react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import type { Task } from '../types/task';
import { api } from '../utils/api';

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createTaskParentId, setCreateTaskParentId] = useState<string | undefined>(undefined);

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks();
      setTasks(tasksData);
      setFilteredTasks(tasksData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Gérer le changement de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
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

  // Mettre à jour les tâches filtrées quand les tâches changent
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm]);

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

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''} trouvée{filteredTasks.length !== 1 ? 's' : ''}
            {filteredTasks.length !== tasks.length && ` sur ${tasks.length}`}
          </div>
        )}
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
      ) : filteredTasks.length === 0 && searchTerm ? (
        <div className="text-gray-500 text-center py-8">
          Aucune tâche ne correspond à votre recherche "{searchTerm}".
          <br />
          <button
            onClick={() => setSearchTerm('')}
            className="text-blue-600 hover:text-blue-800 underline mt-2"
          >
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
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