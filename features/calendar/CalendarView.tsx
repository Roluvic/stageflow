import React, { useState, useContext, useMemo, useEffect } from 'react';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { ListView } from './components/ListView';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { AppContext } from '../../App';
import { useVisibleEvents } from '../../hooks/use-visible-events';
import { exportToIcs } from '../../lib/calendarUtils';
import type { EventStatus, Event } from '../../types';
import { EventDetailModal } from './components/EventDetailModal';
import { EventForm } from './components/EventForm';
import { PrintableCalendar } from './components/PrintableCalendar';
import { Input } from '../../components/ui/Input';
import { Copy, Download, MessageSquare } from 'lucide-react';

export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

export const CalendarView: React.FC = () => {
  const { addEvent, updateEvent, currentUser, updateEventTime, toast } = useContext(AppContext);
  const visibleEvents = useVisibleEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>('list');
  const [statusFilters, setStatusFilters] = useState<EventStatus[]>(['confirmed', 'draft']);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [isNewEventFormOpen, setIsNewEventFormOpen] = useState(false);
  const [printState, setPrintState] = useState<{ isPrinting: boolean, view: CalendarViewType }>({ isPrinting: false, view: 'list' });


  const canEdit = currentUser && ['owner', 'manager'].includes(currentUser.role);

  const filteredEvents = useMemo(() => {
    return visibleEvents.filter(event => statusFilters.includes(event.status));
  }, [visibleEvents, statusFilters]);

  useEffect(() => {
    if (printState.isPrinting) {
      setTimeout(() => {
        window.print();
        setPrintState({ isPrinting: false, view: 'list' });
      }, 200);
    }
  }, [printState.isPrinting]);

  // Effect to manage the subscription URL lifecycle
  useEffect(() => {
    if (isSyncModalOpen) {
        const icsString = exportToIcs(filteredEvents);
        const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setSubscriptionUrl(url);
    } else if (subscriptionUrl) {
        // Cleanup when modal closes
        URL.revokeObjectURL(subscriptionUrl);
        setSubscriptionUrl('');
    }

    return () => {
        if (subscriptionUrl) {
            URL.revokeObjectURL(subscriptionUrl);
        }
    }
  }, [isSyncModalOpen, filteredEvents]);


  const handlePrint = (printView: CalendarViewType) => {
    setPrintState({ isPrinting: true, view: printView });
  };
  
  const handleCopyUrl = () => {
    if (subscriptionUrl) {
        navigator.clipboard.writeText(subscriptionUrl)
            .then(() => toast({ title: "URL Gekopieerd!" }))
            .catch(() => toast({ title: "Kopiëren Mislukt", variant: "destructive" }));
    }
  };

  const handleShareOnWhatsApp = () => {
    if (subscriptionUrl) {
      const message = `Abonneer op onze StageFlow kalender met deze link:\n\n${subscriptionUrl}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };


  const handleIcalExport = () => {
    const icsString = exportToIcs(filteredEvents);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'stageflow_kalender.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsSyncModalOpen(false);
  };
  
  const handleSaveEvent = (eventData: Omit<Event, 'id' | 'bandId'> | Event) => {
    if (!canEdit) return;
    if ('id' in eventData) {
        updateEvent(eventData);
    } else {
        addEvent(eventData);
    }
    setIsNewEventFormOpen(false);
    setEventToEdit(null);
  };

  const handleEventDrop = (eventId: string, newStart: Date, newEnd: Date) => {
    if (!canEdit) return;
    updateEventTime(eventId, newStart, newEnd);
  }

  const handleCloseForm = () => {
    setIsNewEventFormOpen(false);
    setEventToEdit(null);
  }

  const renderSyncModalContent = () => {
     return (
        <div className="space-y-4">
            <h3 className="font-semibold">Abonneer op deze kalender</h3>
            <p className="text-muted-foreground text-sm">
                Kopieer en plak deze URL in elke kalenderapplicatie die abonnementen via URL ondersteunt (iCal).
            </p>
             <div className="flex items-center gap-2">
                <Input value={subscriptionUrl} readOnly />
                <Button onClick={handleCopyUrl} size="icon" variant="secondary" aria-label="Kopieer URL">
                    <Copy className="h-4 w-4"/>
                </Button>
            </div>
            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
                <strong>Let op:</strong> Deze URL is tijdelijk en werkt alleen in je huidige browsersessie. Voor een permanente, deelbare link is een server-backend nodig.
            </div>
            <Button className="w-full gap-2" variant="outline" onClick={handleShareOnWhatsApp}>
                <MessageSquare className="h-4 w-4" /> Deel via WhatsApp
            </Button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-sm text-muted-foreground">OF</span>
                </div>
            </div>

            <h3 className="font-semibold">Exporteer eenmalig</h3>
            <p className="text-muted-foreground text-sm">
                Download een .ics-bestand. Dit is een momentopname en wordt niet automatisch bijgewerkt.
            </p>
            <Button className="w-full gap-2" variant="outline" onClick={handleIcalExport}>
                <Download className="h-4 w-4"/> Exporteer als iCal (.ics)
            </Button>
        </div>
    );
  }


  return (
    <>
      {printState.isPrinting && (
        <div className="printable-area">
            <PrintableCalendar 
                events={filteredEvents}
                currentDate={currentDate}
                view={printState.view}
            />
        </div>
      )}
      <div className="h-full flex flex-col">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          view={view}
          setView={setView}
          onSync={() => setIsSyncModalOpen(true)}
          onPrint={handlePrint}
          statusFilters={statusFilters}
          setStatusFilters={setStatusFilters}
          onAddEvent={() => setIsNewEventFormOpen(true)}
          canEdit={canEdit}
        />

        <div className="flex-1">
          {view === 'month' && <MonthView currentDate={currentDate} events={filteredEvents} onEventClick={setSelectedEvent} onEventDrop={handleEventDrop} canEdit={canEdit} />}
          {view === 'week' && <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={setSelectedEvent} onEventDrop={handleEventDrop} canEdit={canEdit} />}
          {view === 'day' && <DayView currentDate={currentDate} events={filteredEvents} onEventClick={setSelectedEvent} onEventDrop={handleEventDrop} canEdit={canEdit} />}
          {view === 'list' && <ListView events={filteredEvents} onEventClick={setSelectedEvent} />}
        </div>

        <Dialog isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Synchroniseer Kalender">
          {renderSyncModalContent()}
        </Dialog>

        {canEdit && (
          <Dialog isOpen={isNewEventFormOpen || !!eventToEdit} onClose={handleCloseForm} title={eventToEdit ? 'Evenement Bewerken' : 'Nieuw Evenement'}>
              <EventForm 
                  onSave={handleSaveEvent} 
                  onCancel={handleCloseForm} 
                  event={eventToEdit}
              />
          </Dialog>
        )}

        {selectedEvent && (
          <EventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    </>
  );
};