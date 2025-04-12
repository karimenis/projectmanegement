import { Project, User, Task, BugNote, StorageActions, ProjectFormData, TaskFormData, BugNoteFormData } from "@/types";
import { apiRequest, queryClient } from "./queryClient";

// API endpoints
const API = {
  USERS: '/api/users',
  PROJECTS: '/api/projects',
  TASKS: (projectId: number) => `/api/projects/${projectId}/tasks`,
  TASK: (projectId: number, taskId: number) => `/api/projects/${projectId}/tasks/${taskId}`,
  BUGS_NOTES: (projectId: number) => `/api/projects/${projectId}/bugs-notes`,
  BUG_NOTE: (projectId: number, bugNoteId: number) => `/api/projects/${projectId}/bugs-notes/${bugNoteId}`
};

// Convert API responses to match our types
const convertProject = (project: any): Project => {
  return {
    id: project.id,
    nom: project.name,
    estimation_jours: project.estimation_days,
    utilisateurs: project.users,
    tasks: project.tasks.map((task: any) => ({
      id: task.id,
      date: task.date,
      tache: task.tache,
      responsable: task.responsable,
      priorite: task.priorite,
      heures_estimees: task.heures_estimees,
      heures_realisees: task.heures_realisees,
      etat: task.etat
    })),
    bugs_notes: project.bugs_notes.map((bugNote: any) => ({
      id: bugNote.id,
      date: bugNote.date,
      type: bugNote.type,
      contenu: bugNote.contenu,
      tache_id: bugNote.tache_id
    }))
  };
};

const convertToApiProject = (project: ProjectFormData) => {
  return {
    name: project.nom,
    estimation_days: project.estimation_jours,
    users: project.utilisateurs
  };
};

