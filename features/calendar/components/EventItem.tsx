
import React from 'react';
import type { Event } from '../../../types';
import { AlertCircle } from 'lucide-react';

interface EventItemProps {
  event: Event;
  onClick: (event: Event) => void;
  canDrag: boolean;
  isDragging: boolean;
  isDropped: boolean;
  onItemDragStart: (id: string) => void;
  onItemDragEnd: () => void;
}

export const EventItem: React.FC<EventItemProps> = ({ event, onClick, canDrag, isDragging, isDropped, onItemDragStart, onItemDragEnd }) => {
  const startHour = event.start.getHours();
  const startMinute = event.start.getMinutes();
  
  const durationInMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
  const top = (startHour * 60 + startMinute) / 60 * 64; // 64px per hour
  const height = durationInMinutes / 60 * 64;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canDrag) return;
    const durationInMs = event.end.getTime() - event.start.getTime();
    e.dataTransfer.setData("eventId", event.id);
    e.dataTransfer.setData("eventDuration", String(durationInMs));
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => onItemDragStart(event.id), 0);
  }

  const handleDragEnd = () => {
    onItemDragEnd();
  }

  const badgeColor = {
    show: 'bg-red-500/80 border-red-700 text-white',
    rehearsal: 'bg-blue-500/80 border-blue-700 text-white',
    meeting: 'bg-green-500/80 border-green-700 text-white',
  };

  const isConflict = event.tags?.includes('conflict');
  const isCanceled = event.status === 'canceled';
  const formatDate = (date: Date) => new Intl.DateTimeFormat('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' }).format(date);

  return (
    <div
      draggable={canDrag && !isCanceled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(event)}
      className={`absolute left-2 right-2 p-2 rounded-lg border transition-all duration-200 ease-in-out ${isCanceled ? 'bg-gray-300/80 border-gray-500 text-gray-600 line-through' : badgeColor[event.type]} ${canDrag && !isCanceled ? 'cursor-pointer' : 'cursor-default'} ${isConflict ? 'ring-2 ring-destructive' : ''} ${isDragging ? 'shadow-2xl scale-[1.03] z-20' : 'shadow-md'} ${isDropped ? 'animate-drop-in' : ''}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '32px' }}
      title={`${event.title}\n${formatDate(event.start)} - ${formatDate(event.end)}`}
    >
        <p className="font-bold text-sm truncate">{event.title}</p>
        <p className="text-xs opacity-80">{formatDate(event.start)} - {formatDate(event.end)}</p>
        {isConflict && <AlertCircle className="absolute top-1 right-1 h-4 w-4 text-white" />}
    </div>
  );
};
