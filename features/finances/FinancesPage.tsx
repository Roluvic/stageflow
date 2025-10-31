

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DollarSign, Search, Download, ArrowUpDown } from 'lucide-react';
import type { Event, User, UserRole } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type RoleCategory = 'all' | 'artist' | 'production' | 'management';

const mapUserRoleToCategory = (role: UserRole): RoleCategory => {
    if (role === 'artist') return 'artist';
    if (role === 'crew') return 'production';
    if (role === 'owner' || role === 'manager') return 'management';
    return 'all'; // Should not happen with current roles but as a fallback
}

export const FinancesPage: React.FC = () => {
  const { events, users, toast } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleCategory>('all');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [selectedPersonId, setSelectedPersonId] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'event' | 'date' | 'budget', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });

  // Base flat list of all individual payments
  const financialData = useMemo(() => {
    const data: { event: Event, assignment: { userId: string, role: string, fee?: number, user: User | undefined } }[] = [];
    events.forEach(event => {
      event.assignments.forEach(assignment => {
        if (assignment.fee && assignment.fee > 0) {
          const user = users.find(u => u.id === assignment.userId);
          data.push({
            event,
            assignment: { ...assignment, user },
          });
        }
      });
    });
    return data.sort((a, b) => a.event.start.getTime() - b.event.start.getTime());
  }, [events, users]);
  
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    financialData.forEach(({ event }) => {
        const monthKey = `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [financialData]);

  // The filtered flat list, which drives the side cards
  const filteredFinancialData = useMemo(() => {
      return financialData.filter(({ event, assignment }) => {
          const user = assignment.user;
          const lowerCaseSearch = searchTerm.toLowerCase();

          const matchesSearch = 
            event.title.toLowerCase().includes(lowerCaseSearch) ||
            user?.name.toLowerCase().includes(lowerCaseSearch);

          const matchesRole = 
            roleFilter === 'all' ||
            (user && mapUserRoleToCategory(user.role) === roleFilter);
            
          const matchesEvent = selectedEventId === 'all' || event.id === selectedEventId;
          const matchesPerson = selectedPersonId === 'all' || (user && user.id === selectedPersonId);
          
          const eventMonthKey = `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}`;
          const matchesMonth = selectedMonth === 'all' || eventMonthKey === selectedMonth;

          return matchesSearch && matchesRole && matchesEvent && matchesPerson && matchesMonth;
      });
  }, [financialData, searchTerm, roleFilter, selectedEventId, selectedPersonId, selectedMonth]);

  // Data grouped by event for the main table, derived from the filtered flat list
  const eventBudgetData = useMemo(() => {
    const eventMap = new Map<string, { event: Event; totalFee: number }>();

    filteredFinancialData.forEach(({ event, assignment }) => {
        if (eventMap.has(event.id)) {
            const existing = eventMap.get(event.id)!;
            existing.totalFee += assignment.fee || 0;
        } else {
            eventMap.set(event.id, {
                event,
                totalFee: assignment.fee || 0,
            });
        }
    });

    const sortedData = [...Array.from(eventMap.values())];
    sortedData.sort((a, b) => {
        let comparison = 0;
        if (sortConfig.key === 'event') {
            comparison = a.event.title.localeCompare(b.event.title);
        } else if (sortConfig.key === 'date') {
            comparison = a.event.start.getTime() - b.event.start.getTime();
        } else { // budget
            comparison = a.totalFee - b.totalFee;
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sortedData;
  }, [filteredFinancialData, sortConfig]);


  // Total for the "Totaal Gefilterd" card
  const totalFilteredAmount = filteredFinancialData.reduce((acc, item) => acc + (item.assignment.fee || 0), 0);

  // Data for the "Totaal per Persoon" card
  const dataByUser = useMemo(() => {
      const userMap = new Map<string, { user: User; totalFee: number; count: number }>();
      filteredFinancialData.forEach(({ assignment }) => {
          if (!assignment.user) return;
          if (userMap.has(assignment.user.id)) {
              const existing = userMap.get(assignment.user.id)!;
              existing.totalFee += assignment.fee || 0;
              existing.count += 1;
          } else {
              userMap.set(assignment.user.id, {
                  user: assignment.user,
                  totalFee: assignment.fee || 0,
                  count: 1,
              });
          }
      });
      return Array.from(userMap.values()).sort((a,b) => b.totalFee - a.totalFee);
  }, [filteredFinancialData]);

  const handleExport = () => {
    const headers = ["Event", "Datum", "Budget/Kosten"];
    const rows = eventBudgetData.map(item => 
        [
            `"${item.event.title.replace(/"/g, '""')}"`, // Escape quotes
            item.event.start.toLocaleDateString('nl-BE'),
            item.totalFee.toString()
        ]
    );
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financien_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Succesvol", description: "Het CSV-bestand wordt gedownload." });
  }
  
  const handleSort = (key: 'event' | 'date' | 'budget') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const selectClass = "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Financiën</h1>
        <p className="text-muted-foreground">Overzicht van alle vergoedingen en kosten.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Budget per Event</CardTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        <div className="relative flex-1 col-span-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Zoek op event of persoon..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className={selectClass}>
                           <option value="all">Alle Events</option>
                           {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleCategory)} className={selectClass}>
                            <option value="all">Alle Rollen</option>
                            <option value="artist">Artiesten</option>
                            <option value="production">Productie / Crew</option>
                            <option value="management">Management</option>
                        </select>
                        <select value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)} className={selectClass}>
                           <option value="all">Alle Personen</option>
                           {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={selectClass}>
                           <option value="all">Alle Maanden</option>
                           {uniqueMonths.map(month => (
                               <option key={month} value={month}>
                                   {new Date(month + '-02').toLocaleString('nl-BE', { month: 'long', year: 'numeric'})}
                               </option>
                           ))}
                        </select>
                         <div className="col-span-full lg:col-span-1 flex justify-end">
                            <Button onClick={handleExport} variant="outline" className="gap-2 w-full lg:w-auto">
                                <Download className="h-4 w-4" />
                                Exporteer naar Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-muted-foreground">
                                <tr>
                                    <th className="p-2">
                                        <Button variant="ghost" onClick={() => handleSort('event')} className="-ml-4">Event {sortConfig.key === 'event' && <ArrowUpDown className="h-4 w-4 ml-1" />}</Button>
                                    </th>
                                    <th className="p-2">
                                        <Button variant="ghost" onClick={() => handleSort('date')}>Datum {sortConfig.key === 'date' && <ArrowUpDown className="h-4 w-4 ml-1" />}</Button>
                                    </th>
                                    <th className="p-2 text-right">
                                        <Button variant="ghost" onClick={() => handleSort('budget')}>Budget / Kosten {sortConfig.key === 'budget' && <ArrowUpDown className="h-4 w-4 ml-1" />}</Button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventBudgetData.map(({ event, totalFee }) => (
                                    <tr key={event.id} className="border-t border-border">
                                        <td className="p-2 font-semibold">{event.title}</td>
                                        <td className="p-2">{event.start.toLocaleDateString('nl-BE')}</td>
                                        <td className="p-2 text-right font-mono">€{totalFee.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {eventBudgetData.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center p-8 text-muted-foreground">Geen resultaten gevonden.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
           </Card>
        </div>
        <div>
            <Card className="rounded-2xl">
                 <CardHeader>
                    <CardTitle>Totaal per Persoon</CardTitle>
                </CardHeader>
                 <CardContent>
                    <div className="space-y-2">
                        {dataByUser.map(({ user, totalFee, count }) => (
                            <div key={user.id} className="flex justify-between items-center p-2 bg-secondary rounded-lg">
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{count} {count === 1 ? 'event' : 'events'}</p>
                                </div>
                                <p className="font-mono font-semibold">€{totalFee.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}</p>
                            </div>
                        ))}
                         {dataByUser.length === 0 && (
                            <p className="text-center p-4 text-muted-foreground">Geen data.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
             <Card className="rounded-2xl mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/> Totaal Gefilterd</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold font-mono">
                        €{totalFilteredAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};