// Re-export types from backend to maintain consistency
export interface Task {
  id: string;
  name: string;
  link?: string;
  note?: string;
  importance: number; // 1-9, 1 being most important
  urgency: number; // 1-9
  priority: number; // 1-9
  parentId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface TaskWithSubtasks extends Task {
  subtasks: TaskWithSubtasks[];
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskData {
  name: string;
  link?: string;
  note?: string;
  importance?: number;
  urgency?: number;
  priority?: number;
  parentId?: string;
  tagIds?: string[];
  userId: string;
  dueDate?: Date;
}