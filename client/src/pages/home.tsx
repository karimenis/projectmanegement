import { useState } from "react";
import Dashboard from "@/components/dashboard";
import ProjectDetail from "@/components/project-detail";
import ProjectSidebar from "@/components/project-sidebar";
import { storage } from "@/lib/storage";
import { NewProjectDialog } from "@/components/modals/new-project-dialog";
import { User } from "@/types";

export default function Home() {
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const users = storage.getUsers();
  
  const handleSelectProject = (projectId: number) => {
    setCurrentProjectId(projectId);
    setMobileMenuOpen(false);
  };
  
  const handleBackToDashboard = () => {
    setCurrentProjectId(null);
  };
  
  const handleCreateProject = (projectName: string, estimationDays: number, selectedUsers: number[]) => {
    storage.createProject({
      nom: projectName,
      estimation_jours: estimationDays,
      utilisateurs: selectedUsers
    });
    setNewProjectDialogOpen(false);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 flex-col bg-surface-100 border-r border-surface-300">
        <ProjectSidebar 
          users={users}
          currentProjectId={currentProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={() => setNewProjectDialogOpen(true)}
        />
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-50 flex md:hidden transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}
      >
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="relative w-64 max-w-sm bg-surface-100 h-full shadow-xl flex flex-col ml-auto">
          <ProjectSidebar 
            users={users}
            currentProjectId={currentProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={() => {
              setNewProjectDialogOpen(true);
              setMobileMenuOpen(false);
            }}
            mobile
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-surface-100 border-b border-surface-300 h-14 flex items-center px-4 md:px-6">
          <button 
            className="md:hidden text-text-secondary mr-4"
            onClick={() => setMobileMenuOpen(true)}
          >
            <i className="fas fa-bars"></i>
          </button>
          
          <div className="flex items-center">
            <h2 
              className="text-lg font-semibold mr-3 cursor-pointer"
              onClick={handleBackToDashboard}
            >
              {currentProjectId 
                ? storage.getProject(currentProjectId)?.nom || "Projet"
                : "Tableau de bord"
              }
            </h2>
          </div>
        </div>
        
        {currentProjectId ? (
          <ProjectDetail projectId={currentProjectId} />
        ) : (
          <Dashboard onSelectProject={handleSelectProject} />
        )}
      </div>
      
      {/* New Project Dialog */}
      <NewProjectDialog 
        isOpen={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onCreateProject={handleCreateProject}
        users={users}
      />
    </div>
  );
}
