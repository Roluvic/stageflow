
import React from 'react';
import type { Event, Band, Venue, User, Document } from '../../../types';

interface PrintableCallSheetProps {
    event: Event;
    band: Band | null;
    venue: Venue | undefined;
    users: User[];
    documents: Document[];
}

const PrintSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => {
    if (!children || (Array.isArray(children) && children.filter(Boolean).length === 0)) return null;
    return (
        <div className={`grid grid-cols-[150px,1fr] text-sm mb-2 ${className}`}>
            <p className="font-bold uppercase">{title}:</p>
            <div className="whitespace-pre-line">{children}</div>
        </div>
    );
}

const PrintTable: React.FC<{ headers: string[], data: (string | null | undefined)[][] }> = ({ headers, data }) => (
    <table className="w-full text-sm">
        <thead>
            <tr className="text-left">
                {headers.map(h => <th key={h} className="pb-1">{h}</th>)}
            </tr>
        </thead>
        <tbody>
            {data.map((row, i) => (
                <tr key={i}>
                    {row.map((cell, j) => <td key={j} className="py-0.5">{cell || ''}</td>)}
                </tr>
            ))}
        </tbody>
    </table>
)


export const PrintableCallSheet: React.FC<PrintableCallSheetProps> = ({ event, band, venue, users, documents }) => {
    const cs = event.callSheet;
    const tourManager = users.find(u => u.id === cs?.tourManagerId);

    const attachments = (cs?.technicalRiderIds || [])
        .map(id => documents.find(d => d.id === id))
        .filter((d): d is Document => !!d);

    return (
        <div className="bg-white text-black p-8 font-sans">
            {/* --- Main Call Sheet Page --- */}
            <div>
                <header className="text-center mb-8">
                    {band?.logoUrl && <img src={band.logoUrl} alt={`${band.name} Logo`} className="h-20 mx-auto mb-4 object-contain" />}
                    <h1 className="text-2xl font-bold uppercase">{band?.name || 'CALLSHEET'}</h1>
                    <h2 className="text-xl uppercase">{event.start.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })} – {venue?.name}</h2>
                </header>

                <main className="space-y-4">
                    <PrintSection title="Locatie">{venue?.name}\n{venue?.address}</PrintSection>
                    {cs?.artistParking && <PrintSection title="Artiestenparking">{cs.artistParking.address}\n{cs.artistParking.details}</PrintSection>}
                    {cs?.loadin && <PrintSection title="Laden & Lossen">{cs.loadin.address}\n{cs.loadin.details}</PrintSection>}
                    {tourManager && <PrintSection title="Tourmanagement">{tourManager.name} - {tourManager.phone}</PrintSection>}
                    {cs?.guests && cs.guests.length > 0 && <PrintSection title="Guests">{cs.guests.join(', ')}</PrintSection>}
                    
                    {cs?.timing && cs.timing.length > 0 && (
                        <PrintSection title="Timing" className="mt-4">
                            <PrintTable headers={[]} data={cs.timing.map(t => [t.time, t.description])} />
                        </PrintSection>
                    )}

                    {cs?.travelParty && cs.travelParty.length > 0 && (
                        <PrintSection title="Travelparty" className="mt-4">
                             <PrintTable 
                                headers={['Naam', 'Rol', 'Contact', 'Call Time']} 
                                data={cs.travelParty.map(tp => [tp.name, tp.role, tp.contact, tp.callTime])} 
                            />
                        </PrintSection>
                    )}
                    
                    {cs?.contacts && cs.contacts.length > 0 && (
                        <PrintSection title="Contactpersonen" className="mt-4">
                            {cs.contacts.map(c => <p key={c.id}>{c.name} ({c.role}) - {c.phone}</p>)}
                        </PrintSection>
                    )}

                    {cs?.dressingRoom && <PrintSection title="Artiestenkleedkamer">{cs.dressingRoom}</PrintSection>}
                    {cs?.catering && <PrintSection title="Catering">{cs.catering}</PrintSection>}
                    {cs?.technical && <PrintSection title="Techniek">{cs.technical}</PrintSection>}
                    {cs?.venueInfo && <PrintSection title="Aard Locatie">{cs.venueInfo}</PrintSection>}
                    {cs?.stageInfo && <PrintSection title="Stage">{cs.stageInfo}</PrintSection>}

                    {cs?.lineup && cs.lineup.length > 0 && (
                        <PrintSection title="Line up" className="mt-4">
                             <PrintTable 
                                headers={[]} 
                                data={cs.lineup.map(l => [l.time, l.act])} 
                            />
                        </PrintSection>
                    )}

                    {cs?.billingInfo && <PrintSection title="Facturatiegegevens" className="mt-4">{cs.billingInfo}</PrintSection>}

                </main>
            </div>

            {/* --- Attachments --- */}
            {attachments.map(doc => (
                 <div key={doc.id} className="page-break w-full h-full">
                    {/* Assuming attachments are images for printing */}
                    <img src={doc.url} alt={doc.title} className="max-w-full max-h-full object-contain" />
                </div>
            ))}
        </div>
    );
};
