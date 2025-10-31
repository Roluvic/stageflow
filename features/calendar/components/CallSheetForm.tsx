import React, { useState, useContext, useRef, useEffect } from 'react';
import type { Event, CallSheet, CallSheetTimingItem, CallSheetTravelPartyItem, CallSheetContactItem, CallSheetLineupItem, User, Document, Venue } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Clock, Users, ListMusic, Trash2, Plus, FileText, Sparkles, Loader2, UserSearch, X, Link as LinkIcon, Search } from 'lucide-react';
import { Popover } from '../../../components/ui/Popover';
import { getAiTimingResponse, getAiEventDetailsFromSearch } from '../../../services/geminiService';
import { AppContext } from '../../../App';

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
        { address: 'Varode 21, 3980 Tessenderlo-Ham', lat: 51.068, lng: 5.088 },
    ];
    return results.filter(r => r.address.toLowerCase().includes(lowerQuery));
};


interface CallSheetFormProps {
    event: Event;
    onSave: (event: Event) => void;
    onCancel: () => void;
    users: User[];
    documents: Document[];
    events: Event[];
}

const FormSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="space-y-2 p-4 border border-border rounded-lg bg-secondary/50">
            {children}
        </div>
    </div>
);

const LabeledInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; required?: boolean; isTextArea?: boolean; }> = ({ label, isTextArea, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        {isTextArea ? <textarea {...props} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /> : <Input {...props} />}
    </div>
);

const AddressInput: React.FC<{ label: string, value: string, onValueChange: (value: string) => void, onSuggestionSelect?: (suggestion: { address: string, lat: number, lng: number }) => void }> = ({ label, value, onValueChange, onSuggestionSelect }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (newValue: string) => {
        onValueChange(newValue);
        setIsDropdownOpen(true);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (newValue.length > 2) {
            setIsSearching(true);
            searchTimeoutRef.current = window.setTimeout(async () => {
                setSuggestions(await mockGoogleMapsSearch(newValue));
                setIsSearching(false);
            }, 500);
        } else {
            setSuggestions([]);
            setIsSearching(false);
        }
    };

    const handleSelect = (suggestion: { address: string; lat: number; lng: number }) => {
        onValueChange(suggestion.address);
        if (onSuggestionSelect) onSuggestionSelect(suggestion);
        setIsDropdownOpen(false);
    }

    return (
        <div ref={dropdownRef}>
            <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
            <div className="relative">
                 <Input value={value} onChange={(e) => handleChange(e.target.value)} onFocus={() => setIsDropdownOpen(true)} required className="pl-10" placeholder="Zoek adres..."/>
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 {isDropdownOpen && (
                     <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                         {isSearching && <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Zoeken...</div>}
                         {!isSearching && suggestions.length > 0 && suggestions.map(s => (
                             <div key={s.address} className="p-3 hover:bg-accent cursor-pointer" onClick={() => handleSelect(s)}>
                                 {s.address}
                             </div>
                         ))}
                         {!isSearching && suggestions.length === 0 && value.length > 2 && (
                            <div className="p-3 text-sm text-muted-foreground">Geen resultaten</div>
                         )}
                     </div>
                 )}
            </div>
        </div>
    );
};


export const CallSheetForm: React.FC<CallSheetFormProps> = ({ event, onSave, onCancel, users, documents, events }) => {
    const { toast, venues, addVenue, updateVenue } = useContext(AppContext);
    const [formState, setFormState] = useState<Event>({
        ...event,
        callSheet: event.callSheet || {}, // Ensure callsheet object exists
    });
    const [venueAddress, setVenueAddress] = useState('');
    const [travelPartySearch, setTravelPartySearch] = useState('');
    const [isTravelPartyPopoverOpen, setIsTravelPartyPopoverOpen] = useState(false);
    const [isTourManagerPopoverOpen, setIsTourManagerPopoverOpen] = useState(false);
    const [tourManagerSearch, setTourManagerSearch] = useState('');
    const [isGeneratingTiming, setIsGeneratingTiming] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    
    useEffect(() => {
        const currentVenue = venues.find(v => v.id === formState.venueId);
        setVenueAddress(currentVenue?.address || '');
    }, [formState.venueId, venues]);

    const handleEventChange = (field: keyof Event, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleCallsheetChange = (field: keyof CallSheet, value: any) => {
        setFormState(prev => ({
            ...prev,
            callSheet: {
                ...(prev.callSheet || {}),
                [field]: value,
            }
        }));
    };

    const handleNestedCallsheetChange = (field: keyof CallSheet, subField: string, value: string) => {
         handleCallsheetChange(field, { ...(formState.callSheet?.[field] || {}), [subField]: value });
    };

    const handleListChange = <T extends { id: string },>(listName: keyof CallSheet, itemId: string, field: keyof T, value: string | number | undefined) => {
        const list = (formState.callSheet?.[listName] as T[] || []).slice();
        const itemIndex = list.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            (list[itemIndex] as any)[field] = value;
            handleCallsheetChange(listName, list);
        }
    };

    const addListItem = <T,>(listName: keyof CallSheet, newItem: Omit<T, 'id'>) => {
        const fullNewItem = { ...newItem, id: `${listName.toString()}-${Date.now()}` } as T;
        const list = [...(formState.callSheet?.[listName] as T[] || []), fullNewItem];
        handleCallsheetChange(listName, list);
    };

    const removeListItem = (listName: keyof CallSheet, itemId: string) => {
        const list = (formState.callSheet?.[listName] as any[] || []).filter((item) => item.id !== itemId);
        handleCallsheetChange(listName, list);
    };
    
    const handleSelectTravelPartyUser = (user: User) => {
        addListItem<CallSheetTravelPartyItem>('travelParty', {
            userId: user.id,
            name: user.name,
            role: user.role,
            contact: user.phone || '',
            callTime: '',
        });
        setTravelPartySearch('');
        setIsTravelPartyPopoverOpen(false);
    }
    
    const handleBillingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        const user = users.find(u => u.id === userId);
        if (user) {
            const billingString = [
                user.companyName,
                user.address,
                `${user.postalCode} ${user.city}`,
                user.country,
                user.vatNumber,
            ].filter(Boolean).join('\n');
            handleCallsheetChange('billingInfo', billingString);
        } else {
            handleCallsheetChange('billingInfo', '');
        }
    }

    const handleRiderToggle = (docId: string) => {
        const currentRiders = formState.callSheet?.technicalRiderIds || [];
        const newRiders = currentRiders.includes(docId)
            ? currentRiders.filter(id => id !== docId)
            : [...currentRiders, docId];
        handleCallsheetChange('technicalRiderIds', newRiders);
    }

    const handleGenerateTiming = async () => {
        setIsGeneratingTiming(true);
        const exampleTimings = events
            .filter(e => e.id !== event.id && e.callSheet?.timing && e.callSheet.timing.length > 0)
            .slice(0, 3)
            .map(e => e.callSheet!.timing!.map(({id, ...rest}) => rest));

        const generatedItems = await getAiTimingResponse({
            eventType: formState.type,
            title: formState.title,
            startTime: new Date(formState.start),
            endTime: new Date(formState.end),
        }, exampleTimings);

        if (generatedItems && Array.isArray(generatedItems)) {
            const newTiming = generatedItems.map((item: any, index: number) => ({
                ...item,
                id: `t-${Date.now()}-${index}`
            }));
            handleCallsheetChange('timing', newTiming);
            toast({ title: "Timing Gegenereerd", description: "Het tijdschema is succesvol aangemaakt."});
        } else {
            toast({ title: "Genereren Mislukt", description: "De AI kon geen passend tijdschema genereren.", variant: "destructive" });
        }
        setIsGeneratingTiming(false);
    };
    
    const handleFetchDetails = async () => {
        setIsFetchingDetails(true);
        const details = await getAiEventDetailsFromSearch(formState.title);

        if (details && !details.error) {
            let venueToUpdate: Venue | undefined = venues.find(v => v.id === formState.venueId);
            
            // Check if venue exists by name or address, if not, create it
            let existingVenue = venues.find(v => v.name.toLowerCase() === details.venueName?.toLowerCase());
            if (!existingVenue && details.venueAddress) {
                existingVenue = venues.find(v => v.address.toLowerCase() === details.venueAddress?.toLowerCase());
            }

            if (existingVenue) {
                handleEventChange('venueId', existingVenue.id);
            } else if (details.venueName && details.venueAddress) {
                const newVenue: Omit<Venue, 'id' | 'bandId'> = {
                    name: details.venueName,
                    address: details.venueAddress,
                    // lat/lng could be returned by a real maps API
                };
                addVenue(newVenue); // This is async but we don't have the new ID immediately. We'll rely on the user to re-select it if needed.
                toast({ title: "Nieuwe Locatie Aangemaakt", description: `"${details.venueName}" is toegevoegd aan locaties.` });
            }

            setFormState(prev => {
                const updates: Partial<Event> = {};
                const csUpdates: Partial<CallSheet> = {};
                if (details.startDate) updates.start = new Date(details.startDate);
                if (details.endDate) updates.end = new Date(details.endDate);
                if (details.lineup) csUpdates.lineup = details.lineup.map((item: any, index: number) => ({...item, id: `l-${Date.now()}-${index}`}));
                if (details.websiteUrl) csUpdates.eventWebsite = details.websiteUrl;
                
                return { ...prev, ...updates, callSheet: { ...prev.callSheet, ...csUpdates } }
            });

            toast({ title: "Gegevens Opgehaald", description: "De callsheet is bijgewerkt met online gevonden informatie."});
        } else {
            toast({ title: "Ophalen Mislukt", description: details.error || "Kon geen details online vinden.", variant: "destructive" });
        }
        setIsFetchingDetails(false);
    };
    
    const techRiders = documents.filter(d => d.type === 'tech-rider');
    
    const filteredTravelPartyUsers = users.filter(u => u.name.toLowerCase().includes(travelPartySearch.toLowerCase()));
    const filteredTourManagerUsers = users.filter(u => u.name.toLowerCase().includes(tourManagerSearch.toLowerCase()));

    const tourManager = users.find(u => u.id === formState.callSheet?.tourManagerId);
    
    const travelPartyPopoverContent = (
        <div className="p-2 w-64">
            <Input 
                placeholder="Zoek persoon..." 
                value={travelPartySearch}
                onChange={(e) => setTravelPartySearch(e.target.value)}
                className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto">
                {filteredTravelPartyUsers.length > 0 ? filteredTravelPartyUsers.map(user => (
                    <div key={user.id} onClick={() => handleSelectTravelPartyUser(user)} className="p-2 hover:bg-accent cursor-pointer rounded-md">
                        {user.name}
                    </div>
                )) : <p className="p-2 text-sm text-muted-foreground">Geen resultaten</p>}
            </div>
        </div>
    );
    
    const tourManagerPopoverContent = (
         <div className="p-2 w-64">
            <Input 
                placeholder="Zoek persoon..." 
                value={tourManagerSearch}
                onChange={(e) => setTourManagerSearch(e.target.value)}
                className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto">
                {filteredTourManagerUsers.length > 0 ? filteredTourManagerUsers.map(user => (
                    <div key={user.id} onClick={() => { handleCallsheetChange('tourManagerId', user.id); setIsTourManagerPopoverOpen(false); setTourManagerSearch(''); }} className="p-2 hover:bg-accent cursor-pointer rounded-md">
                        {user.name}
                    </div>
                )) : <p className="p-2 text-sm text-muted-foreground">Geen resultaten</p>}
            </div>
        </div>
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const venueToUpdate = venues.find(v => v.id === formState.venueId);
        if (venueToUpdate && venueToUpdate.address !== venueAddress) {
            updateVenue({ ...venueToUpdate, address: venueAddress });
        }
        onSave(formState);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
            <FormSection title="Algemene Informatie">
                <div className="flex items-start gap-2">
                    <LabeledInput label="Event Titel" name="title" value={formState.title} onChange={e => handleEventChange('title', e.target.value)} required />
                    <div className="pt-7">
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleFetchDetails} disabled={isFetchingDetails}>
                            {isFetchingDetails ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                            Vul automatisch aan met AI
                        </Button>
                    </div>
                </div>
                <AddressInput 
                    label="Locatie Adres" 
                    value={venueAddress} 
                    onValueChange={setVenueAddress} 
                    onSuggestionSelect={(suggestion) => {
                        setVenueAddress(suggestion.address);
                        let existingVenue = venues.find(v => v.address.toLowerCase() === suggestion.address.toLowerCase());
                        if (existingVenue) {
                            handleEventChange('venueId', existingVenue.id);
                        } else {
                            const newVenue: Omit<Venue, 'id' | 'bandId'> = { name: suggestion.address.split(',')[0], address: suggestion.address, lat: suggestion.lat, lng: suggestion.lng };
                            addVenue(newVenue);
                            toast({ title: "Locatie toegevoegd", description: `"${newVenue.name}" is toegevoegd. Selecteer het opnieuw in het event formulier om te koppelen.`});
                        }
                    }} 
                />

                <LabeledInput label="Omschrijving" name="description" value={formState.description || ''} onChange={e => handleEventChange('description', e.target.value)} isTextArea />
                <LabeledInput label="Event Website" name="eventWebsite" value={formState.callSheet?.eventWebsite || ''} onChange={e => handleCallsheetChange('eventWebsite', e.target.value)} />
            </FormSection>

             <FormSection title="Logistiek">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Tourmanager</label>
                        <Popover
                            isOpen={isTourManagerPopoverOpen}
                            setIsOpen={setIsTourManagerPopoverOpen}
                            content={tourManagerPopoverContent}
                            trigger={
                                <Button type="button" variant="outline" className="w-full justify-start text-left h-auto min-h-10">
                                    {tourManager ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div>
                                                <p>{tourManager.name}</p>
                                                <p className="text-xs text-muted-foreground">{tourManager.phone}</p>
                                            </div>
                                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleCallsheetChange('tourManagerId', undefined); }} />
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <UserSearch className="h-4 w-4"/> Selecteer een tourmanager...
                                        </span>
                                    )}
                                </Button>
                            }
                        />
                     </div>
                     <div/>
                      <AddressInput label="Parking Adres" value={formState.callSheet?.artistParking?.address || ''} onValueChange={value => handleNestedCallsheetChange('artistParking', 'address', value)} />
                     <LabeledInput label="Parking Details" name="artistParking.details" value={formState.callSheet?.artistParking?.details || ''} onChange={e => handleNestedCallsheetChange('artistParking', 'details', e.target.value)} />
                     <AddressInput label="Load-in Adres" value={formState.callSheet?.loadin?.address || ''} onValueChange={value => handleNestedCallsheetChange('loadin', 'address', value)} />
                     <LabeledInput label="Load-in Details" name="loadin.details" value={formState.callSheet?.loadin?.details || ''} onChange={e => handleNestedCallsheetChange('loadin', 'details', e.target.value)} />
                 </div>
             </FormSection>

            {/* Dynamic list for Timing */}
            <Card className="rounded-xl">
                 <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/> Timing</CardTitle>
                    <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={handleGenerateTiming} disabled={isGeneratingTiming}>
                        {isGeneratingTiming ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                        Genereer met AI
                    </Button>
                 </CardHeader>
                 <CardContent className="space-y-2">
                    {formState.callSheet?.timing?.map((item) => (
                        <div key={item.id} className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-2">
                            <Input type="time" placeholder="Tijd (bv. 18:00)" value={item.time} onChange={e => handleListChange<CallSheetTimingItem>('timing', item.id, 'time', e.target.value)} className="w-28" />
                            <Input placeholder="Omschrijving" value={item.description} onChange={e => handleListChange<CallSheetTimingItem>('timing', item.id, 'description', e.target.value)} />
                            <div className="relative w-24">
                               <Input type="number" placeholder="Duur" value={item.duration ?? ''} onChange={e => handleListChange<CallSheetTimingItem>('timing', item.id, 'duration', e.target.value ? parseInt(e.target.value) : undefined)} className="pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">'</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeListItem('timing', item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" className="gap-2" onClick={() => addListItem<CallSheetTimingItem>('timing', { time: '', description: '' })}><Plus className="h-4 w-4" /> Item Toevoegen</Button>
                 </CardContent>
            </Card>

             {/* Dynamic list for Travel Party */}
            <Card className="rounded-xl">
                 <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Travelparty</CardTitle></CardHeader>
                 <CardContent className="space-y-2">
                    {formState.callSheet?.travelParty?.map((item) => (
                        <div key={item.id} className="grid grid-cols-[1fr,1fr,1fr,auto,auto] gap-2 items-center">
                            <Input placeholder="Naam" value={item.name} onChange={e => handleListChange<CallSheetTravelPartyItem>('travelParty', item.id, 'name', e.target.value)} />
                            <Input placeholder="Rol" value={item.role} onChange={e => handleListChange<CallSheetTravelPartyItem>('travelParty', item.id, 'role', e.target.value)} />
                            <Input placeholder="Contact" value={item.contact || ''} onChange={e => handleListChange<CallSheetTravelPartyItem>('travelParty', item.id, 'contact', e.target.value)} />
                            <Input type="time" placeholder="Call Time" value={item.callTime} onChange={e => handleListChange<CallSheetTravelPartyItem>('travelParty', item.id, 'callTime', e.target.value)} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeListItem('travelParty', item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                     <Popover
                        isOpen={isTravelPartyPopoverOpen}
                        setIsOpen={setIsTravelPartyPopoverOpen}
                        content={travelPartyPopoverContent}
                        trigger={<Button type="button" variant="secondary" className="gap-2"><Plus className="h-4 w-4" /> Persoon Toevoegen</Button>}
                    />
                 </CardContent>
            </Card>

             {/* Dynamic list for Line up */}
            <Card className="rounded-xl">
                 <CardHeader><CardTitle className="flex items-center gap-2"><ListMusic className="h-5 w-5 text-primary"/> Line up</CardTitle></CardHeader>
                 <CardContent className="space-y-2">
                    {formState.callSheet?.lineup?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <Input placeholder="Tijd" value={item.time} onChange={e => handleListChange<CallSheetLineupItem>('lineup', item.id, 'time', e.target.value)} className="w-32" />
                            <Input placeholder="Act" value={item.act} onChange={e => handleListChange<CallSheetLineupItem>('lineup', item.id, 'act', e.target.value)} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeListItem('lineup', item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" className="gap-2" onClick={() => addListItem<CallSheetLineupItem>('lineup', { time: '', act: '' })}><Plus className="h-4 w-4" /> Act Toevoegen</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Functie niet beschikbaar", description: "Importeren van Excel wordt binnenkort ondersteund."})}>Importeer (Excel)</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Functie niet beschikbaar", description: "Importeren van website wordt binnenkort ondersteund."})}>Link Website</Button>
                    </div>
                 </CardContent>
            </Card>

            <FormSection title="Technische Informatie">
                <LabeledInput label="Algemene Technische Info" name="technical" value={formState.callSheet?.technical || ''} onChange={e => handleCallsheetChange('technical', e.target.value)} isTextArea />
                
                <div>
                    <h4 className="block text-sm font-medium text-muted-foreground mb-2">Gekoppelde Riders</h4>
                    <div className="space-y-2">
                        {techRiders.map(doc => (
                            <label key={doc.id} className="flex items-center gap-2 p-2 bg-background rounded-md border border-input">
                                <input 
                                    type="checkbox"
                                    checked={formState.callSheet?.technicalRiderIds?.includes(doc.id) || false}
                                    onChange={() => handleRiderToggle(doc.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{doc.title}</span>
                            </label>
                        ))}
                        {techRiders.length === 0 && <p className="text-sm text-muted-foreground">Geen technische riders gevonden in documenten.</p>}
                    </div>
                </div>
            </FormSection>
            
            <FormSection title="Overige Informatie">
                 <LabeledInput label="Gastenlijst (één per lijn)" name="guests" value={formState.callSheet?.guests?.join('\n') || ''} onChange={e => handleCallsheetChange('guests', e.target.value.split('\n'))} isTextArea />
                 <LabeledInput label="Kleedkamer Info" name="dressingRoom" value={formState.callSheet?.dressingRoom || ''} onChange={e => handleCallsheetChange('dressingRoom', e.target.value)} isTextArea />
                 <LabeledInput label="Catering Info" name="catering" value={formState.callSheet?.catering || ''} onChange={e => handleCallsheetChange('catering', e.target.value)} isTextArea />
                 <LabeledInput label="Venue Info" name="venueInfo" value={formState.callSheet?.venueInfo || ''} onChange={e => handleCallsheetChange('venueInfo', e.target.value)} isTextArea />
                 <LabeledInput label="Podium Info" name="stageInfo" value={formState.callSheet?.stageInfo || ''} onChange={e => handleCallsheetChange('stageInfo', e.target.value)} isTextArea />
                 <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Facturatie Info</label>
                    <select onChange={handleBillingSelect} defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2">
                        <option value="">-- Selecteer persoon om automatisch in te vullen --</option>
                        {users.filter(u => u.companyName).map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.companyName})</option>
                        ))}
                    </select>
                    <textarea name="billingInfo" value={formState.callSheet?.billingInfo || ''} onChange={e => handleCallsheetChange('billingInfo', e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
            </FormSection>

            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-card py-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Callsheet Opslaan</Button>
            </div>
        </form>
    );
};