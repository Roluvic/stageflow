import React, { useContext } from 'react';
import type { CalendarViewType } from '../CalendarView';
import type { Event } from '../../../types';
import { AppContext } from '../../../App';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { ListView } from './ListView';

interface PrintableCalendarProps {
    events: Event[];
    currentDate: Date;
    view: CalendarViewType;
}

export const PrintableCalendar: React.FC<PrintableCalendarProps> = ({ events, currentDate, view }) => {
    const { currentBand } = useContext(AppContext);

    const title = new Intl.DateTimeFormat('nl-BE', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Brussels'
    }).format(currentDate);

    const renderView = () => {
        const noOp = () => {};
        switch(view) {
            case 'month':
                return <MonthView currentDate={currentDate} events={events} onEventClick={noOp} onEventDrop={noOp} canEdit={false} />;
            case 'week':
                return <WeekView currentDate={currentDate} events={events} onEventClick={noOp} onEventDrop={noOp} canEdit={false} />;
            case 'list':
            default:
                return <ListView events={events} onEventClick={noOp} showMap={false} />;
        }
    };

    return (
        <div className="bg-white text-black p-4 font-sans">
            <header className="text-center mb-6">
                {currentBand?.logoUrl && <img src={currentBand.logoUrl} alt={`${currentBand.name} Logo`} className="h-20 mx-auto mb-4 object-contain" />}
                <h1 className="text-3xl font-bold" style={{ color: currentBand?.themeColor }}>{currentBand?.name || 'Kalender'}</h1>
                <h2 className="text-xl text-gray-700">{title}</h2>
            </header>
            <main>
                {renderView()}
            </main>
        </div>
    );
};