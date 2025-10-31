
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../App';
import { Button } from '../../components/ui/Button';
import { Plus, Edit, Trash2, FileText, ExternalLink, Folder as FolderIcon, FolderPlus } from 'lucide-react';
import type { Document, Folder, DocumentType } from '../../types';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

const FolderForm: React.FC<{ folder?: Folder | null, onSave: (name: string, id?: string) => void, onCancel: () => void }> = ({ folder, onSave, onCancel }) => {
    const [name, setName] = useState(folder?.name || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name, folder?.id);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Naam van de map" />
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Opslaan</Button>
            </div>
        </form>
    );
}

const DocumentForm: React.FC<{ doc?: Document | null, folders: Folder[], onSave: (doc: Omit<Document, 'id' | 'bandId'> | Document) => void, onCancel: () => void }> = ({ doc, folders, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: doc?.title || '',
        url: doc?.url || '',
        type: doc?.type || 'other' as DocumentType,
        folderId: doc?.folderId || (folders.length > 0 ? folders[0].id : ''),
    });
    const [fileName, setFileName] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                // Pre-fill title with filename if title is empty
                const titleWithoutExtension = file.name.split('.').slice(0, -1).join('.');
                setFormData(prev => ({
                    ...prev,
                    url: dataUrl,
                    title: prev.title || titleWithoutExtension,
                }));
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.folderId) {
            alert("Selecteer een map.");
            return;
        }
        if (!doc && !formData.url) {
            alert("Selecteer een bestand om te uploaden.");
            return;
        }
        if (doc) onSave({ ...doc, ...formData });
        else onSave(formData);
    };

    const documentTypes: { value: DocumentType; label: string }[] = [
        { value: 'contract-artist', label: 'Contract (Artiest)'},
        { value: 'contract-supplier', label: 'Contract (Leverancier)'},
        { value: 'setlist', label: 'Setlist'},
        { value: 'tech-rider', label: 'Tech Rider'},
        { value: 'callsheet', label: 'Callsheet'},
        { value: 'other', label: 'Overig'},
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Titel Document</label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="file" className="block text-sm font-medium text-muted-foreground mb-1">Bestand</label>
                <Input id="file" name="file" type="file" onChange={handleFileChange} required={!doc} />
                {fileName && <p className="text-sm text-muted-foreground mt-1">Geselecteerd: {fileName}</p>}
                {doc?.url && !fileName && (
                    <p className="text-sm text-muted-foreground mt-1">Huidig bestand blijft behouden. Kies een nieuw bestand om het te vervangen.</p>
                )}
            </div>
            <div>
                <label htmlFor="folderId" className="block text-sm font-medium text-muted-foreground mb-1">Map</label>
                <select id="folderId" name="folderId" value={formData.folderId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="" disabled>Kies een map...</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   {documentTypes.map(dt => (
                       <option key={dt.value} value={dt.value}>{dt.label}</option>
                   ))}
                </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuleren</Button>
                <Button type="submit">Opslaan</Button>
            </div>
        </form>
    );
};

export const DocumentsPage: React.FC = () => {
    const { documents, folders, addDocument, updateDocument, deleteDocument, addFolder, updateFolder, deleteFolder } = useContext(AppContext);
    
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    
    const [docModal, setDocModal] = useState<{ open: boolean, doc: Document | null }>({ open: false, doc: null });
    const [folderModal, setFolderModal] = useState<{ open: boolean, folder: Folder | null }>({ open: false, folder: null });

    const visibleDocuments = useMemo(() => {
        return documents.filter(d => d.folderId === selectedFolderId);
    }, [documents, selectedFolderId]);

    // Effect to robustly handle folder selection
    React.useEffect(() => {
        const folderExists = folders.some(f => f.id === selectedFolderId);
        if (!folderExists) {
            setSelectedFolderId(folders.length > 0 ? folders[0].id : null);
        }
    }, [folders, selectedFolderId]);


    const handleSaveDoc = (docData: Omit<Document, 'id' | 'bandId'> | Document) => {
      if ('id' in docData) updateDocument(docData);
      else addDocument(docData);
      setDocModal({ open: false, doc: null });
    };

    const handleDeleteDoc = (docId: string) => {
      if (window.confirm("Weet je zeker dat je dit document wilt verwijderen?")) deleteDocument(docId);
    };

    const handleSaveFolder = (name: string, id?: string) => {
        if (id) updateFolder({ id, name, bandId: '' }); // bandId is not needed for update, but satisfies type
        else addFolder(name);
        setFolderModal({ open: false, folder: null });
    }

    const handleDeleteFolder = (folderId: string) => {
        if (window.confirm("Weet je zeker dat je deze map wilt verwijderen?")) {
            deleteFolder(folderId);
        }
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documenten</h1>
            <p className="text-muted-foreground">Beheer contracten, riders, setlists en meer.</p>
          </div>
          <Button className="gap-2" onClick={() => setDocModal({ open: true, doc: null })} disabled={folders.length === 0}>
            <Plus className="h-5 w-5" />
            Nieuw Document
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
                <Card className="rounded-2xl">
                    <CardContent className="p-3">
                        <Button className="w-full gap-2 mb-2" variant="secondary" onClick={() => setFolderModal({ open: true, folder: null })}>
                            <FolderPlus className="h-5 w-5" /> Nieuwe Map
                        </Button>
                        <div className="space-y-1">
                        {folders.map(folder => (
                            <div key={folder.id} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer ${selectedFolderId === folder.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setSelectedFolderId(folder.id)}>
                                <div className="flex items-center gap-2">
                                    <FolderIcon className="h-5 w-5" />
                                    <span className="font-medium">{folder.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setFolderModal({ open: true, folder })}}><Edit className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id)}}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                <Card className="rounded-2xl">
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {visibleDocuments.map(doc => (
                                <div key={doc.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <FileText className="h-6 w-6 text-primary" />
                                    <div>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.title} className="font-medium hover:underline flex items-center gap-1.5">
                                        {doc.title} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                        </a>
                                        <p className="text-sm text-muted-foreground capitalize">{doc.type.replace('-', ' ')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setDocModal({ open: true, doc })}><Edit className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteDoc(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                </div>
                            ))}
                            {visibleDocuments.length === 0 && (
                                <p className="text-center text-muted-foreground p-8">
                                    {folders.length === 0 ? 'Maak eerst een map aan.' : 'Geen documenten in deze map.'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Dialog isOpen={docModal.open} onClose={() => setDocModal({ open: false, doc: null })} title={docModal.doc ? 'Document Bewerken' : 'Nieuw Document'}>
            <DocumentForm doc={docModal.doc} folders={folders} onSave={handleSaveDoc} onCancel={() => setDocModal({ open: false, doc: null })} />
        </Dialog>
        <Dialog isOpen={folderModal.open} onClose={() => setFolderModal({ open: false, folder: null })} title={folderModal.folder ? 'Map Bewerken' : 'Nieuwe Map'}>
            <FolderForm folder={folderModal.folder} onSave={handleSaveFolder} onCancel={() => setFolderModal({ open: false, folder: null })} />
        </Dialog>
      </div>
    );
  };
