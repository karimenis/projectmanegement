import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Task } from "@/types";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: {
    date: string;
    tache: string;
    responsable: number | null;
    priorite: 'basse' | 'moyenne' | 'haute';
    heures_estimees: number;
    heures_realisees: number;
    etat: 'réalisé' | 'non réalisé';
  }) => void;
  task?: Task;
  users: User[];
}

export function TaskDialog({ isOpen, onClose, onSave, task, users }: TaskDialogProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [taskDescription, setTaskDescription] = useState('');
  const [userId, setUserId] = useState<string>("null");
  const [priority, setPriority] = useState<'basse' | 'moyenne' | 'haute'>('moyenne');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [actualHours, setActualHours] = useState<number | ''>('');
  const [status, setStatus] = useState<'réalisé' | 'non réalisé'>('non réalisé');
  const [errors, setErrors] = useState({
    date: false,
    task: false,
    estimatedHours: false
  });

  useEffect(() => {
    if (task) {
      setDate(task.date);
      setTaskDescription(task.tache);
      setUserId(task.responsable ? String(task.responsable) : '');
      setPriority(task.priorite);
      setEstimatedHours(task.heures_estimees);
      setActualHours(task.heures_realisees);
      setStatus(task.etat);
    } else {
      resetForm();
    }
  }, [task, isOpen]);

  const handleSubmit = () => {
    const hasDateError = !date;
    const hasTaskError = !taskDescription.trim();
    const hasEstimatedHoursError = typeof estimatedHours !== 'number' || estimatedHours <= 0;
    
    setErrors({
      date: hasDateError,
      task: hasTaskError,
      estimatedHours: hasEstimatedHoursError
    });
    
    if (hasDateError || hasTaskError || hasEstimatedHoursError) {
      return;
    }
    
    onSave({
      date,
      tache: taskDescription,
      responsable: userId === "null" ? null : Number(userId),
      priorite: priority,
      heures_estimees: estimatedHours as number,
      heures_realisees: typeof actualHours === 'number' ? actualHours : 0,
      etat: status
    });
    
    if (!task) {
      resetForm();
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTaskDescription('');
    setUserId("null");
    setPriority('moyenne');
    setEstimatedHours('');
    setActualHours('');
    setStatus('non réalisé');
    setErrors({ date: false, task: false, estimatedHours: false });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-date" className={errors.date ? 'text-red-500' : ''}>
              Date {errors.date && '*'}
            </Label>
            <Input
              id="task-date"
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
            <Label htmlFor="task-description" className={errors.task ? 'text-red-500' : ''}>
              Tâche {errors.task && '*'}
            </Label>
            <Input
              id="task-description"
              placeholder="Description de la tâche"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className={errors.task ? 'border-red-500' : ''}
            />
            {errors.task && (
              <p className="text-xs text-red-500">La description de la tâche est requise</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-user">Responsable</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un responsable" />
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priorité</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as 'basse' | 'moyenne' | 'haute')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-hours-est" className={errors.estimatedHours ? 'text-red-500' : ''}>
              Heures estimées {errors.estimatedHours && '*'}
            </Label>
            <Input
              id="task-hours-est"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="Heures estimées"
              value={estimatedHours}
              onChange={(e) => {
                const val = e.target.value;
                setEstimatedHours(val === '' ? '' : Number(val));
              }}
              className={errors.estimatedHours ? 'border-red-500' : ''}
            />
            {errors.estimatedHours && (
              <p className="text-xs text-red-500">L'estimation des heures doit être un nombre positif</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-hours-done">Heures réalisées</Label>
            <Input
              id="task-hours-done"
              type="number"
              min="0"
              step="0.5"
              placeholder="Heures réalisées"
              value={actualHours}
              onChange={(e) => {
                const val = e.target.value;
                setActualHours(val === '' ? '' : Number(val));
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-status">État</Label>
            <Select 
              value={status} 
              onValueChange={(value) => setStatus(value as 'réalisé' | 'non réalisé')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non réalisé">Non réalisé</SelectItem>
                <SelectItem value="réalisé">Réalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {task ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
