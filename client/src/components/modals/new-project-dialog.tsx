import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "@/types";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectName: string, estimationDays: number, selectedUsers: number[]) => void;
  users: User[];
}

export function NewProjectDialog({ isOpen, onClose, onCreateProject, users }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [estimationDays, setEstimationDays] = useState<number | ''>('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [errors, setErrors] = useState({
    name: false,
    days: false
  });

  const handleSubmit = () => {
    const hasNameError = !projectName.trim();
    const hasDaysError = typeof estimationDays !== 'number' || estimationDays <= 0;
    
    setErrors({
      name: hasNameError,
      days: hasDaysError
    });
    
    if (hasNameError || hasDaysError) {
      return;
    }
    
    onCreateProject(projectName, estimationDays as number, selectedUsers);
    resetForm();
  };

  const resetForm = () => {
    setProjectName('');
    setEstimationDays('');
    setSelectedUsers([]);
    setErrors({ name: false, days: false });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className={errors.name ? 'text-red-500' : ''}>
              Nom du projet {errors.name && '*'}
            </Label>
            <Input
              id="project-name"
              placeholder="Entrez un nom de projet"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-500">Le nom du projet est requis</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-days" className={errors.days ? 'text-red-500' : ''}>
              Estimation (jours) {errors.days && '*'}
            </Label>
            <Input
              id="project-days"
              type="number"
              min="1"
              placeholder="Nombre de jours estimés"
              value={estimationDays}
              onChange={(e) => {
                const val = e.target.value;
                setEstimationDays(val === '' ? '' : Number(val));
              }}
              className={errors.days ? 'border-red-500' : ''}
            />
            {errors.days && (
              <p className="text-xs text-red-500">L'estimation doit être un nombre positif</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Utilisateurs assignés</Label>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`user-${user.id}`} 
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <Label 
                    htmlFor={`user-${user.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {user.name} ({user.role})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Créer le projet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
