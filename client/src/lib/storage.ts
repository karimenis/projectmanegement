import { Project, User, Task, BugNote, StorageActions, ProjectFormData, TaskFormData, BugNoteFormData } from "@/types";

// LocalStorage keys
const STORAGE_KEYS = {
  PROJECTS: 'suivi_projets_data',
  USERS: 'suivi_projets_users'
};

// Mock users data
const MOCK_USERS: User[] = [
  { id: 1, name: 'Jean Dupont', role: 'Chef de Projet' },
  { id: 2, name: 'Marie Martin', role: 'Développeur' },
  { id: 3, name: 'Pierre Leroy', role: 'Designer' },
  { id: 4, name: 'Sophie Bernard', role: 'Testeur' }
];

// Mock projects data for initial load
const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    nom: 'Refonte du site web',
    estimation_jours: 20,
    utilisateurs: [1, 2, 3],
    tasks: [
      {
        id: 101,
        date: '2023-05-10',
        tache: 'Maquettes UI/UX',
        responsable: 3,
        priorite: 'haute',
        heures_estimees: 16,
        heures_realisees: 18,
        etat: 'réalisé'
      },
      {
        id: 102,
        date: '2023-05-15',
        tache: 'Développement front-end',
        responsable: 2,
        priorite: 'moyenne',
        heures_estimees: 40,
        heures_realisees: 20,
        etat: 'non réalisé'
      }
    ],
    bugs_notes: [
      {
        id: 201,
        date: '2023-05-12',
        type: 'bug',
        contenu: 'Problème d\'affichage sur Safari',
        tache_id: 101
      },
      {
        id: 202,
        date: '2023-05-16',
        type: 'note',
        contenu: 'Revoir les animations avec le client',
        tache_id: null
      }
    ]
  },
  {
    id: 2,
    nom: 'Application mobile',
    estimation_jours: 30,
    utilisateurs: [1, 2, 4],
    tasks: [
      {
        id: 103,
        date: '2023-06-01',
        tache: 'Architecture technique',
        responsable: 2,
        priorite: 'haute',
        heures_estimees: 24,
        heures_realisees: 22,
        etat: 'réalisé'
      }
    ],
    bugs_notes: []
  }
];

// Load initial mock data if not exists
export const loadMockData = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(MOCK_PROJECTS));
  }
};

