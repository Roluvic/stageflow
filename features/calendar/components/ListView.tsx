import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../../App';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MapPin, Search, ArrowUpDown, List, Map, Info } from 'lucide-react';
import type { Venue, Event } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { MapView } from '../../../components/ui/MapView';

const EventsList: React.FC<{ events: Event[], venues: Venue[], onEventClick: (event: Event) => void }> = ({ events, venues, onEventClick }) => {
    return (
        <div className="space-y-3">
            {events.map(event => {
                const venue = venues.find(v => v.id === event.venueId);
                return (
                    <Card key={event.id} className="rounded-xl cursor-pointer hover:bg-accent transition-colors overflow-hidden" onClick={() => onEventClick(event)}>
                        <CardContent className="p-4 grid grid-cols-[1fr_auto] items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{event.title}</p>
                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {venue?.name}</p>
                                <div className="mt-2">
                                    <div className="inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-md">
                                        {event.start.toLocaleString('nl-BE', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}).replace(',', '')}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick(event);
                                }}
                                className="flex-shrink-0 h-10 w-10 rounded-full"
                                aria-label="Bekijk event details"
                            >
                                <Info className="h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
             {events.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <p>Geen events gevonden.</p>
                    <p className="text-sm">Pas je zoekterm of filters aan.</p>
                </div>
            )}
        </div>
    )
}

export const ListView: React.FC<{ events: Event[]; onEventClick: (event: Event) => void; showMap?: boolean; }> = ({ events: passedEvents, onEventClick, showMap = true }) => {
  const { venues } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'name', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const handleSort = (key: typeof sortConfig.key) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedEvents = useMemo(() => {
    let sortedEvents = [...passedEvents];
    if (sortConfig.key === 'date') {
        sortedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    } else if (sortConfig.key === 'name') {
        sortedEvents.sort((a, b) => a.title.localeCompare(b.title));
    }

    if(sortConfig.direction === 'desc') {
        sortedEvents.reverse();
    }

    if (!searchTerm) return sortedEvents;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return sortedEvents.filter(event => {
        const venue = venues.find(v => v.id === event.venueId);
        return (
            event.title.toLowerCase().includes(lowerCaseSearch) ||
            (venue && venue.name.toLowerCase().includes(lowerCaseSearch))
        );
    });
  }, [passedEvents, venues, searchTerm, sortConfig]);

  const eventsWithCoords = useMemo(() => filteredAndSortedEvents
    .map(event => {
        const venue = venues.find(v => v.id === event.venueId);
        return {
            ...event,
            name: event.title,
            lat: venue?.lat,
            lng: venue?.lng
        };
    })
    .filter(event => event.lat && event.lng), [filteredAndSortedEvents, venues]);


  return (
    <div className="pt-2 md:pt-6">
        {/* Mobile View Switcher */}
        <div className="lg:hidden flex items-center p-1 bg-muted rounded-lg mb-4">
            <Button
                variant={mobileView === 'list' ? 'secondary' : 'ghost'}
                onClick={() => setMobileView('list')}
                className="w-1/2 flex items-center gap-2"
                size="sm"
            >
                <List className="h-4 w-4" /> Lijst
            </Button>
            <Button
                variant={mobileView === 'map' ? 'secondary' : 'ghost'}
                onClick={() => setMobileView('map')}
                className="w-1/2 flex items-center gap-2"
                size="sm"
            >
                <Map className="h-4 w-4" /> Kaart
            </Button>
        </div>
        
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            {/* List Column */}
            <div className={mobileView === 'map' ? 'hidden lg:block' : ''}>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Zoeken..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => handleSort('date')} className="gap-1">
                            Datum {sortConfig.key === 'date' && <ArrowUpDown className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" onClick={() => handleSort('name')} className="gap-1">
                            Naam {sortConfig.key === 'name' && <ArrowUpDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-4 lg:max-h-[calc(100vh-250px)] lg:overflow-y-auto lg:pr-2 print:max-h-none print:overflow-visible">
                    <EventsList events={filteredAndSortedEvents} venues={venues} onEventClick={onEventClick} />
                </div>
            </div>

            {/* Map Column */}
            {showMap && (
                <div className={`h-96 lg:h-[calc(100vh-250px)] rounded-lg overflow-hidden print:hidden ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
                    <MapView items={eventsWithCoords.map(e => ({ name: e.title, lat: e.lat, lng: e.lng }))} className="h-full" />
                </div>
            )}
        </div>
    </div>
  );
};