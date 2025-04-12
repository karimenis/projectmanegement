import { useState, useEffect } from "react";
import { storage, formatDate } from "@/lib/storage";
import { User, Task, Project } from "@/types";
import { TaskDialog } from "@/components/modals/task-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TasksTableProps {
  projectId: number;
}

export default function TasksTable({ projectId }: TasksTableProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = () => {
      const projectData = storage.getProject(projectId);
      const usersData = storage.getUsers();
      
      if (projectData) {
        setProject(projectData);
      }
      
      setUsers(usersData);
    };

    fetchData();
    
    // Set up listener for localStorage changes
    const handleStorage = () => {
      fetchData();
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [projectId]);

  const handleCreateTask = (task: {
    date: string;
    tache: string;
    responsable: number | null;
    priorite: 'basse' | 'moyenne' | 'haute';
    heures_estimees: number;
    heures_realisees: number;
    etat: 'réalisé' | 'non réalisé';
  }) => {
    try {
      storage.createTask(projectId, task);
      setIsTaskDialogOpen(false);
      
      // Refresh data
      const updatedProject = storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
      
      toast({
        title: "Tâche créée",
        description: "La tâche a été ajoutée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = (taskId: number, task: Partial<{
    date: string;
    tache: string;
    responsable: number | null;
    priorite: 'basse' | 'moyenne' | 'haute';
    heures_estimees: number;
    heures_realisees: number;
    etat: 'réalisé' | 'non réalisé';
  }>) => {
    try {
      storage.updateTask(projectId, taskId, task);
      setIsTaskDialogOpen(false);
      setEditingTaskId(null);
      
      // Refresh data
      const updatedProject = storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
      
      toast({
        title: "Tâche mise à jour",
        description: "La tâche a été modifiée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = (taskId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        storage.deleteTask(projectId, taskId);
        
        // Refresh data
        const updatedProject = storage.getProject(projectId);
        if (updatedProject) {
          setProject(updatedProject);
        }
        
        toast({
          title: "Tâche supprimée",
          description: "La tâche a été supprimée avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la tâche.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditTask = (taskId: number) => {
    setEditingTaskId(taskId);
    setIsTaskDialogOpen(true);
  };

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div>Chargement des tâches...</div>
      </div>
    );
  }

  const getEditingTask = (): Task | undefined => {
    if (!editingTaskId) return undefined;
    return project.tasks.find(task => task.id === editingTaskId);
  };

  const getUserName = (userId: number | null): string => {
    if (!userId) return '';
    const user = users.find(u => u.id === userId);
    return user ? user.name : '';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="spreadsheet-container overflow-x-auto">
        <table className="w-full bg-surface-100 border-collapse">
          <thead className="bg-surface-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tâche</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-48">Responsable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">Priorité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">H. Estimées</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">H. Réalisées</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">État</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {project.tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Aucune tâche disponible. Ajoutez votre première tâche !
                </td>
              </tr>
            ) : (
              project.tasks.map(task => (
                <tr key={task.id} className="border-b border-surface-300 hover:bg-surface-200">
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">{formatDate(task.date)}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">{task.tache}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">{getUserName(task.responsable)}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.priorite === 'basse' 
                          ? 'bg-blue-100 text-blue-800'
                          : task.priorite === 'moyenne'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {task.priorite.charAt(0).toUpperCase() + task.priorite.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm text-right">
                    <div className="cell-content justify-end">{task.heures_estimees}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm text-right">
                    <div className="cell-content justify-end">{task.heures_realisees || 0}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.etat === 'réalisé' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.etat.charAt(0).toUpperCase() + task.etat.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-sm">
                    <button 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleEditTask(task.id)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-600 ml-2"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8} className="px-4 py-3 border-t border-surface-300">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80 text-sm p-0 h-auto"
                  onClick={() => {
                    setEditingTaskId(null);
                    setIsTaskDialogOpen(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Ajouter une tâche
                </Button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false);
          setEditingTaskId(null);
        }}
        onSave={editingTaskId ? 
          (task) => handleUpdateTask(editingTaskId, task) : 
          handleCreateTask
        }
        task={getEditingTask()}
        users={users}
      />
    </div>
  );
}
