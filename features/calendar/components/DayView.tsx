
import React, { useMemo, useState } from 'react';
import { EventItem } from './EventItem';
import type { Event } from '../../../types';

interface DayViewProps {
    currentDate: Date;
    events: Event[];
    onEventClick: (event: Event) => void;
    onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
    canEdit: boolean;
}

export const DayView: React.FC<DayViewProps> = ({ currentDate, events, onEventClick, onEventDrop, canEdit }) => {
  const [dragPlaceholder, setDragPlaceholder] = useState<{top: number, height: number} | null>(null);
  const [dragState, setDragState] = useState<{ draggingId: string | null; droppedId: string | null }>({ draggingId: null, droppedId: null });

  
  const eventsForDay = useMemo(() => {
    return events.filter(event => event.start.toDateString() === currentDate.toDateString());
  }, [events, currentDate]);

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
    
    if (!dragPlaceholder || dragPlaceholder.top !== top) {
        setDragPlaceholder({top, height});
    }
  }
  
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
    
    const newStart = new Date(currentDate);
    newStart.setHours(hour, minute, 0, 0);

    const newEnd = new Date(newStart.getTime() + eventDuration);
    
    onEventDrop(eventId, newStart, newEnd);
    setDragState({ draggingId: null, droppedId: eventId });
    setTimeout(() => setDragState(prev => ({...prev, droppedId: null })), 300);
    setDragPlaceholder(null);
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[auto,1fr] min-w-[800px]" onDragLeave={handleDragLeave}>
        {/* Time Gutter */}
        <div className="row-span-24 border-r border-border">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="h-16 text-right pr-2 text-xs text-muted-foreground pt-1 border-b border-border">
              {i > 0 && `${i.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div 
          className="relative"
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
          {eventsForDay.map(event => (
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
          {dragPlaceholder && (
              <div 
                  className="absolute left-2 right-2 bg-primary/20 rounded-lg border-2 border-dashed border-primary z-20 pointer-events-none transition-all duration-150"
                  style={{ top: `${dragPlaceholder.top}px`, height: `${dragPlaceholder.height}px` }}
              />
          )}
        </div>
      </div>
    </div>
  );
};