// Helper function to generate unique IDs
const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Storage actions implementation
export const storage: StorageActions = {
  getUsers: (): User[] => {
    const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
    return usersData ? JSON.parse(usersData) : [];
  },

  getProjects: (): Project[] => {
    const projectsData = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return projectsData ? JSON.parse(projectsData) : [];
  },

  getProject: (id: number): Project | undefined => {
    const projects = storage.getProjects();
    return projects.find(project => project.id === id);
  },

  createProject: (projectData: ProjectFormData): Project => {
    const projects = storage.getProjects();
    const newProject: Project = {
      id: generateId(),
      nom: projectData.nom,
      estimation_jours: projectData.estimation_jours,
      utilisateurs: projectData.utilisateurs,
      tasks: [],
      bugs_notes: []
    };
    
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  },

  updateProject: (id: number, projectData: Partial<Project>): Project | undefined => {
    const projects = storage.getProjects();
    const index = projects.findIndex(project => project.id === id);
    
    if (index === -1) return undefined;
    
    const updatedProject = { ...projects[index], ...projectData };
    projects[index] = updatedProject;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return updatedProject;
  },

  deleteProject: (id: number): boolean => {
    const projects = storage.getProjects();
    const filteredProjects = projects.filter(project => project.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));
    return true;
  },

  createTask: (projectId: number, taskData: TaskFormData): Task => {
    const projects = storage.getProjects();
    const projectIndex = projects.findIndex(project => project.id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const newTask: Task = {
      id: generateId(),
      ...taskData
    };
    
    projects[projectIndex].tasks.push(newTask);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newTask;
  },

  updateTask: (projectId: number, taskId: number, taskData: Partial<TaskFormData>): Task | undefined => {
    const projects = storage.getProjects();
    const projectIndex = projects.findIndex(project => project.id === projectId);
    
    if (projectIndex === -1) return undefined;
    
    const taskIndex = projects[projectIndex].tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return undefined;
    
    const updatedTask = { ...projects[projectIndex].tasks[taskIndex], ...taskData };
    projects[projectIndex].tasks[taskIndex] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return updatedTask;
  },

  deleteTask: (projectId: number, taskId: number): boolean => {
    const projects = storage.getProjects();
    const projectIndex = projects.findIndex(project => project.id === projectId);
    
    if (projectIndex === -1) return false;
    
    const originalLength = projects[projectIndex].tasks.length;
    projects[projectIndex].tasks = projects[projectIndex].tasks.filter(task => task.id !== taskId);
    
    if (projects[projectIndex].tasks.length === originalLength) {
      return false;
    }
    
    // Remove task links from bugs/notes
    projects[projectIndex].bugs_notes = projects[projectIndex].bugs_notes.map(bugNote => {
      if (bugNote.tache_id === taskId) {
        return { ...bugNote, tache_id: null };
      }
      return bugNote;
    });
    
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return true;
  },

  createBugNote: (projectId: number, bugNoteData: BugNoteFormData): BugNote => {
    const projects = storage.getProjects();
    const projectIndex = projects.findIndex(project => project.id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const newBugNote: BugNote = {
      id: generateId(),
      ...bugNoteData
    };
    
    projects[projectIndex].bugs_notes.push(newBugNote);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newBugNote;
  },

  updateBugNote: (projectId: number, bugNoteId: number, bugNoteData: Partial<BugNoteFormData>): BugNote | undefined => {
    const projects = storage.getProjects();
    const projectIndex = projects.findIndex(project => project.id === projectId);
    
    if (projectIndex === -1) return undefined;
    
    const bugNoteIndex = projects[projectIndex].bugs_notes.findIndex(bugNote => bugNote.id === bugNoteId);
    
    if (bugNoteIndex === -1) return undefined;
    
    const updatedBugNote = { ...projects[projectIndex].bugs_notes[bugNoteIndex], ...bugNoteData };
    projects[projectIndex].bugs_notes[bugNoteIndex] = updatedBugNote;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return updatedBugNote;
  },

  deleteBugNote: (projectId: number, bugNoteId: number): boolean => {
    const projects = storage.getProjects();
    const projectIndex = projects.findIndex(project => project.id === projectId);
    
    if (projectIndex === -1) return false;
    
    const originalLength = projects[projectIndex].bugs_notes.length;
    projects[projectIndex].bugs_notes = projects[projectIndex].bugs_notes.filter(bugNote => bugNote.id !== bugNoteId);
    
    if (projects[projectIndex].bugs_notes.length === originalLength) {
      return false;
    }
    
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return true;
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
export const exportProjectDataToCsv = (project: Project, viewType: 'tasks' | 'bugs'): string => {
  let csvContent = '';
  
  if (viewType === 'tasks' && project.tasks) {
    // Export tasks
    csvContent = 'Date,Tâche,Responsable,Priorité,Heures estimées,Heures réalisées,État\n';
    
    project.tasks.forEach(task => {
      const users = storage.getUsers();
      const responsible = task.responsable ? users.find(user => user.id === task.responsable)?.name || '' : '';
      
      csvContent += `"${formatDate(task.date)}","${task.tache}","${responsible}","${task.priorite}",${task.heures_estimees},${task.heures_realisees || 0},"${task.etat}"\n`;
    });
  } else if (viewType === 'bugs' && project.bugs_notes) {
    // Export bugs & notes
    csvContent = 'Date,Type,Contenu,Tâche liée\n';
    
    project.bugs_notes.forEach(bug => {
      const linkedTask = bug.tache_id ? project.tasks.find(task => task.id === bug.tache_id)?.tache || '' : '';
      csvContent += `"${formatDate(bug.date)}","${bug.type}","${bug.contenu}","${linkedTask}"\n`;
    });
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
