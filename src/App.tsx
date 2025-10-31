import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { CalendarView } from './features/calendar/CalendarView';
import { AiAssistant } from './features/ai/AiAssistant';
import { mockEvents, mockUsers, mockVenues, mockDocuments, mockBands, mockFolders, mockTasks } from './lib/mockData';
import type { Event, User, Venue, Document, Band, Folder, Task } from './types';
import { Toaster } from './components/ui/Toaster';
import { useToast } from './hooks/use-toast';
import { isConflict } from './lib/eventUtils';
import { Login } from './features/auth/Login';
import { PersonsPage } from './features/persons/PersonsPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { FinancesPage } from './features/finances/FinancesPage';
import { BandManagementPage } from './features/bands/BandManagementPage';
import { hexToHsl } from './lib/colorUtils';
import { TasksPage } from './features/tasks/TasksPage';

export const AppContext = React.createContext<{
  // State
  events: Event[];
  users: User[];
  allUsers: User[];
  venues: Venue[];
  documents: Document[];
  folders: Folder[];
  bands: Band[];
  tasks: Task[];
  currentUser: User | null;
  currentBand: Band | null;

  // Auth
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  
  // Band Management
  switchBand: (bandId: string) => void;
  addBand: (band: Omit<Band, 'id'>) => void;
  updateBand: (band: Band) => void;
  deleteBand: (bandId: string) => void;

  // CRUD Functions
  addEvent: (event: Omit<Event, 'id' | 'bandId'>) => void;
  updateEvent: (event: Event) => void;
  updateEventTime: (eventId: string, newStart: Date, newEnd: Date) => void;
  deleteEvent: (eventId: string) => void;
  addUser: (user: Omit<User, 'id' | 'bandId'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  addVenue: (venue: Omit<Venue, 'id' | 'bandId'>) => void;
  updateVenue: (venue: Venue) => void;
  deleteVenue: (venueId: string) => void;
  addFolder: (folderName: string) => void;
  updateFolder: (folder: Folder) => void;
  deleteFolder: (folderId: string) => void;
  addDocument: (doc: Omit<Document, 'id' | 'bandId'>) => void;
  updateDocument: (doc: Document) => void;
  deleteDocument: (docId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'bandId'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  toast: (args: { title?: React.ReactNode; description?: React.ReactNode; variant?: 'default' | 'destructive' }) => void;
}>({
  events: [], users: [], allUsers: [], venues: [], documents: [], folders: [], bands: [], tasks: [],
  currentUser: null, currentBand: null,
  login: () => false, logout: () => { },
  switchBand: () => { }, addBand: () => { }, updateBand: () => { }, deleteBand: () => { },
  addEvent: () => { }, updateEvent: () => { }, updateEventTime: () => { }, deleteEvent: () => { }, addUser: () => { }, updateUser: () => { }, deleteUser: () => { },
  addVenue: () => { }, updateVenue: () => { }, deleteVenue: () => { },
  addFolder: () => { }, updateFolder: () => { }, deleteFolder: () => { },
  addDocument: () => { }, updateDocument: () => { }, deleteDocument: () => { },
  addTask: () => {}, updateTask: () => {}, deleteTask: () => {},
  toast: () => { },
});

const App: React.FC = () => {
  // Global State
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);
  const [allVenues, setAllVenues] = useState<Venue[]>(mockVenues);
  const [allEvents, setAllEvents] = useState<Event[]>(mockEvents);
  const [allDocuments, setAllDocuments] = useState<Document[]>(mockDocuments);
  const [allFolders, setAllFolders] = useState<Folder[]>(mockFolders);
  const [allBands, setAllBands] = useState<Band[]>(mockBands);
  const [allTasks, setAllTasks] = useState<Task[]>(mockTasks);
  
  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBandId, setCurrentBandId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const runConflictCheck = (events: Event[]) => {
      const checkedEvents = [...events];
      checkedEvents.forEach(e => { e.tags = e.tags?.filter(t => t !== 'conflict') || []; });
      for (let i = 0; i < checkedEvents.length; i++) {
          for (let j = i + 1; j < checkedEvents.length; j++) {
              if (isConflict(checkedEvents[i], checkedEvents[j])) {
                  if (!checkedEvents[i].tags!.includes('conflict')) checkedEvents[i].tags!.push('conflict');
                  if (!checkedEvents[j].tags!.includes('conflict')) checkedEvents[j].tags!.push('conflict');
              }
          }
      }
      return checkedEvents;
    };
    setAllEvents(prevEvents => runConflictCheck(prevEvents));
  }, []);

  // --- DERIVED STATE ---

  const accessibleBands = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'owner') return allBands;
    
    // For all other roles, they can only "see" the band they are directly assigned to.
    const userBand = allBands.find(b => b.id === currentUser.bandId);
    return userBand ? [userBand] : [];
  }, [allBands, currentUser]);

  const currentBand = useMemo(() => allBands.find(b => b.id === currentBandId) || null, [allBands, currentBandId]);

  // Data scoped to the currently selected band
  const users = useMemo(() => allUsers.filter(u => u.bandId === currentBandId), [allUsers, currentBandId]);
  const venues = useMemo(() => allVenues.filter(v => v.bandId === currentBandId), [allVenues, currentBandId]);
  const events = useMemo(() => allEvents.filter(e => e.bandId === currentBandId).sort((a,b) => a.start.getTime() - b.start.getTime()), [allEvents, currentBandId]);
  const documents = useMemo(() => allDocuments.filter(d => d.bandId === currentBandId), [allDocuments, currentBandId]);
  const folders = useMemo(() => allFolders.filter(f => f.bandId === currentBandId), [allFolders, currentBandId]);
  const tasks = useMemo(() => allTasks.filter(t => t.bandId === currentBandId), [allTasks, currentBandId]);


   // --- DYNAMIC THEME ---
  useEffect(() => {
    const root = document.documentElement;
    if (currentBand?.themeColor) {
      const hsl = hexToHsl(currentBand.themeColor);
      if (hsl) {
        root.style.setProperty('--primary', hsl);
        // Optional: you could derive other colors here too
        root.style.setProperty('--ring', hsl);
      }
    } else {
      // Reset to default if no theme color or band is switched
      root.style.setProperty('--primary', '217 91% 60%');
      root.style.setProperty('--ring', '217 91% 60%');
    }
  }, [currentBand]);

  // --- AUTH ---
  const login = (email: string, password?: string): boolean => {
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === password && user.isUser) { // Check if user has an active account
      setCurrentUser(user);
      // An owner might not be in a band, but should see the first available one.
      const initialBandId = user.bandId || (user.role === 'owner' && allBands.length > 0 ? allBands[0].id : null);
      setCurrentBandId(initialBandId);
      toast({ title: `Welkom, ${user.firstName}!`, description: `Je bent ingelogd als ${user.role}.` });
      return true;
    }
    return false;
  };
  const logout = () => {
    setCurrentUser(null);
    setCurrentBandId(null);
  };
  
  // --- BAND MANAGEMENT ---
  const switchBand = (bandId: string) => {
      if (currentUser?.role === 'owner' || allUsers.find(u => u.id === currentUser?.id)?.bandId === bandId) {
          setCurrentBandId(bandId);
      }
  };
  const addBand = (band: Omit<Band, 'id'>) => {
    const newBand = { ...band, id: `band-${Date.now()}` };
    setAllBands(prev => [...prev, newBand]);
    setCurrentBandId(newBand.id);
    toast({ title: "Band Aangemaakt", description: `Je beheert nu "${newBand.name}".` });
  };
  const updateBand = (bandToUpdate: Band) => {
    setAllBands(prev => prev.map(b => b.id === bandToUpdate.id ? bandToUpdate : b));
    toast({ title: "Band Bijgewerkt" });
  }
  const deleteBand = (bandId: string) => {
    if (!window.confirm("Weet je zeker dat je deze band wilt verwijderen? ALLE bijbehorende data (events, personen, etc.) wordt permanent verwijderd.")) return;
    
    const newAllBands = allBands.filter(b => b.id !== bandId);

    setAllBands(newAllBands);
    setAllEvents(prev => prev.filter(item => item.bandId !== bandId));
    setAllUsers(prev => prev.filter(item => item.bandId !== bandId));
    setAllVenues(prev => prev.filter(item => item.bandId !== bandId));
    setAllDocuments(prev => prev.filter(item => item.bandId !== bandId));
    setAllFolders(prev => prev.filter(item => item.bandId !== bandId));
    setAllTasks(prev => prev.filter(item => item.bandId !== bandId));
    
    if (currentBandId === bandId) {
        const fallbackBandId = currentUser?.bandId && newAllBands.some(b => b.id === currentUser.bandId)
            ? currentUser.bandId
            : newAllBands.length > 0 ? newAllBands[0].id : null;
            
        if (fallbackBandId) {
            setCurrentBandId(fallbackBandId);
        } else {
            logout();
        }
    }
    toast({ title: "Band Verwijderd", variant: "destructive" });
  }

  // --- EVENT MANAGEMENT ---
  const runConflictCheckOnList = (eventsList: Event[]): Event[] => {
    const checkedEvents = [...eventsList];
    checkedEvents.forEach(e => { e.tags = e.tags?.filter(t => t !== 'conflict') || []; });
    for (let i = 0; i < checkedEvents.length; i++) {
        for (let j = i + 1; j < checkedEvents.length; j++) {
            if (isConflict(checkedEvents[i], checkedEvents[j])) {
                if (!checkedEvents[i].tags!.includes('conflict')) checkedEvents[i].tags!.push('conflict');
                if (!checkedEvents[j].tags!.includes('conflict')) checkedEvents[j].tags!.push('conflict');
            }
        }
    }
    return checkedEvents;
  }

  const addEvent = (event: Omit<Event, 'id' | 'bandId'>) => {
    if (!currentBandId) return;
    const newEvent: Event = { ...event, id: `evt-${Date.now()}`, tags: [], bandId: currentBandId };
    setAllEvents(prev => runConflictCheckOnList([...prev, newEvent]));
    toast({ title: "Evenement Gepland", description: `"${newEvent.title}" is toegevoegd.` });
  };

  const updateEvent = (eventToUpdate: Event) => {
     setAllEvents(prev => {
        const updatedList = prev.map(e => e.id === eventToUpdate.id ? eventToUpdate : e);
        return runConflictCheckOnList(updatedList);
    });
    toast({ title: 'Evenement Bijgewerkt', description: 'De planning is bijgewerkt.' });
  }

  const updateEventTime = (eventId: string, newStart: Date, newEnd: Date) => {
    const eventToUpdate = allEvents.find(e => e.id === eventId);
    if(eventToUpdate) {
        updateEvent({ ...eventToUpdate, start: newStart, end: newEnd });
    }
  }

  const deleteEvent = (eventId: string) => {
    if (!window.confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) return;
    setAllEvents(prev => prev.filter(e => e.id !== eventId));
    toast({ title: 'Evenement Verwijderd' });
  };
  
  // --- OTHER CRUD ---
  const addUser = (user: Omit<User, 'id' | 'bandId'>) => {
    if (!currentBandId) return;
    const newUser = { ...user, id: `user-${Date.now()}`, bandId: currentBandId };
    setAllUsers(prev => [...prev, newUser]);
    toast({ title: 'Persoon Toegevoegd', description: `${user.name} is toegevoegd aan het team.` });
     if (newUser.isUser) {
      toast({ title: "Toegang Verleend", description: `${newUser.name} heeft direct toegang tot StageFlow.` });
    }
  }
  const updateUser = (userToUpdate: User) => {
    const originalUser = allUsers.find(u => u.id === userToUpdate.id);
    setAllUsers(prev => prev.map(user => user.id === userToUpdate.id ? userToUpdate : user));
    if (userToUpdate.id === currentUser?.id) setCurrentUser(userToUpdate);
    
    if (originalUser) {
        if (!originalUser.isUser && userToUpdate.isUser) {
            toast({ title: "Toegang Verleend", description: `${userToUpdate.name} heeft nu toegang tot StageFlow.` });
        } else if (originalUser.isUser && !userToUpdate.isUser) {
            toast({ title: "Toegang Ingetrokken", description: `${userToUpdate.name} heeft niet langer toegang tot StageFlow.` });
        } else if (userToUpdate.password !== originalUser.password) {
            toast({ title: 'Wachtwoord Gewijzigd' });
        }
        else {
            toast({ title: 'Profiel Bijgewerkt' });
        }
    }
  }
  const deleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(user => user.id !== userId));
    setAllEvents(prev => prev.map(event => ({ ...event, assignments: event.assignments.filter(a => a.userId !== userId) })));
    toast({ title: 'Persoon Verwijderd' });
    if (currentUser && currentUser.id === userId) logout();
  };
  
  const addVenue = (venue: Omit<Venue, 'id'| 'bandId'>) => {
    if (!currentBandId) return;
    const newVenue = { ...venue, id: `venue-${Date.now()}`, bandId: currentBandId };
    setAllVenues(prev => [...prev, newVenue]);
    toast({ title: 'Locatie Toegevoegd' });
  }
  const updateVenue = (venueToUpdate: Venue) => {
    setAllVenues(prev => prev.map(venue => venue.id === venueToUpdate.id ? venueToUpdate : venue));
    toast({ title: 'Locatie Bijgewerkt' });
  }
  const deleteVenue = (venueId: string) => {
    if (allEvents.some(event => event.venueId === venueId)) {
        toast({ title: 'Verwijderen Mislukt', description: 'Deze locatie is nog in gebruik voor een of meerdere evenementen.', variant: 'destructive' });
        return;
    }
    setAllVenues(prev => prev.filter(venue => venue.id !== venueId));
    toast({ title: 'Locatie Verwijderd' });
  };

  const addFolder = (folderName: string) => {
    if (!currentBandId) return;
    const newFolder = { id: `folder-${Date.now()}`, name: folderName, bandId: currentBandId };
    setAllFolders(prev => [...prev, newFolder]);
    toast({ title: 'Map Aangemaakt' });
  }
  const updateFolder = (folderToUpdate: Folder) => {
    setAllFolders(prev => prev.map(f => f.id === folderToUpdate.id ? { ...f, name: folderToUpdate.name } : f));
    toast({ title: 'Mapnaam Bijgewerkt' });
  }
  const deleteFolder = (folderId: string) => {
    if (allDocuments.some(d => d.folderId === folderId)) {
        toast({ title: 'Verwijderen Mislukt', description: 'Deze map bevat nog documenten.', variant: 'destructive' });
        return;
    }
    setAllFolders(prev => prev.filter(f => f.id !== folderId));
    toast({ title: 'Map Verwijderd' });
  }
  
  const addDocument = (doc: Omit<Document, 'id'|'bandId'>) => {
    if (!currentBandId) return;
    const newDoc = { ...doc, id: `doc-${Date.now()}`, bandId: currentBandId };
    setAllDocuments(prev => [...prev, newDoc]);
    toast({ title: 'Document Toegevoegd' });
  }
  const updateDocument = (docToUpdate: Document) => {
    setAllDocuments(prev => prev.map(doc => doc.id === docToUpdate.id ? docToUpdate : doc));
    toast({ title: 'Document Bijgewerkt' });
  }
  const deleteDocument = (docId: string) => {
    setAllDocuments(prev => prev.filter(doc => doc.id !== docId));
    toast({ title: 'Document Verwijderd' });
  }

  const addTask = (task: Omit<Task, 'id'|'bandId'>) => {
    if (!currentBandId) return;
    const newTask = { ...task, id: `task-${Date.now()}`, bandId: currentBandId };
    setAllTasks(prev => [...prev, newTask]);
    toast({ title: 'Taak Toegevoegd' });
  }
  const updateTask = (taskToUpdate: Task) => {
    setAllTasks(prev => prev.map(task => task.id === taskToUpdate.id ? taskToUpdate : task));
    toast({ title: 'Taak Bijgewerkt' });
  }
  const deleteTask = (taskId: string) => {
    setAllTasks(prev => prev.filter(task => task.id !== taskId));
    toast({ title: 'Taak Verwijderd' });
  }

  const contextValue = {
    events, users, allUsers, venues, documents, folders, tasks,
    bands: accessibleBands,
    currentUser, currentBand,
    login, logout, switchBand, addBand, updateBand, deleteBand,
    addEvent, updateEvent, updateEventTime, deleteEvent, addUser, updateUser, deleteUser, addVenue, updateVenue, deleteVenue,
    addFolder, updateFolder, deleteFolder,
    addDocument, updateDocument, deleteDocument,
    addTask, updateTask, deleteTask,
    toast,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        {currentUser ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/persons" element={<PersonsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/finances" element={<FinancesPage />} />
              <Route path="/bands" element={<BandManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <AiAssistant />
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </HashRouter>
      <Toaster />
    </AppContext.Provider>
  );
};

export default App;