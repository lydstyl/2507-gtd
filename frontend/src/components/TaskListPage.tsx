import React, { useEffect, useState } from 'react';
import { TaskCard } from './TaskCard';
import type { Task } from '../types/task';
import { api } from '../utils/api';

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getTasks()
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Chargement…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Toutes les tâches</h1>
      {tasks.length === 0 ? (
        <div className="text-gray-500">Aucune tâche trouvée.</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} level={0} />
          ))}
        </div>
      )}
    </div>
  );
} 