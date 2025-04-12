import { useState, useEffect } from "react";
import { storage, formatDate } from "@/lib/storage";
import { Project, Task } from "@/types";
import { BugNoteDialog } from "@/components/modals/bug-note-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BugsNotesTableProps {
  projectId: number;
}

export default function BugsNotesTable({ projectId }: BugsNotesTableProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isBugNoteDialogOpen, setIsBugNoteDialogOpen] = useState(false);
  const [editingBugNoteId, setEditingBugNoteId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = () => {
      const projectData = storage.getProject(projectId);
      if (projectData) {
        setProject(projectData);
      }
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

  const handleCreateBugNote = (bugNote: {
    date: string;
    type: 'bug' | 'note';
    contenu: string;
    tache_id: number | null;
  }) => {
    try {
      storage.createBugNote(projectId, bugNote);
      setIsBugNoteDialogOpen(false);
      
      // Refresh data
      const updatedProject = storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
      
      toast({
        title: `${bugNote.type === 'bug' ? 'Bug' : 'Note'} créé`,
        description: `Le ${bugNote.type === 'bug' ? 'bug' : 'la note'} a été ajouté(e) avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de créer le ${bugNote.type === 'bug' ? 'bug' : 'la note'}.`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateBugNote = (bugNoteId: number, bugNote: Partial<{
    date: string;
    type: 'bug' | 'note';
    contenu: string;
    tache_id: number | null;
  }>) => {
    try {
      storage.updateBugNote(projectId, bugNoteId, bugNote);
      setIsBugNoteDialogOpen(false);
      setEditingBugNoteId(null);
      
      // Refresh data
      const updatedProject = storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
      
      toast({
        title: `${bugNote.type === 'bug' ? 'Bug' : 'Note'} mis à jour`,
        description: `Le ${bugNote.type === 'bug' ? 'bug' : 'la note'} a été modifié(e) avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le ${bugNote.type === 'bug' ? 'bug' : 'la note'}.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBugNote = (bugNoteId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        storage.deleteBugNote(projectId, bugNoteId);
        
        // Refresh data
        const updatedProject = storage.getProject(projectId);
        if (updatedProject) {
          setProject(updatedProject);
        }
        
        toast({
          title: "Élément supprimé",
          description: "L'élément a été supprimé avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'élément.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditBugNote = (bugNoteId: number) => {
    setEditingBugNoteId(bugNoteId);
    setIsBugNoteDialogOpen(true);
  };

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div>Chargement des bugs et notes...</div>
      </div>
    );
  }

  const getEditingBugNote = () => {
    if (!editingBugNoteId) return undefined;
    return project.bugs_notes.find(bn => bn.id === editingBugNoteId);
  };

  const getTaskName = (taskId: number | null): string => {
    if (!taskId) return '';
    const task = project.tasks.find(t => t.id === taskId);
    return task ? task.tache : '';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="spreadsheet-container overflow-x-auto">
        <table className="w-full bg-surface-100 border-collapse">
          <thead className="bg-surface-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Contenu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-40">Lié à la tâche</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {project.bugs_notes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Aucun bug ou note disponible. Ajoutez votre premier élément !
                </td>
              </tr>
            ) : (
              project.bugs_notes.map(bugNote => (
                <tr key={bugNote.id} className="border-b border-surface-300 hover:bg-surface-200">
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">{formatDate(bugNote.date)}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">
                      <span className={`px-2 py-1 rounded text-xs ${
                        bugNote.type === 'bug' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {bugNote.type.charAt(0).toUpperCase() + bugNote.type.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">{bugNote.contenu}</div>
                  </td>
                  <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                    <div className="cell-content">{getTaskName(bugNote.tache_id) || '-'}</div>
                  </td>
                  <td className="px-2 py-2 text-sm">
                    <button 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleEditBugNote(bugNote.id)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-600 ml-2"
                      onClick={() => handleDeleteBugNote(bugNote.id)}
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
              <td colSpan={5} className="px-4 py-3 border-t border-surface-300">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80 text-sm p-0 h-auto"
                  onClick={() => {
                    setEditingBugNoteId(null);
                    setIsBugNoteDialogOpen(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Ajouter un bug / une note
                </Button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bug/Note Dialog */}
      <BugNoteDialog
        isOpen={isBugNoteDialogOpen}
        onClose={() => {
          setIsBugNoteDialogOpen(false);
          setEditingBugNoteId(null);
        }}
        onSave={editingBugNoteId ? 
          (bugNote) => handleUpdateBugNote(editingBugNoteId, bugNote) : 
          handleCreateBugNote
        }
        bugNote={getEditingBugNote()}
        tasks={project.tasks}
      />
    </div>
  );
}