// Storage actions implementation
export const storage: StorageActions = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(API.USERS);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = await response.json();
      return users.map((user: any) => ({
        id: user.id,
        name: user.name,
        role: user.role
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await fetch(API.PROJECTS);
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const projects = await response.json();
      return projects.map(convertProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  getProject: async (id: number): Promise<Project | undefined> => {
    try {
      const response = await fetch(`${API.PROJECTS}/${id}`);
      if (!response.ok) {
        if (response.status === 404) return undefined;
        throw new Error('Failed to fetch project');
      }
      
      const project = await response.json();
      return convertProject(project);
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      return undefined;
    }
  },

  createProject: async (projectData: ProjectFormData): Promise<Project> => {
    try {
      const response = await apiRequest('POST', API.PROJECTS, convertToApiProject(projectData));
      const project = await response.json();
      
      // Invalidate projects cache
      queryClient.invalidateQueries({ queryKey: [API.PROJECTS] });
      return convertProject(project);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (id: number, projectData: Partial<Project>): Promise<Project | undefined> => {
    try {
      // Convert to API format
      const apiProjectData = {
        name: projectData.nom,
        estimation_days: projectData.estimation_jours,
        users: projectData.utilisateurs
      };
      
      const response = await apiRequest('PUT', `${API.PROJECTS}/${id}`, apiProjectData);
      const project = await response.json();
      
      // Invalidate cache for this project and projects list
      queryClient.invalidateQueries({ queryKey: [API.PROJECTS] });
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${id}`] });
      
      return convertProject(project);
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      return undefined;
    }
  },

  deleteProject: async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest('DELETE', `${API.PROJECTS}/${id}`);
      
      // Invalidate projects cache
      queryClient.invalidateQueries({ queryKey: [API.PROJECTS] });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return false;
    }
  },

  createTask: async (projectId: number, taskData: TaskFormData): Promise<Task> => {
    try {
      const response = await apiRequest('POST', API.TASKS(projectId), taskData);
      const task = await response.json();
      
      // Invalidate project cache to update tasks list
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [API.TASKS(projectId)] });
      
      return task;
    } catch (error) {
      console.error(`Error creating task for project ${projectId}:`, error);
      throw error;
    }
  },

  updateTask: async (projectId: number, taskId: number, taskData: Partial<TaskFormData>): Promise<Task | undefined> => {
    try {
      const response = await apiRequest('PUT', API.TASK(projectId, taskId), taskData);
      const task = await response.json();
      
      // Invalidate project and tasks cache
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [API.TASKS(projectId)] });
      
      return task;
    } catch (error) {
      console.error(`Error updating task ${taskId} for project ${projectId}:`, error);
      return undefined;
    }
  },

  deleteTask: async (projectId: number, taskId: number): Promise<boolean> => {
    try {
      const response = await apiRequest('DELETE', API.TASK(projectId, taskId));
      
      // Invalidate project and tasks cache
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [API.TASKS(projectId)] });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting task ${taskId} for project ${projectId}:`, error);
      return false;
    }
  },

  createBugNote: async (projectId: number, bugNoteData: BugNoteFormData): Promise<BugNote> => {
    try {
      const response = await apiRequest('POST', API.BUGS_NOTES(projectId), bugNoteData);
      const bugNote = await response.json();
      
      // Invalidate project cache to update bugs/notes list
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [API.BUGS_NOTES(projectId)] });
      
      return bugNote;
    } catch (error) {
      console.error(`Error creating bug/note for project ${projectId}:`, error);
      throw error;
    }
  },

  updateBugNote: async (projectId: number, bugNoteId: number, bugNoteData: Partial<BugNoteFormData>): Promise<BugNote | undefined> => {
    try {
      const response = await apiRequest('PUT', API.BUG_NOTE(projectId, bugNoteId), bugNoteData);
      const bugNote = await response.json();
      
      // Invalidate project and bugs/notes cache
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [API.BUGS_NOTES(projectId)] });
      
      return bugNote;
    } catch (error) {
      console.error(`Error updating bug/note ${bugNoteId} for project ${projectId}:`, error);
      return undefined;
    }
  },

  deleteBugNote: async (projectId: number, bugNoteId: number): Promise<boolean> => {
    try {
      const response = await apiRequest('DELETE', API.BUG_NOTE(projectId, bugNoteId));
      
      // Invalidate project and bugs/notes cache
      queryClient.invalidateQueries({ queryKey: [`${API.PROJECTS}/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [API.BUGS_NOTES(projectId)] });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting bug/note ${bugNoteId} for project ${projectId}:`, error);
      return false;
    }
  }
};

// Helper functions for data calculations
export const calculateProjectProgress = (project: Project): number => {
  if (!project.tasks || project.tasks.length === 0) return 0;
  
  const totalHoursEstimated = project.estimation_jours * 8;
  const totalHoursCompleted = project.tasks.reduce((sum, task) => sum + (task.heures_realisees || 0), 0);
  
  return Math.min(Math.round((totalHoursCompleted / totalHoursEstimated) * 100), 100);
};

export const getProjectStatus = (project: Project): { label: string; className: string } => {
  const progress = calculateProjectProgress(project);
  
  if (progress >= 100) {
    return { label: 'Terminé', className: 'bg-green-100 text-green-800' };
  }
  
  const now = new Date();
  const hasLateTasks = project.tasks && project.tasks.some(task => {
    return task.etat !== 'réalisé' && new Date(task.date) < now;
  });
  
  if (hasLateTasks) {
    return { label: 'En retard', className: 'bg-red-100 text-red-800' };
  }
  
  return { label: 'En cours', className: 'bg-blue-100 text-blue-800' };
};

// Export to CSV
export const exportProjectDataToCsv = async (project: Project, viewType: 'tasks' | 'bugs'): Promise<string> => {
  let csvContent = '';
  
  if (viewType === 'tasks' && project.tasks) {
    // Export tasks
    csvContent = 'Date,Tâche,Responsable,Priorité,Heures estimées,Heures réalisées,État\n';
    
    // Get all users for responsible lookup
    const users = await storage.getUsers();
    
    for (const task of project.tasks) {
      const responsible = task.responsable ? users.find(user => user.id === task.responsable)?.name || '' : '';
      csvContent += `"${formatDate(task.date)}","${task.tache}","${responsible}","${task.priorite}",${task.heures_estimees},${task.heures_realisees || 0},"${task.etat}"\n`;
    }
  } else if (viewType === 'bugs' && project.bugs_notes) {
    // Export bugs & notes
    csvContent = 'Date,Type,Contenu,Tâche liée\n';
    
    for (const bug of project.bugs_notes) {
      const linkedTask = bug.tache_id ? project.tasks.find(task => task.id === bug.tache_id)?.tache || '' : '';
      csvContent += `"${formatDate(bug.date)}","${bug.type}","${bug.contenu}","${linkedTask}"\n`;
    }
  }
  
  return csvContent;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

export const downloadCsv = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
