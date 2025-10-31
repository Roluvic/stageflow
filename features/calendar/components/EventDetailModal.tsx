import React, { useContext, useState, useEffect } from 'react';
import type { Event, Document, User } from '../../../types';
import { AppContext } from '../../../App';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Printer, MapPin, ParkingCircle, Truck, User as UserIcon, Users, Clock, Mic2, Star, ListMusic, FileText, Edit, ExternalLink, Mail, Link as LinkIcon, ArrowLeft, Send, Sparkles, Loader2, MessageSquare, Navigation } from 'lucide-react';
import { CallSheetForm } from './CallSheetForm';
import { Avatar } from '../../../components/ui/Avatar';
import { PrintableCallSheet } from './PrintableCallSheet';
import { getAiCommunicationDraft } from '../../../services/geminiService';
import { Input } from '../../../components/ui/Input';

interface EventDetailModalProps {
    event: Event;
    onClose: () => void;
}

const InfoSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
    if (!children) return null;

    if (Array.isArray(children)) {
        const validChildren = children.filter(Boolean);
        if (validChildren.length === 0) return null;
    }

    return (
        <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                <Icon className="h-5 w-5" />
                {title}
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">{children}</div>
        </div>
    );
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
    const { users, venues, documents, currentUser, updateEvent, events, currentBand, toast } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    
    // State for communication feature
    const [isCommunicating, setIsCommunicating] = useState(false);
    const [draft, setDraft] = useState<{ to: string, subject: string, body: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const venue = venues.find(v => v.id === event.venueId);
    const cs = event.callSheet;

    const assignments = event.assignments.map(a => {
        const user = users.find(u => u.id === a.userId);
        return user ? { ...a, user } : null;
    }).filter((item): item is { userId: string; role: string; fee?: number; user: User } => !!item);
    
    const tourManager = cs?.tourManagerId ? users.find(u => u.id === cs.tourManagerId) : null;

    const technicalRiders = cs?.technicalRiderIds
        ?.map(id => documents.find(d => d.id === id))
        .filter((d): d is Document => !!d);

    const canEdit = currentUser && ['owner', 'manager'].includes(currentUser.role);

    const handlePrint = () => {
        setIsPrinting(true);
    };

    useEffect(() => {
        if (isPrinting) {
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 300); // Increased timeout to allow render
        }
    }, [isPrinting]);

    const handleSave = (updatedEvent: Event) => {
        updateEvent(updatedEvent);
        setIsEditing(false);
    };

    const handleGenerateDraft = async (type: 'venueConfirmation' | 'artistReminder') => {
        if (!currentBand || !currentUser) return;
        setIsGenerating(true);
        setDraft(null);

        try {
            const result = await getAiCommunicationDraft(type, event, { venue, users, bandName: currentBand.name, managerName: currentUser.name });
            if (result) {
                let recipients: string[] = [];
                if (type === 'venueConfirmation') {
                    // In a real app, venue would have a contact email. We'll leave it empty for now.
                    recipients = ['']; 
                } else if (type === 'artistReminder') {
                    recipients = assignments.map(a => a.user.email).filter(Boolean);
                }
                setDraft({ ...result, to: recipients.join(', ') });
            } else {
                 toast({ title: "Genereren Mislukt", description: "De AI kon geen bericht opstellen.", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Fout", description: "Er is een fout opgetreden bij het genereren van het bericht.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleSendEmail = () => {
        if (!draft) return;
        const mailtoLink = `mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
        window.location.href = mailtoLink;
        toast({ title: "E-mail wordt geopend", description: "Je standaard e-mailprogramma wordt geopend om de e-mail te verzenden." });
    };

    const handleShareWhatsApp = () => {
        if (!draft) return;
        const text = `${draft.subject}\n\n${draft.body}`;
        const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappLink, '_blank');
        toast({ title: "WhatsApp wordt geopend", description: "Je wordt doorgestuurd om het bericht te delen." });
    };

    const resetCommunication = () => {
        setIsCommunicating(false);
        setDraft(null);
        setIsGenerating(false);
    };

    const handleClose = () => {
        resetCommunication();
        onClose();
    }
    
    const navigationAddress = cs?.artistParking?.address || cs?.loadin?.address || venue?.address;

    const dialogTitle = (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-2">
            <div className="flex-1 min-w-0">
                 <h2 className="text-xl sm:text-2xl font-bold leading-tight">{isCommunicating ? 'Bericht Opstellen' : event.title}</h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                    {event.start.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
             <div className="flex flex-shrink-0 items-center gap-2 print:hidden self-start sm:self-center">
                {!isCommunicating && (
                    <>
                        {navigationAddress && (
                           <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navigationAddress)}`} target="_blank" rel="noopener noreferrer" title="Navigeer naar locatie">
                                <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3 sm:gap-2">
                                    <Navigation className="h-4 w-4" />
                                    <span className="hidden sm:inline">Navigeer</span>
                                </Button>
                            </a>
                        )}
                        <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3 sm:gap-2" onClick={() => setIsCommunicating(true)}>
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">Communiceer</span>
                        </Button>
                        {canEdit && !isEditing && (
                            <Button size="icon" className="h-9 w-9 sm:w-auto sm:px-3 sm:gap-2" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">Bewerk</span>
                            </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3 sm:gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
    
    const renderCommunicationView = () => (
        <div className="space-y-4">
            {!draft && !isGenerating && (
                 <div>
                    <h3 className="font-semibold mb-2">Wat wil je doen?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => handleGenerateDraft('venueConfirmation')}>
                            <Sparkles className="h-5 w-5 text-primary"/>
                            <span>Bevestig met Locatie</span>
                            <span className="text-xs font-normal text-muted-foreground">Stel een professionele bevestigingsmail op.</span>
                        </Button>
                         <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => handleGenerateDraft('artistReminder')}>
                            <Sparkles className="h-5 w-5 text-primary"/>
                            <span>Herinner Artiesten</span>
                            <span className="text-xs font-normal text-muted-foreground">Stuur een herinnering naar alle aanwezigen.</span>
                        </Button>
                    </div>
                </div>
            )}

            {isGenerating && (
                 <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">AI stelt een bericht op...</p>
                </div>
            )}

            {draft && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Aan:</label>
                        <Input value={draft.to} onChange={e => setDraft(d => d ? {...d, to: e.target.value} : null)} placeholder=" ontvangers@email.com"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Onderwerp:</label>
                        <Input value={draft.subject} onChange={e => setDraft(d => d ? {...d, subject: e.target.value} : null)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Bericht:</label>
                        <textarea value={draft.body} onChange={e => setDraft(d => d ? {...d, body: e.target.value} : null)} className="w-full h-48 p-2 border rounded-md border-input bg-background"/>
                    </div>
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setDraft(null)} className="gap-2">
                           <ArrowLeft className="h-4 w-4"/> Opnieuw
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleShareWhatsApp} variant="outline" className="gap-2">
                               <MessageSquare className="h-4 w-4"/> Deel via WhatsApp
                            </Button>
                            <Button onClick={handleSendEmail} className="gap-2">
                               <Mail className="h-4 w-4"/> Verstuur via E-mail
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setIsCommunicating(false)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Terug naar Details
                </Button>
            </div>
        </div>
    );

    const renderDetailsView = () => (
        <div className="space-y-6">
            <InfoSection title="Details" icon={Clock}>
                <p className="font-semibold text-foreground">
                    {event.start.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </InfoSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoSection title="Locatie" icon={MapPin}>
                    <p className="font-semibold text-foreground">{venue?.name}</p>
                    <p>{venue?.address}</p>
            </InfoSection>
            {tourManager && <InfoSection title="Tourmanagement" icon={UserIcon}><p>{tourManager.name} - {tourManager.phone}</p></InfoSection>}
            {cs?.artistParking && <InfoSection title="Artiestenparking" icon={ParkingCircle}><p>{cs.artistParking.address}</p><p>{cs.artistParking.details}</p></InfoSection>}
            {cs?.loadin && <InfoSection title="Laden & Lossen" icon={Truck}><p>{cs.loadin.address}</p><p>{cs.loadin.details}</p></InfoSection>}
            {cs?.eventWebsite && (
                <InfoSection title="Event Website" icon={LinkIcon}>
                    <a href={cs.eventWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5">
                        {cs.eventWebsite} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </InfoSection>
            )}
            </div>

            {event.description && (
                <InfoSection title="Omschrijving" icon={FileText}>
                    <p>{event.description}</p>
                </InfoSection>
            )}

            {cs?.timing && cs.timing.length > 0 && (
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Timing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {cs.timing.map((item) => (
                                <div key={item.id} className="flex items-start border-b border-border/50 py-2 last:border-b-0">
                                    <span className="w-20 font-mono font-semibold text-primary">{item.time}</span>
                                    <span className="flex-1 pr-4">{item.description}</span>
                                    {item.duration != null && <span className="w-20 text-right font-mono text-muted-foreground">{item.duration}'</span>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {cs?.travelParty && cs.travelParty.length > 0 ? (
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Travelparty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-muted-foreground">
                                    <tr>
                                        <th className="p-2">Naam</th>
                                        <th className="p-2">Rol</th>
                                        <th className="p-2">Contact</th>
                                        <th className="p-2 text-right">Call Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {cs.travelParty.map((item) => (
                                    <tr key={item.id} className="border-t border-border">
                                        <td className="p-2 font-semibold">{item.name}</td>
                                        <td className="p-2">{item.role}</td>
                                        <td className="p-2 font-mono">{item.contact || '-'}</td>
                                        <td className="p-2 text-right font-mono">{item.callTime}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : assignments.length > 0 && (
                <InfoSection title="Aanwezig" icon={Users}>
                    <div className="flex flex-wrap gap-4">
                        {assignments.map(a => (
                            <div key={a.userId} className="flex items-center gap-2">
                                <Avatar src={a.user.avatar} firstName={a.user.firstName} lastName={a.user.lastName} className="h-8 w-8" />
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{a.user.name}</p>
                                    <p className="text-xs">{a.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoSection>
            )}
            
            {cs?.lineup && cs.lineup.length > 0 && (
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListMusic className="h-5 w-5 text-primary" /> Line up</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {cs.lineup.map((item) => (
                                <li key={item.id} className="flex items-center">
                                    <span className="w-32 font-mono font-semibold text-primary">{item.time}</span>
                                    <span>{item.act}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cs?.contacts && cs.contacts.length > 0 && <InfoSection title="Contactpersonen" icon={Users}><ul className="space-y-1">{cs.contacts.map((c) => <li key={c.id}>{c.name} ({c.role}) - {c.phone}</li>)}</ul></InfoSection>}
            {cs?.guests && cs.guests.length > 0 && <InfoSection title="Guests" icon={Star}><p>{cs.guests.join(', ')}</p></InfoSection>}
            {cs?.dressingRoom && <InfoSection title="Artiestenkleedkamer" icon={Mic2}><p>{cs.dressingRoom}</p></InfoSection>}
            {cs?.catering && <InfoSection title="Catering" icon={UserIcon}><p>{cs.catering}</p></InfoSection>}
            {cs?.technical && <InfoSection title="Technische Info" icon={FileText}><p>{cs.technical}</p></InfoSection>}
            {technicalRiders && technicalRiders.length > 0 && (
                <InfoSection title="Technische Riders" icon={FileText}>
                    <ul className="space-y-1">
                        {technicalRiders.map(rider => (
                            <li key={rider.id}>
                                <a href={rider.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5">
                                    {rider.title} <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </InfoSection>
            )}
            {cs?.venueInfo && <InfoSection title="Aard locatie" icon={MapPin}><p>{cs.venueInfo}</p></InfoSection>}
            {cs?.stageInfo && <InfoSection title="Stage" icon={MapPin}><p>{cs.stageInfo}</p></InfoSection>}
            {cs?.billingInfo && <InfoSection title="Facturatiegegevens" icon={FileText}><p className="whitespace-pre-line">{cs.billingInfo}</p></InfoSection>}
            </div>
        </div>
    );
    
    return (
        <>
            {isPrinting && (
                <div className="printable-area">
                    <PrintableCallSheet 
                        event={event} 
                        band={currentBand}
                        venue={venue}
                        users={users}
                        documents={documents}
                    />
                </div>
            )}
            <Dialog isOpen={true} onClose={handleClose} title={dialogTitle} size="xl">
                <div className="max-h-[80vh] overflow-y-auto pr-4">
                    {isEditing ? (
                        <CallSheetForm 
                            event={event}
                            onSave={handleSave}
                            onCancel={() => setIsEditing(false)}
                            users={users}
                            documents={documents}
                            events={events}
                        />
                    ) : isCommunicating ? (
                        renderCommunicationView()
                    ) : (
                        renderDetailsView()
                    )}
                </div>
            </Dialog>
        </>
    );
};