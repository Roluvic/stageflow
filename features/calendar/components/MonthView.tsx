

import React, { useMemo, useContext, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { Event } from '../../../types';

interface MonthViewProps {
    currentDate: Date;
    events: Event[];
    onEventClick: (event: Event) => void;
    onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
    canEdit: boolean;
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, events, onEventClick, onEventDrop, canEdit }) => {
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [droppedEventId, setDroppedEventId] = useState<string | null>(null);
  const daysOfWeek = ['Ma', 'Di', 'Woe', 'Do', 'Vr', 'Za', 'Zo'];

  const startOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
  const endOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), [currentDate]);

  const calendarDays = useMemo(() => {
    const days = [];
    let startDay = startOfMonth.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < startDay; i++) {
      const date = new Date(startOfMonth);
      date.setDate(date.getDate() - (startDay - i));
      days.push({ date, isCurrentMonth: false });
    }

    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      const date = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), i);
      days.push({ date, isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(endOfMonth);
      date.setDate(date.getDate() + i);
      days.push({ date, isCurrentMonth: false });
    }
    return days.slice(0, 42);
  }, [startOfMonth, endOfMonth]);
  
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(event => {
      const key = event.start.toISOString().split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  const badgeColor = {
    show: 'bg-red-500 text-white border-transparent hover:bg-red-600',
    rehearsal: 'bg-blue-500 text-white border-transparent hover:bg-blue-600',
    meeting: 'bg-green-500 text-white border-transparent hover:bg-green-600',
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, event: Event) => {
    if (!canEdit) return;
    e.dataTransfer.setData("eventId", event.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
        setDraggingEventId(event.id);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: Date) => {
    if (!canEdit) return;
    e.preventDefault();
    if (dragOverDate?.getTime() !== date.getTime()) {
      setDragOverDate(date);
    }
  };
  
  const handleDragEnd = () => {
      setDraggingEventId(null);
      setDragOverDate(null);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newDate: Date) => {
    if (!canEdit) return;
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    if (!eventId) return;

    const originalEvent = events.find(ev => ev.id === eventId);
    if (!originalEvent) return;

    const duration = originalEvent.end.getTime() - originalEvent.start.getTime();
    
    const newStart = new Date(newDate);
    newStart.setHours(originalEvent.start.getHours());
    newStart.setMinutes(originalEvent.start.getMinutes());
    newStart.setSeconds(originalEvent.start.getSeconds());
    newStart.setMilliseconds(originalEvent.start.getMilliseconds());
    
    const newEnd = new Date(newStart.getTime() + duration);

    if (originalEvent.start.toDateString() !== newDate.toDateString()) {
      onEventDrop(eventId, newStart, newEnd);
      setDroppedEventId(eventId);
      setTimeout(() => setDroppedEventId(null), 300); // Corresponds to animation duration
    }
    handleDragEnd();
  };


  return (
    <div className="grid grid-cols-7 grid-rows-6 gap-2 h-full" onDragLeave={() => setDragOverDate(null)}>
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-medium text-muted-foreground">{day}</div>
        ))}
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const dayKey = date.toISOString().split('T')[0];
          const dayEvents = (eventsByDate.get(dayKey) || []).sort((a, b) => a.start.getTime() - b.start.getTime());
          const isToday = new Date().toDateString() === date.toDateString();
          const isDragOver = dragOverDate && dragOverDate.toDateString() === date.toDateString();

          return (
            <div 
              key={index} 
              className={`p-2 border border-border rounded-lg flex flex-col transition-colors duration-150 ${isCurrentMonth ? 'bg-card' : 'bg-muted/50'} ${isDragOver && canEdit ? 'bg-primary/10' : ''}`}
              onDragOver={(e) => handleDragOver(e, date)}
              onDrop={(e) => handleDrop(e, date)}
            >
              <span className={`font-semibold text-right ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'} ${isToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {dayEvents.map(event => {
                    const isConflict = event.tags?.includes('conflict');
                    const isCanceled = event.status === 'canceled';
                    const isDragging = draggingEventId === event.id;
                    const isDropped = droppedEventId === event.id;
                    return (
                        <div 
                          key={event.id} 
                          onClick={() => onEventClick(event)} 
                          className={`transition-all duration-200 ${canEdit ? 'cursor-pointer' : 'cursor-default'} ${isDragging ? 'opacity-30 scale-95' : 'opacity-100 scale-100'} ${isDropped ? 'animate-drop-in' : ''}`}
                          draggable={canEdit && !isCanceled}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onDragEnd={handleDragEnd}
                        >
                            <Badge
                                className={`${isCanceled ? 'bg-gray-200 text-gray-500 border-gray-300' : badgeColor[event.type]} ${isConflict ? 'ring-2 ring-offset-background ring-destructive' : ''} block w-full text-left font-normal flex items-center gap-1.5 ${isCanceled ? 'line-through' : ''}`}
                            >
                                {isConflict && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                                <span className="truncate">
                                    {new Intl.DateTimeFormat('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' }).format(event.start)} {event.title}
                                </span>
                            </Badge>
                        </div>
                    )
                })}
              </div>
            </div>
          );
        })}
      </div>
  );
};
