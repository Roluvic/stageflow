
import React, { useContext, useState, useRef, useEffect } from 'react';
import type { Event, Document, User } from '../../../types';
import { AppContext } from '../../../App';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Printer, MapPin, ParkingCircle, Truck, User as UserIcon, Users, Clock, Mic2, Star, ListMusic, FileText, Edit, ExternalLink, Mail, Link as LinkIcon } from 'lucide-react';
import { CallSheetForm } from './CallSheetForm';
import { Popover } from '../../../components/ui/Popover';
import { Avatar } from '../../../components/ui/Avatar';
import { PrintableCallSheet } from './PrintableCallSheet';

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
    const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    
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
        setIsExportPopoverOpen(false);
    };

    useEffect(() => {
        if (isPrinting) {
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 100); // Small timeout to allow render
        }
    }, [isPrinting]);

    const handleSave = (updatedEvent: Event) => {
        updateEvent(updatedEvent);
        setIsEditing(false);
    };
    
    const handlePdfExport = () => {
        toast({ title: "Exporteer als PDF", description: "Gebruik de 'Opslaan als PDF' optie in het printvenster." });
        handlePrint();
    }

    const handleMail = () => {
        const subject = `Callsheet: ${event.title} op ${event.start.toLocaleDateString('nl-BE')}`;
        const body = `
Hallo,

Hierbij de callsheet voor het evenement "${event.title}".

Datum: ${event.start.toLocaleString('nl-BE', { dateStyle: 'full', timeStyle: 'short' })}
Locatie: ${venue?.name}, ${venue?.address}

Timing:
${cs?.timing?.map(t => `- ${t.time}: ${t.description}`).join('\n') || 'N/A'}

Gelieve de volledige callsheet in de bijlage of via de StageFlow app te raadplegen voor alle details.

Met vriendelijke groeten,
StageFlow
        `.trim().replace(/^ +/gm, '');

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setIsExportPopoverOpen(false);
    }

    const exportContent = (
      <div className="p-1 w-48">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Printen
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handlePdfExport}>
          <FileText className="h-4 w-4" /> Exporteer als PDF
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleMail}>
          <Mail className="h-4 w-4" /> Verstuur via Mail
        </Button>
      </div>
    );

    const dialogTitle = (
        <div className="flex justify-between items-start w-full">
            <div>
                <h2 className="text-2xl font-bold">{event.title}</h2>
                <p className="text-muted-foreground">
                    {event.start.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
             <div className="flex items-center gap-2 print:hidden pl-4">
                {canEdit && !isEditing && (
                    <Button variant="secondary" className="gap-2" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4" /> Bewerk
                    </Button>
                )}
                <Popover
                  isOpen={isExportPopoverOpen}
                  setIsOpen={setIsExportPopoverOpen}
                  content={exportContent}
                  trigger={
                    <Button variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                  }
                />
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
        <Dialog isOpen={true} onClose={onClose} title={dialogTitle} size="xl">
            {isEditing ? (
                <CallSheetForm 
                    event={event}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                    users={users}
                    documents={documents}
                    events={events}
                />
            ) : (
                <div className="max-h-[80vh] overflow-y-auto pr-4">
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
                                    <ul className="space-y-2">
                                        {cs.timing.map((item) => (
                                            <li key={item.id} className="flex items-center">
                                                <span className="w-20 font-mono font-semibold text-primary">{item.time}</span>
                                                <span>{item.description}</span>
                                            </li>
                                        ))}
                                    </ul>
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
                </div>
            )}
        </Dialog>
        </>
    );
};
