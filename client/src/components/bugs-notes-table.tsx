import { useState, useEffect, useRef } from "react";
import { storage, formatDate } from "@/lib/storage";
import { Project, Task, BugNote } from "@/types";
import { BugNoteDialog } from "@/components/modals/bug-note-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BugsNotesTableProps {
  projectId: number;
}

export default function BugsNotesTable({ projectId }: BugsNotesTableProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isBugNoteDialogOpen, setIsBugNoteDialogOpen] = useState(false);
  const [editingBugNoteId, setEditingBugNoteId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Inline editing states
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [editedType, setEditedType] = useState<'bug' | 'note'>('bug');
  const [editedContent, setEditedContent] = useState<string>('');
  const [editedTaskId, setEditedTaskId] = useState<string>('null');
  
  // Refs for handling click outside
  const editRowRef = useRef<HTMLTableRowElement | null>(null);

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
  
  // Start inline editing of a bug/note
  const startInlineEdit = (bugNote: BugNote) => {
    setInlineEditingId(bugNote.id);
    setEditedType(bugNote.type);
    setEditedContent(bugNote.contenu);
    setEditedTaskId(bugNote.tache_id ? String(bugNote.tache_id) : 'null');
  };
  
  // Cancel inline editing
  const cancelInlineEdit = () => {
    setInlineEditingId(null);
  };
  
  // Save inline edited bug/note
  const saveInlineEdit = () => {
    if (!inlineEditingId) return;
    
    // Validate fields
    if (!editedContent.trim()) {
      toast({
        title: "Erreur",
        description: "Le contenu ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }
    
    const updatedBugNote = {
      type: editedType,
      contenu: editedContent,
      tache_id: editedTaskId === 'null' ? null : Number(editedTaskId)
    };
    
    try {
      storage.updateBugNote(projectId, inlineEditingId, updatedBugNote);
      
      // Refresh data
      const updatedProject = storage.getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
      
      toast({
        title: `${editedType === 'bug' ? 'Bug' : 'Note'} mis à jour`,
        description: `Le ${editedType === 'bug' ? 'bug' : 'la note'} a été modifié(e) avec succès.`,
      });
      
      setInlineEditingId(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le ${editedType === 'bug' ? 'bug' : 'la note'}.`,
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
              project.bugs_notes.map(bugNote => 
                inlineEditingId === bugNote.id ? (
                  // Editing mode row
                  <tr 
                    key={bugNote.id} 
                    className="border-b border-surface-300 bg-surface-200"
                    ref={editRowRef}
                  >
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <div className="cell-content">{formatDate(bugNote.date)}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Select value={editedType} onValueChange={(val) => setEditedType(val as 'bug' | 'note')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">Bug</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="h-20 text-sm resize-none"
                        placeholder="Description du bug ou contenu de la note"
                      />
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm p-1">
                      <Select value={editedTaskId} onValueChange={setEditedTaskId}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Aucune tâche" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Aucune tâche</SelectItem>
                          {project.tasks.map(task => (
                            <SelectItem key={task.id} value={String(task.id)}>
                              {task.tache}
                            </SelectItem>
                          ))}
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
                    key={bugNote.id} 
                    className="border-b border-surface-300 hover:bg-surface-200"
                    onDoubleClick={() => startInlineEdit(bugNote)}
                  >
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm">
                      <div className="cell-content">{formatDate(bugNote.date)}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(bugNote)}>
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
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(bugNote)}>
                      <div className="cell-content">{bugNote.contenu}</div>
                    </td>
                    <td className="spreadsheet-cell border-r border-surface-300 text-sm cell-editable" onClick={() => startInlineEdit(bugNote)}>
                      <div className="cell-content">{getTaskName(bugNote.tache_id) || '-'}</div>
                    </td>
                    <td className="px-2 py-2 text-sm">
                      <button 
                        className="text-primary hover:text-primary/80"
                        onClick={() => startInlineEdit(bugNote)}
                        title="Éditer en ligne"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-600 ml-2"
                        onClick={() => handleDeleteBugNote(bugNote.id)}
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
