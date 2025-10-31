
import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Button } from '../../components/ui/Button';
import { Plus, Edit, Trash2, Check, Circle } from 'lucide-react';
import type { Task } from '../../types';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

const TaskForm: React.FC<{ task?: Task | null, onSave: (task: Omit<Task, 'id' | 'bandId'> | Task) => void, onCancel: () => void }> = ({ task, onSave, onCancel }) => {
    const { users } = useContext(AppContext);
    const [formData, setFormData] = useState({
        title: task?.title || '',
        status: task?.status || 'todo' as 'todo' | 'done',
        assignedTo: task?.assignedTo || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData, assignedTo: formData.assignedTo || undefined };
        if (task) {
            onSave({ ...task, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Taakomschrijving</label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-muted-foreground mb-1">Toegewezen aan</label>
                <select id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Niemand</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="todo">To Do</option>
                    <option value="done">Done</option>
                </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Opslaan</Button>
            </div>
        </form>
    )
};


export const TasksPage: React.FC = () => {
    const { tasks, users, addTask, updateTask, deleteTask } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
  
    const handleOpenModal = (task?: Task) => {
      setEditingTask(task || null);
      setIsModalOpen(true);
    };
  
    const handleCloseModal = () => {
      setEditingTask(null);
      setIsModalOpen(false);
    };
  
    const handleSave = (taskData: Omit<Task, 'id' | 'bandId'> | Task) => {
      if ('id' in taskData) {
        updateTask(taskData);
      } else {
        addTask(taskData);
      }
      handleCloseModal();
    };
  
    const handleDelete = (taskId: string) => {
      if (window.confirm("Weet je zeker dat je deze taak wilt verwijderen?")) {
        deleteTask(taskId);
      }
    };

    const handleToggleStatus = (task: Task) => {
        updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
    }
  
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Taken</h1>
            <p className="text-muted-foreground">Houd overzicht op alles wat er moet gebeuren.</p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-5 w-5" />
            Nieuwe Taak
          </Button>
        </div>
        
        <Card className="rounded-2xl">
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                {tasks.map(task => {
                    const assignedUser = users.find(u => u.id === task.assignedTo);
                    return (
                        <div key={task.id} className="p-4 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleToggleStatus(task)}>
                                   {task.status === 'done' ? <Check className="h-5 w-5 text-green-500"/> : <Circle className="h-5 w-5 text-muted-foreground" />}
                               </Button>
                               <div>
                                   <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                                   {assignedUser && <p className="text-sm text-muted-foreground">Toegewezen aan {assignedUser.firstName}</p>}
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleOpenModal(task)}><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </div>
                    )
                })}
                {tasks.length === 0 && (
                    <p className="text-center text-muted-foreground p-8">Geen taken gevonden.</p>
                )}
                </div>
            </CardContent>
        </Card>

        <Dialog isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Taak Bewerken' : 'Nieuwe Taak Toevoegen'}>
          <TaskForm task={editingTask} onSave={handleSave} onCancel={handleCloseModal} />
        </Dialog>
      </div>
    );
  };