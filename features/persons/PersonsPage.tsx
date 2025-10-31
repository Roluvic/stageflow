import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../../App';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Edit, Trash2, Check, Loader2, Send, ShieldCheck, UserX, Upload, UserPlus, Building } from 'lucide-react';
import type { User, UserRole } from '../../types';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { getCompanyDetailsByVat } from '../../services/geminiService';

const PersonForm: React.FC<{ person?: User | null, onSave: (person: Omit<User, 'id' | 'bandId'> | User) => void, onCancel: () => void, isOwner: boolean, currentUser: User | null }> = ({ person, onSave, onCancel, isOwner, currentUser }) => {
    const { toast } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: person?.name || '',
        firstName: person?.firstName || '',
        lastName: person?.lastName || '',
        email: person?.email || '',
        avatar: person?.avatar || '',
        role: person?.role || 'artist' as UserRole,
        phone: person?.phone || '',
        companyName: person?.companyName || '',
        contactType: person?.contactType || 'person' as 'person' | 'company',
        vatNumber: person?.vatNumber || '',
        address: person?.address || '',
        city: person?.city || '',
        postalCode: person?.postalCode || '',
        country: person?.country || '',
        isUser: person?.isUser || false,
    });
    
    const [isVatValidating, setIsVatValidating] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(person?.avatar || '');
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const roleOptions: { value: UserRole; label: string }[] = [
      { value: 'owner', label: 'Owner' },
      { value: 'manager', label: 'Manager' },
      { value: 'artist', label: 'Artist' },
      { value: 'crew', label: 'Crew' },
      { value: 'viewer', label: 'Viewer' },
    ];

    const availableRoles = isOwner ? roleOptions : roleOptions.filter(role => role.value !== 'owner');
    const isEditingSelfAsOwner = person?.id === currentUser?.id && currentUser?.role === 'owner';


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({...prev, [name]: checked}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

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

        if (isChangingPassword) {
            if (newPassword !== confirmPassword) {
                toast({ title: "Fout", description: "Wachtwoorden komen niet overeen.", variant: "destructive" });
                return;
            }
            if (newPassword.length < 6) { 
                toast({ title: "Fout", description: "Wachtwoord moet minstens 6 tekens lang zijn.", variant: "destructive" });
                return;
            }
        }
        
        const name = formData.contactType === 'person' 
            ? `${formData.firstName} ${formData.lastName}`.trim()
            : formData.name;

        const finalData = { 
            ...formData, 
            avatar: avatarPreview, 
            name,
            firstName: formData.contactType === 'company' ? name : formData.firstName,
            lastName: formData.contactType === 'company' ? '' : formData.lastName,
            companyName: formData.contactType === 'company' ? name : formData.companyName,
        };

        if (person) {
            const dataToSave: User = { ...person, ...finalData };
            if (isChangingPassword && newPassword) {
                dataToSave.password = newPassword;
            }
            onSave(dataToSave);
        } else {
            const dataToSave: Omit<User, 'id' | 'bandId'> = { ...finalData, password: 'password' }; // Set default password
             if (isChangingPassword && newPassword) {
                 dataToSave.password = newPassword;
            }
            onSave(dataToSave);
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
                    name: prev.contactType === 'company' ? details.companyName : prev.name,
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
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 -m-1">
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Contact Type</label>
                 <select name="contactType" value={formData.contactType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="person">Persoon</option>
                    <option value="company">Bedrijf</option>
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Avatar</label>
                <div className="flex items-center gap-4">
                    <Avatar src={avatarPreview} firstName={formData.firstName} lastName={formData.lastName} className="h-16 w-16" isCompany={formData.contactType === 'company'} />
                    <Input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" ref={avatarInputRef} />
                    <div className="flex flex-col gap-2">
                        <Button type="button" variant="secondary" onClick={() => avatarInputRef.current?.click()} className="gap-2">
                            <Upload className="h-4 w-4" />
                            Wijzig foto
                        </Button>
                        {avatarPreview && (
                             <Button type="button" variant="ghost" onClick={() => setAvatarPreview('')} className="gap-2 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Verwijder foto
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {formData.contactType === 'person' ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Voornaam</label>
                        <Input name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Achternaam</label>
                        <Input name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                </div>
            ) : (
                 <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Bedrijfsnaam</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required />
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
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
                <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange} 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isEditingSelfAsOwner}
                    title={isEditingSelfAsOwner ? "Eigenaren kunnen hun eigen rol niet wijzigen." : ""}
                >
                    {availableRoles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                </select>
                {isEditingSelfAsOwner && (
                    <p className="text-xs text-muted-foreground mt-1">Eigenaren kunnen hun eigen rol niet wijzigen om te voorkomen dat de toegang tot beheerdersfuncties verloren gaat.</p>
                )}
            </div>
            {isOwner && (
                <div>
                    <label className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                            <p className="font-medium">Login Toegang</p>
                            <p className="text-sm text-muted-foreground">Laat deze persoon inloggen op StageFlow.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="isUser" checked={formData.isUser} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </label>
                </div>
            )}
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
                <label className="block text-sm font-medium text-muted-foreground mb-1">Bedrijfsnaam (indien afwijkend)</label>
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

            {isChangingPassword && (
                <div className="p-4 bg-muted rounded-lg space-y-2 my-4">
                    <h4 className="font-semibold">Nieuw wachtwoord instellen</h4>
                    <Input type="password" placeholder="Nieuw wachtwoord" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <Input type="password" placeholder="Bevestig wachtwoord" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
            )}
            
            <div className="flex justify-between items-center gap-2 pt-4">
                <div>
                    {person && isOwner && person.isUser && (
                         <Button type="button" variant="destructive" onClick={() => setIsChangingPassword(p => !p)}>
                            {isChangingPassword ? 'Annuleer Wachtwoord Wijziging' : 'Wijzig Wachtwoord'}
                         </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                    <Button type="submit">Opslaan</Button>
                </div>
            </div>
        </form>
    )
};

const PersonCard: React.FC<{ person: User, onEdit: () => void, onDelete: () => void, onActivate: () => void, onDeactivate: () => void, canManage: boolean }> = ({ person, onEdit, onDelete, onActivate, onDeactivate, canManage }) => (
    <Card onClick={onEdit} className="cursor-pointer rounded-xl overflow-hidden transition-shadow hover:shadow-lg relative group">
        <CardContent className="p-4 flex items-center gap-4">
            <div className="relative flex-shrink-0">
                <Avatar src={person.avatar} firstName={person.firstName} lastName={person.lastName} className="h-16 w-16 text-xl" isCompany={person.contactType === 'company'} />
                {person.isUser && (
                    <ShieldCheck className="absolute top-0 left-0 h-5 w-5 text-green-500 bg-card p-0.5 rounded-full" title="Actieve gebruiker" />
                )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
                <p className="font-bold text-lg truncate flex items-center gap-2">{person.name} {person.contactType === 'company' && <Building className="h-4 w-4 text-muted-foreground" />}</p>
                <p className="text-muted-foreground capitalize">{person.role}</p>
                <p className="text-sm text-primary mt-1 truncate">{person.email}</p>
            </div>
            {canManage && (
                <div className="flex flex-col sm:flex-row items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {person.isUser ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-card shadow-sm text-amber-600 hover:bg-amber-100 hover:text-amber-700" onClick={(e) => { e.stopPropagation(); onDeactivate(); }} title="Toegang intrekken">
                            <UserX className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-card shadow-sm text-green-600 hover:bg-green-100 hover:text-green-700" onClick={(e) => { e.stopPropagation(); onActivate(); }} title="Toegang verlenen">
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    )}
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Bewerken"><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Verwijderen"><Trash2 className="h-4 w-4" /></Button>
                </div>
            )}
        </CardContent>
    </Card>
);

export const PersonsPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, toast } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<User | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: 'activate' | 'deactivate' | 'delete', user: User, onConfirm: () => void } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = (person?: User) => {
    setEditingPerson(person || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingPerson(null);
    setIsModalOpen(false);
  };

  const handleSave = (personData: Omit<User, 'id' | 'bandId'> | User) => {
    if ('id' in personData) {
        updateUser(personData);
    } else {
        addUser({password: 'password', ...personData});
    }
    handleCloseModal();
  };

  const handleDelete = (user: User) => {
    setConfirmation({
        type: 'delete',
        user,
        onConfirm: () => {
            deleteUser(user.id);
            setConfirmation(null);
        }
    });
  };

  const handleActivate = (user: User) => {
    setConfirmation({
        type: 'activate',
        user,
        onConfirm: () => {
            updateUser({ ...user, isUser: true });
            setConfirmation(null);
        }
    });
  };

  const handleDeactivate = (user: User) => {
      setConfirmation({
          type: 'deactivate',
          user,
          onConfirm: () => {
              updateUser({ ...user, isUser: false });
              setConfirmation(null);
          }
      });
  };
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        // This is a simulation. A real implementation would parse the CSV file.
        const newUsers = [
            { firstName: 'Nieuwe', lastName: 'Artiest', email: 'artiest@stageflow.be', role: 'artist' as UserRole, avatar: '', password: 'password', name: 'Nieuwe Artiest' },
            { firstName: 'Technicus', lastName: 'Een', email: 'tech1@stageflow.be', role: 'crew' as UserRole, avatar: '', password: 'password', name: 'Technicus Een' }
        ];
        newUsers.forEach(user => addUser(user));
        toast({ title: 'Import Succesvol', description: `${newUsers.length} nieuwe personen zijn toegevoegd.` });
        e.target.value = ''; // Reset file input
    }
  };

  const isOwner = currentUser?.role === 'owner';

  const getConfirmationDetails = () => {
    if (!confirmation) return { title: '', description: '', buttonText: '' };
    switch (confirmation.type) {
      case 'activate': return { title: 'Toegang Verlenen?', description: `Weet je zeker dat je ${confirmation.user.name} toegang wilt geven tot StageFlow?`, buttonText: 'Verleen Toegang' };
      case 'deactivate': return { title: 'Toegang Intrekken?', description: `Weet je zeker dat je de toegang voor ${confirmation.user.name} tot StageFlow wilt intrekken?`, buttonText: 'Trek Toegang In' };
      case 'delete': return { title: 'Persoon Verwijderen?', description: `Weet je zeker dat je ${confirmation.user.name} permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`, buttonText: 'Verwijder' };
      default: return { title: '', description: '', buttonText: '' };
    }
  };

  const confirmationDetails = getConfirmationDetails();


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Personen</h1>
          <p className="text-muted-foreground">Beheer artiesten, crew en andere teamleden.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={handleImportClick}>
                <Upload className="h-4 w-4" />
                Importeer
            </Button>
            <input type="file" ref={importInputRef} onChange={handleImportFile} className="hidden" accept=".csv" />
            <Button className="gap-2 flex-1 sm:flex-none" onClick={() => handleOpenModal()}>
                <Plus className="h-5 w-5" />
                Nieuwe Persoon
            </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.sort((a,b) => (a.contactType === 'company' ? -1 : 1) - (b.contactType === 'company' ? -1 : 1) || a.name.localeCompare(b.name)).map(user => (
          <PersonCard 
            key={user.id} 
            person={user} 
            onEdit={() => handleOpenModal(user)} 
            onDelete={() => handleDelete(user)}
            onActivate={() => handleActivate(user)}
            onDeactivate={() => handleDeactivate(user)}
            canManage={isOwner && user.id !== currentUser?.id}
            />
        ))}
      </div>

      <Dialog isOpen={isModalOpen} onClose={handleCloseModal} title={editingPerson ? 'Contact Bewerken' : 'Nieuw Contact Toevoegen'}>
        <PersonForm
          person={editingPerson}
          onSave={handleSave}
          onCancel={handleCloseModal}
          isOwner={isOwner}
          currentUser={currentUser}
        />
      </Dialog>

      {confirmation && (
        <Dialog 
            isOpen={!!confirmation} 
            onClose={() => setConfirmation(null)} 
            title={confirmationDetails.title}
        >
            <div>
                <p className="text-muted-foreground">
                   {confirmationDetails.description}
                </p>
                <div className="flex justify-end gap-2 pt-6">
                    <Button variant="ghost" onClick={() => setConfirmation(null)}>Annuleren</Button>
                    <Button 
                        variant={confirmation.type === 'delete' || confirmation.type === 'deactivate' ? 'destructive' : 'default'} 
                        onClick={confirmation.onConfirm}
                    >
                        {confirmationDetails.buttonText}
                    </Button>
                </div>
            </div>
        </Dialog>
    )}
    </div>
  );
};