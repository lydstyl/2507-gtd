// Re-export types from backend to maintain consistency
export interface Task {
  id: string;
  name: string;
  link?: string;
  note?: string;
  importance: number; // 1-100, default 50
  complexity: number; // 1-5, default 1
  points: number; // calculated: importance * complexity * 10
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
  complexity?: number;
  parentId?: string;
  tagIds?: string[];
  userId: string;
  dueDate?: Date;
}