import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../App';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, Band, UserRole } from '../../types';
import { Edit, Trash2, Plus, Image as ImageIcon, Loader2, Upload, X, ArrowRight, Sparkles } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import { getThemeColorFromImage, getLogoForBand } from '../../services/geminiService';
import { Avatar } from '../../components/ui/Avatar';

const BandForm: React.FC<{ band?: Band | null, onSave: (band: Omit<Band, 'id'> | Band) => void, onCancel: () => void }> = ({ band, onSave, onCancel }) => {
    const { toast } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: band?.name || '',
        logoUrl: band?.logoUrl || '',
        themeColor: band?.themeColor || '#3B82F6',
    });
    const [isDerivingColor, setIsDerivingColor] = useState(false);
    const [isFindingLogo, setIsFindingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Automatically search for a logo if a new band is being created and has a name, but no logo.
        if (!band && formData.name && !formData.logoUrl && !isFindingLogo) {
             handleFindLogo();
        }
    }, [formData.name]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                setFormData(prev => ({ ...prev, logoUrl: dataUrl }));

                // Call AI to derive color
                setIsDerivingColor(true);
                try {
                    const base64Data = dataUrl.split(',')[1];
                    if (base64Data) {
                        const newColor = await getThemeColorFromImage(base64Data, file.type);
                        if (newColor) {
                            setFormData(prev => ({ ...prev, themeColor: newColor }));
                            toast({ title: "Themakleur gevonden!", description: "De AI heeft een kleur uit het logo voorgesteld." });
                        } else {
                            toast({ title: "Kleur niet gevonden", description: "Kon geen themakleur afleiden. Kies handmatig een kleur.", variant: "destructive" });
                        }
                    }
                } catch (error) {
                    toast({ title: "AI Fout", description: "Er is een fout opgetreden bij het analyseren van de afbeelding.", variant: "destructive" });
                } finally {
                    setIsDerivingColor(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlBlur = async () => {
        if (!formData.logoUrl || formData.logoUrl.startsWith('data:') || formData.logoUrl === band?.logoUrl) {
            return;
        }

        try {
            new URL(formData.logoUrl);
        } catch (_) {
            return; // Not a valid URL string
        }

        setIsDerivingColor(true);
        try {
            // Using a proxy could solve CORS, but for client-side, we try direct fetch.
            const response = await fetch(formData.logoUrl);
            if (!response.ok) throw new Error('Kon afbeelding niet ophalen');
            const blob = await response.blob();
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                setFormData(prev => ({ ...prev, logoUrl: dataUrl })); // Replace URL with data URL to prevent future CORS issues for display

                const base64Data = dataUrl.split(',')[1];
                if (base64Data) {
                    const newColor = await getThemeColorFromImage(base64Data, blob.type);
                    if (newColor) {
                        setFormData(prev => ({ ...prev, themeColor: newColor }));
                        toast({ title: "Themakleur gevonden!", description: "De AI heeft een kleur uit het logo voorgesteld." });
                    } else {
                        toast({ title: "Kleur niet gevonden", description: "Kon geen themakleur afleiden.", variant: "destructive" });
                    }
                }
                setIsDerivingColor(false);
            };
            reader.onerror = () => {
                 toast({ title: "Fout", description: "Kon het afbeeldingsbestand niet lezen.", variant: "destructive" });
                 setIsDerivingColor(false);
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error("Error fetching image from URL:", error);
            toast({ title: "Fout bij URL", description: "Kon de afbeelding niet ophalen. Dit kan een CORS-probleem zijn. Probeer de afbeelding te uploaden.", variant: "destructive" });
            setIsDerivingColor(false);
        }
    };

    const handleFindLogo = async () => {
        if (!formData.name) {
            toast({ title: "Naam vereist", description: "Voer eerst een bandnaam in.", variant: "destructive" });
            return;
        }
        setIsFindingLogo(true);
        try {
            const result = await getLogoForBand(formData.name);
            if (result?.logoUrl) {
                setFormData(prev => ({ ...prev, logoUrl: result.logoUrl }));
                toast({ title: "Logo Gevonden!", description: "De AI heeft een logo gevonden. U kunt dit nog wijzigen." });
                await handleUrlBlur(); // This will also trigger color derivation
            } else {
                toast({ title: "Logo niet gevonden", description: "De AI kon geen passend logo vinden.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "AI Fout", description: "Er is een fout opgetreden bij het zoeken naar een logo.", variant: "destructive" });
        } finally {
            setIsFindingLogo(false);
        }
    }


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (band) {
            onSave({ ...band, ...formData });
        } else {
            onSave(formData);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Naam Band</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Logo</label>
                <div className="flex items-center gap-4">
                    {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className="flex-1 space-y-2">
                        <Input name="logoUrl" value={formData.logoUrl} onChange={handleChange} onBlur={handleUrlBlur} placeholder="Plak URL, upload, of zoek met AI..." />
                        <Input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" ref={logoInputRef} />
                        <div className="flex gap-2">
                             <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} className="gap-2">
                                <Upload className="h-4 w-4" /> Upload
                            </Button>
                            <Button type="button" variant="outline" onClick={handleFindLogo} className="gap-2" disabled={isFindingLogo}>
                                {isFindingLogo ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                                Zoek met AI
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Themakleur</label>
                <div className="flex items-center gap-2">
                    <Input name="themeColor" type="color" value={formData.themeColor} onChange={handleChange} className="w-16 h-10 p-1" disabled={isDerivingColor} />
                    <div className="relative flex-1">
                        <Input value={formData.themeColor} onChange={handleChange} className="flex-1" disabled={isDerivingColor} />
                        {isDerivingColor && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Opslaan</Button>
            </div>
        </form>
    );
}

const AddMembersModal: React.FC<{ band: Band, onClose: () => void }> = ({ band, onClose }) => {
    const { allUsers, bands, updateUser, toast } = useContext(AppContext);
    const usersNotInBand = allUsers.filter(u => u.bandId !== band.id);

    const handleMoveUser = (user: User, targetBand: Band) => {
        const sourceBand = bands.find(b => b.id === user.bandId);
        const confirmMessage = sourceBand
            ? `Weet je zeker dat je ${user.name} wilt verplaatsen van "${sourceBand.name}" naar "${targetBand.name}"?`
            : `Weet je zeker dat je ${user.name} wilt toevoegen aan "${targetBand.name}"?`;
        
        if (window.confirm(confirmMessage)) {
            updateUser({ ...user, bandId: targetBand.id });
            toast({ title: "Persoon Verplaatst", description: `${user.name} is nu lid van ${targetBand.name}.` });
        }
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <p className="text-muted-foreground mb-4">Verplaats personen van andere bands of wijs niet-toegewzen personen toe aan "{band.name}".</p>
            <div className="space-y-2">
                {usersNotInBand.length > 0 ? usersNotInBand.map(user => {
                    const currentBand = bands.find(b => b.id === user.bandId);
                    return (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                            <div className="flex items-center gap-3">
                                <Avatar src={user.avatar} firstName={user.firstName} lastName={user.lastName} className="h-10 w-10" />
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">Huidige band: {currentBand?.name || 'Geen'}</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleMoveUser(user, band)}>Verplaats</Button>
                        </div>
                    )
                }) : <p className="text-muted-foreground text-center p-4">Alle personen zijn al lid van deze band.</p>}
            </div>
            <div className="flex justify-end pt-6">
                <Button onClick={onClose}>Sluiten</Button>
            </div>
        </div>
    )
}

const RemoveMemberModal: React.FC<{ member: User, onClose: () => void }> = ({ member, onClose }) => {
    const { bands, updateUser, toast } = useContext(AppContext);
    const otherBands = bands.filter(b => b.id !== member.bandId);
    const currentBand = bands.find(b => b.id === member.bandId);

    const handleMoveUser = (targetBand: Band) => {
        if (window.confirm(`Weet je zeker dat je ${member.name} wilt verplaatsen naar "${targetBand.name}"?`)) {
            updateUser({ ...member, bandId: targetBand.id });
            toast({ title: "Persoon Verplaatst", description: `${member.name} is nu lid van ${targetBand.name}.` });
            onClose();
        }
    };
    
    const handleRemoveFromBand = () => {
        if (window.confirm(`Weet je zeker dat je ${member.name} wilt verwijderen uit de band "${currentBand?.name}"? De persoon blijft bewaard in het systeem en kan later opnieuw worden toegewezen.`)) {
            updateUser({ ...member, bandId: undefined });
            toast({ title: "Persoon Verwijderd uit Band", description: `${member.name} is niet langer lid van een band.` });
            onClose();
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground">Selecteer een andere band om {member.firstName} naartoe te verplaatsen, of verwijder de persoon uit de huidige band.</p>
            {otherBands.length > 0 && (
                <div className="space-y-2">
                    {otherBands.map(band => (
                        <Button key={band.id} variant="secondary" className="w-full justify-between" onClick={() => handleMoveUser(band)}>
                            <span>Verplaats naar <strong>{band.name}</strong></span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ))}
                </div>
            )}
            <hr />
            <Button variant="destructive" className="w-full" onClick={handleRemoveFromBand}>
                Verwijder uit "{currentBand?.name}"
            </Button>
            <div className="flex justify-end pt-4 mt-4 border-t border-border">
                <Button variant="ghost" onClick={onClose}>Annuleren</Button>
            </div>
        </div>
    )
}


export const BandManagementPage: React.FC = () => {
    const { bands, allUsers, addBand, updateBand, deleteBand, currentUser } = useContext(AppContext);
    const [editingBand, setEditingBand] = useState<Band | null>(null);
    const [isNewBandModalOpen, setIsNewBandModalOpen] = useState(false);
    const [managingMembersFor, setManagingMembersFor] = useState<Band | null>(null);
    const [removingMember, setRemovingMember] = useState<User | null>(null);

    const handleSaveBand = (bandData: Omit<Band, 'id'> | Band) => {
        if ('id' in bandData) {
            updateBand(bandData);
        } else {
            addBand(bandData);
        }
        setEditingBand(null);
        setIsNewBandModalOpen(false);
    }
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bandbeheer</h1>
                    <p className="text-muted-foreground">Beheer de bands die je managet en de bijbehorende teamleden.</p>
                </div>
                 <Button className="gap-2" onClick={() => setIsNewBandModalOpen(true)}>
                    <Plus className="h-5 w-5" />
                    Nieuwe Band Toevoegen
                </Button>
            </div>
            <div className="space-y-6">
                {bands.map(band => {
                    const members = allUsers.filter(u => u.bandId === band.id);
                    const roleOrder: UserRole[] = ['owner', 'manager', 'artist', 'crew', 'viewer'];
                    
                    const groupedMembers = members
                        .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
                        .reduce((acc, member) => {
                            let group: string;
                            switch(member.role) {
                                case 'owner': case 'manager': group = 'Management'; break;
                                case 'artist': group = 'Artiesten'; break;
                                case 'crew': group = 'Crew'; break;
                                case 'viewer': group = 'Viewers'; break;
                                default: group = 'Overig';
                            }
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(member);
                            return acc;
                        }, {} as Record<string, User[]>);

                    const groupOrder = ['Management', 'Artiesten', 'Crew', 'Viewers', 'Overig'];

                    return (
                        <Card key={band.id} className="rounded-2xl">
                             <CardHeader className="flex-row items-start justify-between">
                                <div className="flex items-center gap-4">
                                     {band.logoUrl ? (
                                        <img src={band.logoUrl} alt={`${band.name} logo`} className="h-16 w-16 rounded-lg object-cover" />
                                     ) : (
                                        <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                     )}
                                    <div>
                                        <CardTitle>{band.name}</CardTitle>
                                        <CardDescription>Beheer de band en de bijbehorende teamleden.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingBand(band)}><Edit className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteBand(band.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2">Leden ({members.length})</h3>
                                    {members.length > 0 ? (
                                        <div className="space-y-4">
                                            {groupOrder.map(groupName => {
                                                if (groupedMembers[groupName]) {
                                                    return (
                                                        <div key={groupName}>
                                                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">{groupName} ({groupedMembers[groupName].length})</h4>
                                                            <div className="flex flex-wrap gap-3">
                                                                {groupedMembers[groupName].map(member => (
                                                                    <div key={member.id} className="relative group flex items-center gap-2 p-2 pr-3 bg-secondary rounded-full">
                                                                        <Avatar src={member.avatar} firstName={member.firstName} lastName={member.lastName} className="h-7 w-7" />
                                                                        <div>
                                                                            <p className="font-medium text-sm leading-tight">{member.name}</p>
                                                                            <p className="text-xs text-muted-foreground capitalize leading-tight">{member.role}</p>
                                                                        </div>
                                                                        {currentUser?.id !== member.id && (
                                                                            <button 
                                                                                onClick={() => setRemovingMember(member)}
                                                                                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                title={`Verplaats ${member.firstName}`}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            })}
                                        </div>
                                    ) : <p className="text-sm text-muted-foreground italic">Geen leden in deze band.</p>}
                                </div>
                                <Button variant="secondary" size="sm" className="gap-2" onClick={() => setManagingMembersFor(band)}>
                                    <Plus className="h-4 w-4"/> Leden Toevoegen / Verplaatsen
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Edit/Add band dialog */}
            <Dialog isOpen={!!editingBand || isNewBandModalOpen} onClose={() => { setEditingBand(null); setIsNewBandModalOpen(false); }} title={editingBand ? 'Band Bewerken' : 'Nieuwe Band Toevoegen'}>
                <BandForm band={editingBand} onSave={handleSaveBand} onCancel={() => { setEditingBand(null); setIsNewBandModalOpen(false); }} />
            </Dialog>

            {/* Add/move members dialog */}
            <Dialog isOpen={!!managingMembersFor} onClose={() => setManagingMembersFor(null)} title={`Leden toevoegen aan ${managingMembersFor?.name}`} size="lg">
                {managingMembersFor && <AddMembersModal band={managingMembersFor} onClose={() => setManagingMembersFor(null)} />}
            </Dialog>
            
            {/* Remove/move member dialog */}
            <Dialog isOpen={!!removingMember} onClose={() => setRemovingMember(null)} title={`Beheer ${removingMember?.name}`}>
                {removingMember && <RemoveMemberModal member={removingMember} onClose={() => setRemovingMember(null)} />}
            </Dialog>
        </div>
    );
}