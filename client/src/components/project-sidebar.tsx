import { useEffect, useState } from "react";
import { storage, calculateProjectProgress, getProjectStatus } from "@/lib/storage";
import { Project, User } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";

interface ProjectSidebarProps {
  users: User[];
  currentProjectId: number | null;
  onSelectProject: (projectId: number) => void;
  onNewProject: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

export default function ProjectSidebar({ 
  users, 
  currentProjectId, 
  onSelectProject, 
  onNewProject,
  mobile = false,
  onClose
}: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await storage.getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };

    loadProjects();
    
    // No need for localStorage listener with database approach
  }, []);
  
  // Find current user (for demo purposes)
  const currentUser = Array.isArray(users) && users.length > 0 
    ? users.find(user => user.id === 1) 
    : null;
  
  return (
    <>
      <div className="p-4 border-b border-surface-300">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Suivi de Projets</h1>
          {mobile && onClose && (
            <button className="text-text-secondary" onClick={onClose}>
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Projects List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Projets</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80 text-sm p-0 h-auto"
              onClick={onNewProject}
            >
              <PlusIcon className="h-4 w-4 mr-1" /> Nouveau
            </Button>
          </div>
          
          <ul className="space-y-1">
            {projects.map(project => {
              const progress = calculateProjectProgress(project);
              const status = getProjectStatus(project);
              
              return (
                <li key={project.id}>
                  <button 
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-surface-200 flex items-center justify-between group ${currentProjectId === project.id ? 'bg-primary/10 text-primary' : ''}`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <span className="truncate">{project.nom}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className} opacity-70`}>{progress}%</span>
                  </button>
                </li>
              );
            })}
            
            {projects.length === 0 && (
              <li className="text-center text-sm text-gray-500 py-2">
                Aucun projet. Créez-en un !
              </li>
            )}
          </ul>
        </div>
      </div>
      
      {/* User section */}
      <div className="p-4 border-t border-surface-300">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="text-xs">{currentUser?.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium">{currentUser?.name}</p>
            <p className="text-xs text-text-secondary">{currentUser?.role}</p>
          </div>
        </div>
      </div>
    </>
  );
}
