// Types for the project tracking application
export interface User {
  id: number;
  name: string;
  role: string;
}

export interface Task {
  id: number;
  date: string; // ISO string format
  tache: string;
  responsable: number | null; // User ID
  priorite: 'basse' | 'moyenne' | 'haute';
  heures_estimees: number;
  heures_realisees: number;
  etat: 'réalisé' | 'non réalisé';
}

export interface BugNote {
  id: number;
  date: string; // ISO string format
  type: 'bug' | 'note';
  contenu: string;
  tache_id: number | null; // Task ID
}

export interface Project {
  id: number;
  nom: string;
  estimation_jours: number;
  utilisateurs: number[]; // Array of User IDs
  tasks: Task[];
  bugs_notes: BugNote[];
}

export type ProjectStatus = 'en cours' | 'terminé' | 'en retard';

// Form data types
export interface ProjectFormData {
  nom: string;
  estimation_jours: number;
  utilisateurs: number[];
}

export interface TaskFormData {
  date: string;
  tache: string;
  responsable: number | null;
  priorite: 'basse' | 'moyenne' | 'haute';
  heures_estimees: number;
  heures_realisees: number;
  etat: 'réalisé' | 'non réalisé';
}

export interface BugNoteFormData {
  date: string;
  type: 'bug' | 'note';
  contenu: string;
  tache_id: number | null;
}

// Storage utility type
export interface StorageActions {
  getProjects: () => Project[];
  getUsers: () => User[];
  getProject: (id: number) => Project | undefined;
  createProject: (project: ProjectFormData) => Project;
  updateProject: (id: number, project: Partial<Project>) => Project | undefined;
  deleteProject: (id: number) => boolean;
  createTask: (projectId: number, task: TaskFormData) => Task;
  updateTask: (projectId: number, taskId: number, task: Partial<TaskFormData>) => Task | undefined;
  deleteTask: (projectId: number, taskId: number) => boolean;
  createBugNote: (projectId: number, bugNote: BugNoteFormData) => BugNote;
  updateBugNote: (projectId: number, bugNoteId: number, bugNote: Partial<BugNoteFormData>) => BugNote | undefined;
  deleteBugNote: (projectId: number, bugNoteId: number) => boolean;
}

// Data for dashboard statistics
export interface DashboardStats {
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
}

// Chart data
export interface ProjectChartData {
  name: string;
  estimated: number;
  actual: number;
}
