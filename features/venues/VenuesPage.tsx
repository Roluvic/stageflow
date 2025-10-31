

import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, MapPin, Edit, Trash2, Calendar, Search, Loader2, ArrowUpDown } from 'lucide-react';
import type { Venue, Event } from '../../types';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { useVisibleEvents } from '../../hooks/use-visible-events';
import { MapView } from '../../components/ui/MapView';
import { EventDetailModal } from '../calendar/components/EventDetailModal';
import { EventForm } from '../calendar/components/EventForm';

// Mock Google Maps API search to simulate fetching address suggestions.
const mockGoogleMapsSearch = async (query: string): Promise<Array<{ address: string; lat: number; lng: number }>> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    // Hardcoded plausible results for demonstration
    const results = [
        { address: 'Grote Markt, 2000 Antwerpen, België', lat: 51.221, lng: 4.401 },
        { address: 'AFAS Live, Johan Cruijff Boulevard 590, 1101 Amsterdam, Nederland', lat: 52.313, lng: 4.939 },
        { address: 'Sportpaleis, Schijnpoortweg 119, 2170 Antwerpen, België', lat: 51.230, lng: 4.441 },
        { address: 'Vorst Nationaal, Victor Rousseaulaan 208, 1190 Vorst, België', lat: 50.814, lng: 4.316 },
        { address: 'Ancienne Belgique, Anspachlaan 110, 1000 Brussel, België', lat: 50.848, lng: 4.347 },
        { address: 'Lotto Arena, Schijnpoortweg 119, 2170 Antwerpen, België', lat: 51.229, lng: 4.440 },
        { address: 'Trix, Noordersingel 28-30, 2140 Antwerpen, België', lat: 51.218, lng: 4.441 },
    ];
    return results.filter(r => r.address.toLowerCase().includes(lowerQuery));
};


