import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Share2, Printer, Filter, CheckSquare, Square, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { CalendarViewType } from '../CalendarView';
import { Popover } from '../../../components/ui/Popover';
import type { EventStatus } from '../../../types';

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarViewType;
  setView: (view: CalendarViewType) => void;
  onSync: () => void;
  onPrint: (view: CalendarViewType) => void;
  statusFilters: EventStatus[];
  setStatusFilters: (filters: EventStatus[]) => void;
  onAddEvent: () => void;
  canEdit: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ currentDate, setCurrentDate, view, setView, onSync, onPrint, statusFilters, setStatusFilters, onAddEvent, canEdit }) => {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isPrintPopoverOpen, setIsPrintPopoverOpen] = useState(false);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(currentDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(currentDate.getDate() - 7);
    else newDate.setMonth(currentDate.getMonth() - 1); // For month and list view
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(currentDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(currentDate.getDate() + 7);
    else newDate.setMonth(currentDate.getMonth() + 1); // For month and list view
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  }

  const getTitle = () => {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Brussels' };
    if (view === 'day') {
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      return new Intl.DateTimeFormat('nl-BE', options).format(currentDate);
    }
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() -1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startMonth = startOfWeek.toLocaleString('nl-BE', { month: 'short' });
      const endMonth = endOfWeek.toLocaleString('nl-BE', { month: 'short' });
      
      if (startMonth === endMonth) {
          return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleString('nl-BE', { month: 'long', year: 'numeric' })}`;
      }
      return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth} ${endOfWeek.getFullYear()}`;
    }
    // For month and list view
    options.month = 'long';
    options.year = 'numeric';
    return new Intl.DateTimeFormat('nl-BE', options).format(currentDate);
  };

  const statusOptions: { value: EventStatus; label: string }[] = [
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'draft', label: 'Optie' },
    { value: 'canceled', label: 'Geannuleerd' },
  ];

  const handleFilterChange = (status: EventStatus) => {
    setStatusFilters(
      statusFilters.includes(status)
        ? statusFilters.filter(s => s !== status)
        : [...statusFilters, status]
    );
  };

  const areFiltersActive = statusFilters.length < statusOptions.length;

  const filterContent = (
    <div className="p-2 w-48">
      <p className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Filter op status</p>
      <div className="space-y-1">
        {statusOptions.map(option => (
          <Button
            key={option.value}
            variant="ghost"
            className="w-full justify-start gap-2 px-2"
            onClick={() => handleFilterChange(option.value)}
          >
            {statusFilters.includes(option.value)
              ? <CheckSquare className="h-4 w-4 text-primary" />
              : <Square className="h-4 w-4 text-muted-foreground" />}
            <span className="font-normal">{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  const handlePrintClick = (printView: CalendarViewType) => {
    onPrint(printView);
    setIsPrintPopoverOpen(false);
  };

  const printContent = (
    <div className="p-2 w-48">
        <p className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Print Kalender</p>
        <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => handlePrintClick('month')}>Maandoverzicht</Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handlePrintClick('week')}>Weekoverzicht</Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => handlePrintClick('list')}>Lijstweergave</Button>
        </div>
    </div>
  );

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 print:hidden">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Kalender</h1>
        {view !== 'list' && <Button variant="outline" size="sm" onClick={handleToday}>Vandaag</Button>}
      </div>
      {view !== 'list' && (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-base md:text-lg font-semibold w-40 sm:w-64 text-center">{getTitle()}</span>
          <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
      <div className="w-full md:w-auto flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2">
        <div className="flex items-center border border-input rounded-md p-0.5 self-start md:self-center">
          {(['month', 'week', 'day', 'list'] as CalendarViewType[]).map(v => (
            <Button
              key={v}
              variant={view === v ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView(v)}
              className="capitalize"
            >
              {v === 'day' ? 'Dag' : v === 'week' ? 'Week' : v === 'month' ? 'Maand' : 'Lijst'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
            <Popover
              isOpen={isFilterPopoverOpen}
              setIsOpen={setIsFilterPopoverOpen}
              trigger={
                <Button variant={areFiltersActive ? 'secondary' : 'outline'} size="sm" className="gap-2">
                  <Filter className="h-4 w-4"/>
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              }
              content={filterContent}
            />
            <Button variant="outline" size="sm" className="gap-2" onClick={onSync}>
              <Share2 className="h-4 w-4"/>
               <span className="hidden sm:inline">Sync</span>
            </Button>
            <Popover
              isOpen={isPrintPopoverOpen}
              setIsOpen={setIsPrintPopoverOpen}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                    <Printer className="h-4 w-4"/>
                    <span className="hidden sm:inline">Print</span>
                </Button>
              }
              content={printContent}
            />
        </div>
        {canEdit && (
            <Button size="sm" className="gap-2" onClick={onAddEvent}>
                <Plus className="h-4 w-4" />
                Nieuw Event
            </Button>
        )}
      </div>
    </header>
  );
};
