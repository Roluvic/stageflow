import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../../App';
import type { Event, Assignment, EventType, EventStatus } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { X } from 'lucide-react';

interface EventFormProps {
    event?: Event | null;
    onSave: (event: Omit<Event, 'id' | 'bandId'> | Event) => void;
    onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
    const { venues, users } = useContext(AppContext);
    const venueDropdownRef = useRef<HTMLDivElement>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'show' as EventType,
        status: 'draft' as EventStatus,
        start: '',
        end: '',
        venueId: '',
    });

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    
    // State for searchable venue select
    const [venueSearch, setVenueSearch] = useState('');
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    
    const filteredVenues = venues.filter(v => v.name.toLowerCase().includes(venueSearch.toLowerCase()));
    const selectedVenueName = venues.find(v => v.id === formData.venueId)?.name || '';

     useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description || '',
                type: event.type,
                status: event.status,
                start: event.start.toISOString().substring(0, 16),
                end: event.end.toISOString().substring(0, 16),
                venueId: event.venueId,
            });
            setAssignments(event.assignments);
        } else {
             setFormData({
                title: '', description: '', type: 'show', status: 'draft',
                start: '', end: '', venueId: '',
            });
            setAssignments([]);
        }
    }, [event]);


    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (venueDropdownRef.current && !venueDropdownRef.current.contains(e.target as Node)) {
                setIsVenueDropdownOpen(false);
                setVenueSearch(''); // Reset search on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAssignment = () => {
        if (users.length > 0) {
            setAssignments(prev => [...prev, { userId: users[0].id, role: '', fee: undefined }]);
        }
    }

    const handleAssignmentChange = (index: number, field: keyof Assignment, value: string | number) => {
        const newAssignments = [...assignments];
        (newAssignments[index] as any)[field] = value;
        if (field === 'fee') {
             (newAssignments[index] as any)[field] = value === '' ? undefined : Number(value);
        }
        setAssignments(newAssignments);
    }
    
    const handleRemoveAssignment = (index: number) => {
        setAssignments(prev => prev.filter((_, i) => i !== index));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.venueId) {
            alert("Selecteer een venue.");
            return;
        }
        const dataToSave = {
            ...formData,
            start: new Date(formData.start),
            end: new Date(formData.end),
            assignments,
        };

        if (event) {
             onSave({ ...event, ...dataToSave });
        } else {
             onSave(dataToSave as Omit<Event, 'id' | 'bandId'>);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Titel</label>
                <Input name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="show">Show</option>
                    <option value="rehearsal">Repetitie</option>
                    <option value="meeting">Meeting</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Start</label>
                    <Input name="start" type="datetime-local" value={formData.start} onChange={handleChange} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Einde</label>
                    <Input name="end" type="datetime-local" value={formData.end} onChange={handleChange} required />
                </div>
            </div>
             <div ref={venueDropdownRef}>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Locatie</label>
                <div className="relative">
                    <Input
                        type="text"
                        placeholder="Zoek een locatie..."
                        value={isVenueDropdownOpen ? venueSearch : selectedVenueName}
                        onChange={(e) => {
                            setVenueSearch(e.target.value);
                            setIsVenueDropdownOpen(true);
                            if (formData.venueId) setFormData(prev => ({ ...prev, venueId: '' }));
                        }}
                        onFocus={() => {
                            setIsVenueDropdownOpen(true);
                            setVenueSearch('');
                        }}
                        required={!formData.venueId}
                    />
                    {isVenueDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredVenues.length > 0 ? filteredVenues.map(v => (
                                <div
                                    key={v.id}
                                    className="p-2 hover:bg-accent cursor-pointer"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, venueId: v.id }));
                                        setVenueSearch('');
                                        setIsVenueDropdownOpen(false);
                                    }}
                                >
                                    <p className="font-semibold">{v.name}</p>
                                    <p className="text-sm text-muted-foreground">{v.address}</p>
                                </div>
                            )) : <p className="p-2 text-sm text-muted-foreground">Geen locaties gevonden</p>}
                        </div>
                    )}
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="draft">Optie</option>
                    <option value="confirmed">Bevestigd</option>
                    <option value="canceled">Geannuleerd</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Omschrijving</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>

            <div>
                 <h3 className="text-lg font-semibold mb-2">Toewijzingen</h3>
                 <div className="space-y-2">
                    {assignments.map((assignment, index) => (
                        <div key={index} className="grid grid-cols-[1fr,1fr,auto,auto] gap-2 items-center">
                             <select value={assignment.userId} onChange={(e) => handleAssignmentChange(index, 'userId', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <Input placeholder="Rol" value={assignment.role} onChange={(e) => handleAssignmentChange(index, 'role', e.target.value)} />
                            <Input type="number" placeholder="Fee (€)" value={assignment.fee || ''} onChange={(e) => handleAssignmentChange(index, 'fee', e.target.value)} className="w-28" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAssignment(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                 </div>
                 <Button type="button" variant="secondary" onClick={handleAddAssignment} className="mt-2">Persoon toevoegen</Button>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Opslaan</Button>
            </div>
        </form>
    );
};