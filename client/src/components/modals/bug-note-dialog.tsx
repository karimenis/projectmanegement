import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BugNote, Task } from "@/types";

interface BugNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bugNote: {
    date: string;
    type: 'bug' | 'note';
    contenu: string;
    tache_id: number | null;
  }) => void;
  bugNote?: BugNote;
  tasks: Task[];
}

export function BugNoteDialog({ isOpen, onClose, onSave, bugNote, tasks }: BugNoteDialogProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'bug' | 'note'>('bug');
  const [content, setContent] = useState('');
  const [taskId, setTaskId] = useState<string>("null");
  const [errors, setErrors] = useState({
    date: false,
    content: false
  });

  useEffect(() => {
    if (bugNote) {
      setDate(bugNote.date);
      setType(bugNote.type);
      setContent(bugNote.contenu);
      setTaskId(bugNote.tache_id ? String(bugNote.tache_id) : '');
    } else {
      resetForm();
    }
  }, [bugNote, isOpen]);

  const handleSubmit = () => {
    const hasDateError = !date;
    const hasContentError = !content.trim();
    
    setErrors({
      date: hasDateError,
      content: hasContentError
    });
    
    if (hasDateError || hasContentError) {
      return;
    }
    
    onSave({
      date,
      type,
      contenu: content,
      tache_id: taskId === "null" ? null : Number(taskId)
    });
    
    if (!bugNote) {
      resetForm();
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setType('bug');
    setContent('');
    setTaskId('');
    setErrors({ date: false, content: false });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bugNote ? 'Modifier le bug / la note' : 'Nouveau bug / note'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bug-date" className={errors.date ? 'text-red-500' : ''}>
              Date {errors.date && '*'}
            </Label>
            <Input
              id="bug-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-xs text-red-500">La date est requise</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bug-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'bug' | 'note')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bug-content" className={errors.content ? 'text-red-500' : ''}>
              Contenu {errors.content && '*'}
            </Label>
            <Textarea
              id="bug-content"
              placeholder="Description du bug ou contenu de la note"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-xs text-red-500">Le contenu est requis</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bug-task">Lié à la tâche (optionnel)</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune tâche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Aucune tâche</SelectItem>
                {tasks.map(task => (
                  <SelectItem key={task.id} value={String(task.id)}>
                    {task.tache}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {bugNote ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
