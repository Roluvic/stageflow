
import React, { useMemo, useState } from 'react';
import { EventItem } from './EventItem';
import type { Event } from '../../../types';

interface WeekViewProps {
    currentDate: Date;
    events: Event[];
    onEventClick: (event: Event) => void;
    onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
    canEdit: boolean;
}

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onEventClick, onEventDrop, canEdit }) => {
  const daysOfWeek = ['Ma', 'Di', 'Woe', 'Do', 'Vr', 'Za', 'Zo'];
  const [dragPlaceholder, setDragPlaceholder] = useState<{top: number, height: number, day: string} | null>(null);
  const [dragState, setDragState] = useState<{ draggingId: string | null; droppedId: string | null }>({ draggingId: null, droppedId: null });

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const eventsForWeek = useMemo(() => {
    const firstDay = weekDates[0];
    firstDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(weekDates[6]);
    lastDay.setHours(23, 59, 59, 999);
    return events.filter(event => event.start >= firstDay && event.start <= lastDay);
  }, [events, weekDates]);

  const handleItemDragEnd = () => {
    setDragState(prev => ({...prev, draggingId: null }));
    setDragPlaceholder(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    const eventDuration = Number(e.dataTransfer.getData("eventDuration"));
    if (!eventDuration) return;

    const dayColumn = e.currentTarget;
    const rect = dayColumn.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Snap to 15-min grid
    const totalMinutes = (y / 64) * 60; // 64px per hour
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const top = (snappedMinutes / 60) * 64;

    const height = (eventDuration / (1000 * 60)) / 60 * 64;
    const dateStr = dayColumn.getAttribute('data-date-col')!;

    if (!dragPlaceholder || dragPlaceholder.top !== top || dragPlaceholder.day !== dateStr) {
        setDragPlaceholder({top, height, day: dateStr});
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragPlaceholder(null);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    const eventDuration = Number(e.dataTransfer.getData("eventDuration"));
    if (!eventId) {
        handleItemDragEnd();
        return;
    }

    const dayColumn = e.currentTarget;
    const rect = dayColumn.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Calculate precise time and snap to 15 minutes
    const totalMinutes = (y / 64) * 60;
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const hour = Math.floor(snappedMinutes / 60);
    const minute = snappedMinutes % 60;
    
    const dateStr = dayColumn.getAttribute('data-date-col')!;
    const newStart = new Date(dateStr + 'T00:00:00'); // Parse as local midnight
    newStart.setHours(hour, minute);

    const newEnd = new Date(newStart.getTime() + eventDuration);
    
    onEventDrop(eventId, newStart, newEnd);
    setDragState({ draggingId: null, droppedId: eventId });
    setTimeout(() => setDragState(prev => ({...prev, droppedId: null })), 300);
    setDragPlaceholder(null);
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr,1fr] min-w-[1200px]" onDragLeave={handleDragLeave}>
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b border-r border-border"></div>
        {weekDates.map((date, i) => (
          <div key={i} className="text-center p-2 border-b border-border sticky top-0 bg-background z-10">
            <p className="font-medium text-muted-foreground">{daysOfWeek[i]}</p>
            <p className={`text-2xl font-bold ${new Date().toDateString() === date.toDateString() ? 'text-primary' : ''}`}>{date.getDate()}</p>
          </div>
        ))}
        
        {/* Time Gutter */}
        <div className="row-span-24 border-r border-border">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="h-16 text-right pr-2 text-xs text-muted-foreground pt-1 border-b border-border">
              {i > 0 && `${i.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weekDates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          return (
            <div 
              key={date.toISOString()}
              className="relative"
              data-date-col={dateStr}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {Array.from({ length: 24 * 2 }, (_, i) => ( // 30-min slots for visuals
                <div 
                  key={i}
                  className="h-8 border-b border-border"
                />
              ))}
              {/* Events */}
              {eventsForWeek.filter(event => event.start.toDateString() === date.toDateString()).map(event => (
                <EventItem 
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  canDrag={canEdit}
                  isDragging={dragState.draggingId === event.id}
                  isDropped={dragState.droppedId === event.id}
                  onItemDragStart={(id) => setDragState(prev => ({...prev, draggingId: id}))}
                  onItemDragEnd={handleItemDragEnd}
                />
              ))}
              {/* Placeholder */}
              {dragPlaceholder && dragPlaceholder.day === dateStr && (
                <div 
                    className="absolute left-2 right-2 bg-primary/20 rounded-lg border-2 border-dashed border-primary z-20 pointer-events-none transition-all duration-150"
                    style={{ top: `${dragPlaceholder.top}px`, height: `${dragPlaceholder.height}px` }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};
