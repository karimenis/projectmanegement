import { useState, useEffect, useRef } from "react";
import { storage, formatDate } from "@/lib/storage";
import { User, Task, Project } from "@/types";
import { TaskDialog } from "@/components/modals/task-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TasksTableProps {
  projectId: number;
}

export default function TasksTable({ projectId }: TasksTableProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Inline editing states
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [editedTaskName, setEditedTaskName] = useState<string>('');
  const [editedResponsible, setEditedResponsible] = useState<string>('null');
  const [editedPriority, setEditedPriority] = useState<'basse' | 'moyenne' | 'haute'>('moyenne');
  const [editedEstimatedHours, setEditedEstimatedHours] = useState<string>('');
  const [editedActualHours, setEditedActualHours] = useState<string>('');
  const [editedStatus, setEditedStatus] = useState<'réalisé' | 'non réalisé'>('non réalisé');
  
  // Refs for handling click outside
  const editRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, usersData] = await Promise.all([
          storage.getProject(projectId),
          storage.getUsers()
        ]);
        
        if (projectData) {
          setProject(projectData as Project);
        }
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [projectId]);

  const handleCreateTask = async (task: {
    date: string;
    tache: string;
    responsable: number | null;
    priorite: 'basse' | 'moyenne' | 'haute';
    heures_estimees: number;
    heures_realisees: number;
    etat: 'réalisé' | 'non réalisé';
  }) => {
    try {
      await storage.createTask(projectId, task);
      setIsTaskDialogOpen(false);
      
      // Refresh data
      const updatedProject = await storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject as Project);
      }
      
      toast({
        title: "Tâche créée",
        description: "La tâche a été ajoutée avec succès.",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskId: number, task: Partial<{
    date: string;
    tache: string;
    responsable: number | null;
    priorite: 'basse' | 'moyenne' | 'haute';
    heures_estimees: number;
    heures_realisees: number;
    etat: 'réalisé' | 'non réalisé';
  }>) => {
    try {
      await storage.updateTask(projectId, taskId, task);
      setIsTaskDialogOpen(false);
      setEditingTaskId(null);
      
      // Refresh data
      const updatedProject = await storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject as Project);
      }
      
      toast({
        title: "Tâche mise à jour",
        description: "La tâche a été modifiée avec succès.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await storage.deleteTask(projectId, taskId);
        
        // Refresh data
        const updatedProject = await storage.getProject(projectId);
        if (updatedProject) {
          setProject(updatedProject as Project);
        }
        
        toast({
          title: "Tâche supprimée",
          description: "La tâche a été supprimée avec succès.",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
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
  
  // Start inline editing of a task
  const startInlineEdit = (task: Task) => {
    setInlineEditingId(task.id);
    setEditedTaskName(task.tache);
    setEditedResponsible(task.responsable ? String(task.responsable) : 'null');
    setEditedPriority(task.priorite);
    setEditedEstimatedHours(String(task.heures_estimees));
    setEditedActualHours(String(task.heures_realisees || 0));
    setEditedStatus(task.etat);
  };
  
  // Cancel inline editing
  const cancelInlineEdit = () => {
    setInlineEditingId(null);
  };
  
  // Save inline edited task
  const saveInlineEdit = async () => {
    if (!inlineEditingId) return;
    
    // Validate fields
    if (!editedTaskName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la tâche ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }
    
    const estimatedHoursNum = Number(editedEstimatedHours);
    if (isNaN(estimatedHoursNum) || estimatedHoursNum <= 0) {
      toast({
        title: "Erreur",
        description: "Les heures estimées doivent être un nombre positif",
        variant: "destructive",
      });
      return;
    }
    
    const actualHoursNum = Number(editedActualHours);
    if (isNaN(actualHoursNum) || actualHoursNum < 0) {
      toast({
        title: "Erreur",
        description: "Les heures réalisées doivent être un nombre positif ou zéro",
        variant: "destructive",
      });
      return;
    }
    
    const updatedTask = {
      tache: editedTaskName,
      responsable: editedResponsible === 'null' ? null : Number(editedResponsible),
      priorite: editedPriority,
      heures_estimees: estimatedHoursNum,
      heures_realisees: actualHoursNum,
      etat: editedStatus
    };
    
    try {
      await storage.updateTask(projectId, inlineEditingId, updatedTask);
      
      // Refresh data
      const updatedProject = await storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject as Project);
      }
      
      toast({
        title: "Tâche mise à jour",
        description: "La tâche a été modifiée avec succès.",
      });
      
      setInlineEditingId(null);
    } catch (error) {
      console.error("Error updating task inline:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    }
  };
  
  // For handling clicks outside the editing row
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inlineEditingId && 
        editRowRef.current && 
        !editRowRef.current.contains(event.target as Node)
      ) {
        cancelInlineEdit();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inlineEditingId]);

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
        <table className="w-full bg-white border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
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
              project.tasks.map(task => 
                inlineEditingId === task.id ? (
                  // Editing mode row
                  <tr 
                    key={task.id} 
                    className="border-b border-gray-200 bg-gray-100"
                    ref={editRowRef}
                  >
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <div className="cell-content">{formatDate(task.date)}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Input
                        value={editedTaskName}
                        onChange={(e) => setEditedTaskName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Select value={editedResponsible} onValueChange={setEditedResponsible}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Aucun responsable</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Select 
                        value={editedPriority} 
                        onValueChange={(val) => setEditedPriority(val as 'basse' | 'moyenne' | 'haute')}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basse">Basse</SelectItem>
                          <SelectItem value="moyenne">Moyenne</SelectItem>
                          <SelectItem value="haute">Haute</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={editedEstimatedHours}
                        onChange={(e) => setEditedEstimatedHours(e.target.value)}
                        className="h-8 text-sm text-right"
                      />
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={editedActualHours}
                        onChange={(e) => setEditedActualHours(e.target.value)}
                        className="h-8 text-sm text-right"
                      />
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Select 
                        value={editedStatus} 
                        onValueChange={(val) => setEditedStatus(val as 'réalisé' | 'non réalisé')}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non réalisé">Non réalisé</SelectItem>
                          <SelectItem value="réalisé">Réalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1 text-sm">
                      <button 
                        className="text-green-500 hover:text-green-600"
                        onClick={saveInlineEdit}
                        title="Enregistrer"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-600 ml-2"
                        onClick={cancelInlineEdit}
                        title="Annuler"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ) : (
                  // Normal display row
                  <tr 
                    key={task.id} 
                    className="border-b border-gray-200 hover:bg-gray-50"
                    onDoubleClick={() => startInlineEdit(task)}
                  >
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                      <div className="cell-content">{formatDate(task.date)}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(task)}>
                      <div className="cell-content">{task.tache}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(task)}>
                      <div className="cell-content">{getUserName(task.responsable)}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(task)}>
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
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm text-right cell-editable" onClick={() => startInlineEdit(task)}>
                      <div className="cell-content justify-end">{task.heures_estimees}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm text-right cell-editable" onClick={() => startInlineEdit(task)}>
                      <div className="cell-content justify-end">{task.heures_realisees || 0}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(task)}>
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
                        onClick={() => startInlineEdit(task)}
                        title="Éditer en ligne"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-600 ml-2"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              )
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