const VenueForm: React.FC<{ venue?: Venue | null, onSave: (venue: Omit<Venue, 'id' | 'bandId'> | Venue) => void, onCancel: () => void }> = ({ venue, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', address: '' });
    const [mapCenter, setMapCenter] = useState<({ lat?: number, lng?: number, name: string}) | null>(null);
    const [addressSearch, setAddressSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (venue) {
            setFormData({ name: venue.name, address: venue.address });
            setMapCenter({ lat: venue.lat, lng: venue.lng, name: venue.name });
            setAddressSearch(venue.address);
        } else {
            setFormData({ name: '', address: '' });
            setMapCenter(null);
            setAddressSearch('');
        }
    }, [venue]);

     useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddressChange = (value: string) => {
        setAddressSearch(value);
        setIsDropdownOpen(true);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length > 2) {
            setIsSearching(true);
            searchTimeoutRef.current = window.setTimeout(async () => {
                const suggestions = await mockGoogleMapsSearch(value);
                setAutocompleteSuggestions(suggestions);
                setIsSearching(false);
            }, 500); // Debounce
        } else {
            setAutocompleteSuggestions([]);
            setIsSearching(false);
        }
    };
    
    const handleSelectSuggestion = (suggestion: { address: string; lat: number; lng: number }) => {
        setFormData(prev => ({ ...prev, address: suggestion.address }));
        setAddressSearch(suggestion.address);
        setMapCenter({ lat: suggestion.lat, lng: suggestion.lng, name: formData.name || 'Nieuwe locatie' });
        setIsDropdownOpen(false);
        setAutocompleteSuggestions([]);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { 
            name: formData.name, 
            address: addressSearch, 
            lat: mapCenter?.lat, 
            lng: mapCenter?.lng 
        };
        if (venue) {
            onSave({ ...venue, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Naam Locatie</label>
                <Input id="name" name="name" value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} required />
            </div>
            <div ref={dropdownRef}>
                <label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-1">Adres</label>
                <div className="relative">
                     <Input id="address" name="address" value={addressSearch} onChange={(e) => handleAddressChange(e.target.value)} onFocus={() => setIsDropdownOpen(true)} required className="pl-10" placeholder="Zoek adres..."/>
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     {isDropdownOpen && (
                         <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                             {isSearching && <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Zoeken...</div>}
                             {!isSearching && autocompleteSuggestions.length > 0 && autocompleteSuggestions.map(s => (
                                 <div key={s.address} className="p-3 hover:bg-accent cursor-pointer" onClick={() => handleSelectSuggestion(s)}>
                                     {s.address}
                                 </div>
                             ))}
                             {!isSearching && autocompleteSuggestions.length === 0 && addressSearch.length > 2 && (
                                <div className="p-3 text-sm text-muted-foreground">Geen resultaten</div>
                             )}
                         </div>
                     )}
                </div>
            </div>
            <MapView items={mapCenter ? [mapCenter] : []} className="h-48" />
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Opslaan</Button>
            </div>
        </form>
    );
};


const EventsList: React.FC<{ events: Event[], venues: Venue[], onEventClick: (event: Event) => void }> = ({ events, venues, onEventClick }) => {
    return (
        <div className="space-y-2">
            {events.map(event => {
                const venue = venues.find(v => v.id === event.venueId);
                return (
                    <Card key={event.id} className="rounded-xl cursor-pointer hover:bg-accent transition-colors" onClick={() => onEventClick(event)}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold">{event.title}</p>
                                    <p className="text-sm text-muted-foreground">{venue?.name}</p>
                                </div>
                                {venue && (
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 px-3 py-1 -mr-1 -mt-1 rounded-full text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                        title="Navigeer in Google Maps"
                                    >
                                        <MapPin className="h-4 w-4" /> Route
                                    </a>
                                )}
                            </div>
                            <p className="text-sm font-mono text-primary mt-1">{event.start.toLocaleString('nl-BE', {dateStyle: 'medium', timeStyle: 'short'})}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    )
}

export const VenuesPage: React.FC = () => {
  const { venues, addVenue, updateVenue, deleteVenue, currentUser, addEvent } = useContext(AppContext);
  const events = useVisibleEvents();
  const [activeTab, setActiveTab] = useState<'events' | 'venues'>('events');
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isNewEventFormOpen, setIsNewEventFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'name' | 'venueName', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const canEdit = currentUser && ['owner', 'manager'].includes(currentUser.role);

  const handleOpenVenueModal = (venue?: Venue) => {
    if (!canEdit) return;
    setEditingVenue(venue || null);
    setIsVenueModalOpen(true);
  };

  const handleCloseVenueModal = () => {
    setEditingVenue(null);
    setIsVenueModalOpen(false);
  };

  const handleSaveVenue = (venueData: Omit<Venue, 'id' | 'bandId'> | Venue) => {
    if ('id' in venueData) {
        updateVenue(venueData);
    } else {
        addVenue(venueData);
    }
    handleCloseVenueModal();
  };

  const handleSaveEvent = (eventData: Omit<Event, 'id' | 'bandId'> | Event) => {
    if (!('id' in eventData)) {
      addEvent(eventData);
    }
    setIsNewEventFormOpen(false);
  };
  
  const handleDelete = (venueId: string) => {
    if (window.confirm("Weet je zeker dat je deze locatie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
        deleteVenue(venueId);
    }
  };

  const handleSort = (key: typeof sortConfig.key) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedEvents = useMemo(() => {
    let sortedEvents = [...events];
    if (sortConfig.key === 'date') {
        sortedEvents.sort((a, b) => {
            const comparison = a.start.getTime() - b.start.getTime();
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    } else if (sortConfig.key === 'name') {
        sortedEvents.sort((a, b) => {
            const comparison = a.title.localeCompare(b.title);
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
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
  }, [events, venues, searchTerm, sortConfig]);
  
  const filteredAndSortedVenues = useMemo(() => {
      let sortedVenues = [...venues].sort((a,b) => a.name.localeCompare(b.name));
      if (!searchTerm) return sortedVenues;
      const lowerCaseSearch = searchTerm.toLowerCase();
      return sortedVenues.filter(v => v.name.toLowerCase().includes(lowerCaseSearch) || v.address.toLowerCase().includes(lowerCaseSearch));
  }, [venues, searchTerm]);

  const eventsWithCoords = events
    .map(event => {
        const venue = venues.find(v => v.id === event.venueId);
        return {
            ...event,
            name: event.title,
            lat: venue?.lat,
            lng: venue?.lng
        };
    })
    .filter(event => event.lat && event.lng);


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events & Locaties</h1>
          <p className="text-muted-foreground">Beheer alle events en locaties.</p>
        </div>
        {canEdit && (
            <Button className="gap-2" onClick={() => activeTab === 'venues' ? handleOpenVenueModal() : setIsNewEventFormOpen(true)}>
                <Plus className="h-5 w-5" />
                {activeTab === 'venues' ? 'Nieuwe Locatie' : 'Nieuw Event'}
            </Button>
        )}
      </div>

      <div>
        <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => { setActiveTab('events'); setSearchTerm(''); setSortConfig({key: 'date', direction: 'desc'})}}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'events' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                >
                    <Calendar className="inline h-5 w-5 mr-2" /> Events ({events.length})
                </button>
                 <button
                    onClick={() => { setActiveTab('venues'); setSearchTerm(''); setSortConfig({key: 'name', direction: 'asc'})}}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'venues' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                >
                   <MapPin className="inline h-5 w-5 mr-2" /> Locaties ({venues.length})
                </button>
            </nav>
        </div>

        <div className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Zoeken..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {activeTab === 'events' && (
                            <div className="flex items-center">
                                <Button variant="ghost" onClick={() => handleSort('date')} className="gap-1">
                                    Datum {sortConfig.key === 'date' && <ArrowUpDown className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" onClick={() => handleSort('name')} className="gap-1">
                                    Naam {sortConfig.key === 'name' && <ArrowUpDown className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 max-h-[calc(65vh-60px)] overflow-y-auto pr-2">
                        {activeTab === 'events' && <EventsList events={filteredAndSortedEvents} venues={venues} onEventClick={setSelectedEvent} />}
                        {activeTab === 'venues' && (
                             <div className="space-y-2">
                                {filteredAndSortedVenues.map(venue => (
                                    <Card key={venue.id} className={`rounded-xl group ${canEdit ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`} onClick={() => handleOpenVenueModal(venue)}>
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold">{venue.name}</p>
                                                <p className="text-sm text-muted-foreground">{venue.address}</p>
                                            </div>
                                            {canEdit && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); handleOpenVenueModal(venue); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); handleDelete(venue.id); }}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-[calc(65vh-60px)]">
                  <MapView items={activeTab === 'events' ? eventsWithCoords.map(e => ({ name: e.title, lat: e.lat, lng: e.lng })) : venues} className="h-full" />
                </div>
            </div>
        </div>
      </div>


      {canEdit && (
        <>
            <Dialog isOpen={isVenueModalOpen} onClose={handleCloseVenueModal} title={editingVenue ? 'Locatie Bewerken' : 'Nieuwe Locatie Toevoegen'}>
                <VenueForm venue={editingVenue} onSave={handleSaveVenue} onCancel={handleCloseVenueModal} />
            </Dialog>
            
            <Dialog isOpen={isNewEventFormOpen} onClose={() => setIsNewEventFormOpen(false)} title="Nieuw Evenement">
                <EventForm
                    onSave={handleSaveEvent}
                    onCancel={() => setIsNewEventFormOpen(false)}
                />
            </Dialog>
        </>
      )}

      {selectedEvent && (
        <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
