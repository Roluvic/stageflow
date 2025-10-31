import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AlertCircle, Calendar, Map } from 'lucide-react';
import type { Event } from '../../types';
import { useVisibleEvents } from '../../hooks/use-visible-events';
import { EventDetailModal } from '../calendar/components/EventDetailModal';
import { MapView } from '../../components/ui/MapView';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const { users, venues } = useContext(AppContext);
  const venue = venues.find(v => v.id === event.venueId);
  const assignedUsers = event.assignments.map(a => users.find(u => u.id === a.userId)).filter(Boolean);
  const totalFee = event.assignments.reduce((sum, a) => sum + (a.fee || 0), 0);

  const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('nl-BE', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Brussels',
      }).format(date);
  }

  const badgeColor = {
    show: 'bg-red-100 text-red-700 border-red-200',
    rehearsal: 'bg-blue-100 text-blue-700 border-blue-200',
    meeting: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="p-4 bg-card rounded-2xl border border-border flex items-start space-x-4">
      <div className="flex flex-col items-center justify-center w-16">
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('nl-BE', { month: 'short', timeZone: 'Europe/Brussels' }).format(event.start)}
        </p>
        <p className="text-2xl font-bold text-foreground">
          {new Intl.DateTimeFormat('nl-BE', { day: '2-digit', timeZone: 'Europe/Brussels' }).format(event.start)}
        </p>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg">{event.title}</h3>
                <p className="text-muted-foreground">{venue?.name}</p>
            </div>
            <Badge variant="outline" className={badgeColor[event.type]}>{event.type}</Badge>
        </div>
        <div className="flex justify-between items-end mt-2">
            <div className="flex -space-x-2 overflow-hidden">
                {assignedUsers.map(user => user && <Avatar key={user.id} src={user.avatar} firstName={user.firstName} lastName={user.lastName} className="inline-block h-8 w-8 rounded-full ring-2 ring-background" />)}
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-semibold">{formatDate(event.start)} - {formatDate(event.end)}</p>
              {totalFee > 0 && (
                <p className="text-sm text-green-600 font-semibold" aria-label={`Totale vergoeding: ${totalFee} euro`}>
                  €{totalFee.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
        </div>
      </div>
    </div>
  )
};


export const Dashboard: React.FC = () => {
  const { currentUser, venues } = useContext(AppContext);
  const visibleEvents = useVisibleEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [timeFilter, setTimeFilter] = useState<3 | 6 | 12>(12);
  
  const canManage = currentUser && ['owner', 'manager'].includes(currentUser.role);
  
  const today = new Date();
  const nextSevenDays = new Date();
  nextSevenDays.setDate(today.getDate() + 7);
  
  const filterEndDate = new Date();
  filterEndDate.setMonth(today.getMonth() + timeFilter);

  const upcomingEvents = visibleEvents.filter(e => e.start >= today && e.start <= nextSevenDays);
  const conflicts = visibleEvents.filter(e => e.tags?.includes('conflict'));
  const eventsForPeriod = visibleEvents.filter(e => e.start >= today && e.start <= filterEndDate);
  
  const eventsWithCoords = eventsForPeriod
    .map(event => {
        const venue = venues.find(v => v.id === event.venueId);
        return {
            ...event,
            name: event.title, // MapView needs a 'name' prop
            lat: venue?.lat,
            lng: venue?.lng
        };
    })
    .filter(event => event.lat && event.lng);

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welkom, {currentUser?.firstName}! Je bent ingelogd als {currentUser?.role}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Komende 7 Dagen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                    {upcomingEvents.map(event => <EventCard key={event.id} event={event}/>)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Geen evenementen gepland voor de komende week.</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Map className="h-5 w-5 mr-2 text-primary" />
                Events Komende Periode
              </CardTitle>
              <div className="flex items-center border border-input rounded-md p-0.5">
                {([12, 6, 3] as const).map(m => (
                    <Button key={m} variant={timeFilter === m ? 'secondary' : 'ghost'} size="sm" onClick={() => setTimeFilter(m)}>
                        {m} mnd
                    </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
                <MapView items={eventsWithCoords} className="h-64 mb-4" />
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {eventsForPeriod.map(event => {
                        const venue = venues.find(v => v.id === event.venueId);
                        return (
                            <div key={event.id} onClick={() => setSelectedEvent(event)} className="p-2 rounded-lg hover:bg-accent cursor-pointer">
                                <p className="font-semibold">{event.title}</p>
                                <p className="text-sm text-muted-foreground">{venue?.name} - {event.start.toLocaleDateString('nl-BE')}</p>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {canManage && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Conflicten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conflicts.length > 0 ? (
                  <div className="space-y-2">
                    {conflicts.map(event => (
                      <div key={event.id} className="p-3 bg-destructive/10 rounded-lg">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">Dubbele boeking gedetecteerd.</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Geen conflicten gedetecteerd.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
       {selectedEvent && (
        <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};