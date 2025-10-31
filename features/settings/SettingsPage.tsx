import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../../App';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, UserRole } from '../../types';
import { Check, Loader2, Upload, Trash2 } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getCompanyDetailsByVat } from '../../services/geminiService';

const MyProfileForm: React.FC<{ user: User, onUpdate: (user: User) => void }> = ({ user, onUpdate }) => {
    const { toast } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: user.name || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'artist' as UserRole,
        phone: user.phone || '',
        companyName: user.companyName || '',
        vatNumber: user.vatNumber || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        country: user.country || '',
    });
    
    const [isVatValidating, setIsVatValidating] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setAvatarPreview(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let passwordToUpdate = user.password;
        if (isChangingPassword) {
            if (passwords.new !== passwords.confirm) {
                toast({ title: "Fout", description: "Nieuwe wachtwoorden komen niet overeen.", variant: "destructive" });
                return;
            }
            if (user.password !== passwords.current) {
                toast({ title: "Fout", description: "Huidige wachtwoord is incorrect.", variant: "destructive" });
                return;
            }
            if (passwords.new.length > 0) {
                 passwordToUpdate = passwords.new;
            }
        }

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const finalData = { ...formData, avatar: avatarPreview, name: fullName, password: passwordToUpdate };
        onUpdate({ ...user, ...finalData });
        
        if (isChangingPassword) {
            setIsChangingPassword(false);
            setPasswords({ current: '', new: '', confirm: '' });
        }
    };

     const handleVatValidation = async () => {
        if (!formData.vatNumber) return;
        setIsVatValidating(true);
        try {
            const details = await getCompanyDetailsByVat(formData.vatNumber);
            if (details && !details.error && details.companyName) {
                setFormData(prev => ({
                    ...prev,
                    companyName: details.companyName || prev.companyName,
                    address: details.address || prev.address,
                    postalCode: details.postalCode || prev.postalCode,
                    city: details.city || prev.city,
                    country: details.country || prev.country,
                }));
                toast({ title: "Gegevens Gevonden", description: "De bedrijfsgegevens zijn automatisch ingevuld." });
            } else {
                toast({ title: "Geen Gegevens Gevonden", description: details.error || "Kon de gegevens niet automatisch invullen.", variant: "destructive" });
            }
        } catch (error) {
            console.error("VAT validation error:", error);
            toast({ title: "Fout", description: "Er is een fout opgetreden bij het valideren.", variant: "destructive" });
        } finally {
            setIsVatValidating(false);
        }
    }

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle>Mijn Profiel</CardTitle>
                <CardDescription>Update je persoonlijke en bedrijfsgegevens.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Avatar</label>
                        <div className="flex items-center gap-4">
                            <Avatar src={avatarPreview} firstName={formData.firstName} lastName={formData.lastName} className="h-16 w-16" />
                            <Input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" ref={avatarInputRef} />
                            <div className="flex flex-col gap-2">
                                <Button type="button" variant="secondary" onClick={() => avatarInputRef.current?.click()} className="gap-2">
                                    <Upload className="h-4 w-4" /> Wijzig foto
                                </Button>
                                {avatarPreview && (
                                    <Button type="button" variant="ghost" onClick={() => setAvatarPreview('')} className="gap-2 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" /> Verwijder foto
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Voornaam</label>
                            <Input name="firstName" value={formData.firstName} onChange={handleChange} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Achternaam</label>
                            <Input name="lastName" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                            <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Telefoonnummer</label>
                            <Input name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Rol</label>
                        <Input name="role" value={formData.role} disabled className="capitalize" />
                        {formData.role === 'owner' && (
                            <p className="text-xs text-muted-foreground mt-1">Eigenaren kunnen hun eigen rol niet wijzigen om te voorkomen dat de toegang tot beheerdersfuncties verloren gaat.</p>
                        )}
                    </div>
                    <hr className="my-4"/>
                    <h3 className="text-lg font-semibold">Bedrijfsgegevens</h3>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">BTW-nummer</label>
                        <div className="flex items-center gap-2">
                            <Input name="vatNumber" value={formData.vatNumber} onChange={handleChange} className="flex-1"/>
                             <Button type="button" variant="secondary" onClick={handleVatValidation} disabled={isVatValidating} className="gap-2">
                                {isVatValidating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                                Valideer
                            </Button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Bedrijfsnaam</label>
                        <Input name="companyName" value={formData.companyName} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Adres</label>
                        <Input name="address" value={formData.address} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Postcode</label>
                            <Input name="postalCode" value={formData.postalCode} onChange={handleChange} />
                        </div>
                         <div className="col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Stad</label>
                            <Input name="city" value={formData.city} onChange={handleChange} />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Land</label>
                        <Input name="country" value={formData.country} onChange={handleChange} />
                    </div>
                    
                    <hr className="my-4" />
                    
                    {isChangingPassword ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Wachtwoord Wijzigen</h3>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Huidig Wachtwoord</label>
                                <Input name="current" type="password" value={passwords.current} onChange={handlePasswordChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Nieuw Wachtwoord</label>
                                <Input name="new" type="password" value={passwords.new} onChange={handlePasswordChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Bevestig Nieuw Wachtwoord</label>
                                <Input name="confirm" type="password" value={passwords.confirm} onChange={handlePasswordChange} required />
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-start">
                            <Button type="button" variant="secondary" onClick={() => setIsChangingPassword(true)}>
                                Wijzig Wachtwoord
                            </Button>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                        <Button type="submit">Profiel Opslaan</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};


export const SettingsPage: React.FC = () => {
    const { currentUser, updateUser } = useContext(AppContext);

    if (!currentUser) {
        return <p>Geen gebruiker ingelogd.</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Instellingen</h1>
                <p className="text-muted-foreground">Beheer je account en persoonlijke voorkeuren.</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-8">
                <MyProfileForm user={currentUser} onUpdate={updateUser} />
            </div>
        </div>
    );
};