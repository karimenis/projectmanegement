import { useState, useEffect } from "react";
import { storage, getProjectStatus, exportProjectDataToCsv, downloadCsv } from "@/lib/storage";
import { Project } from "@/types";
import TasksTable from "@/components/tasks-table";
import BugsNotesTable from "@/components/bugs-notes-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

interface ProjectDetailProps {
  projectId: number;
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'bugs'>('tasks');

  useEffect(() => {
    const loadProject = () => {
      const projectData = storage.getProject(projectId);
      if (projectData) {
        setProject(projectData);
      }
    };

    loadProject();

    // Set up listener for localStorage changes
    const handleStorage = () => {
      loadProject();
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [projectId]);

  const handleExportCsv = () => {
    if (!project) return;
    
    const csvContent = exportProjectDataToCsv(project, activeTab);
    const fileName = `${project.nom}_${activeTab === 'tasks' ? 'taches' : 'bugs_notes'}_${new Date().toISOString().slice(0, 10)}.csv`;
    
    downloadCsv(csvContent, fileName);
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div>Chargement du projet...</div>
      </div>
    );
  }

  const status = getProjectStatus(project);

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-surface-100 border-b border-surface-300 h-14 flex items-center px-4 md:px-6">
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs rounded-full ${status.className}`}>{status.label}</span>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-text-secondary hover:text-text-primary"
            onClick={handleExportCsv}
          >
            <DownloadIcon className="h-4 w-4 mr-1" /> Exporter CSV
          </Button>
          
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'tasks' | 'bugs')}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="bugs">Bugs & Notes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'tasks' ? (
          <TasksTable projectId={projectId} />
        ) : (
          <BugsNotesTable projectId={projectId} />
        )}
      </div>
    </div>
  );
}
