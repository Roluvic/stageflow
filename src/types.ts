

export type UserRole = 'owner' | 'manager' | 'artist' | 'crew' | 'viewer';

export interface Band {
  id: string;
  name: string;
  logoUrl?: string;
  themeColor?: string; // e.g., a hex color like '#4A90E2'
}

export interface User {
  id: string;
  name: string; // This will be a derived full name (firstName + lastName)
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  role: UserRole;
  password?: string;
  bandId?: string;
  phone?: string;
  companyName?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isUser?: boolean; // Flag to indicate if the person has a login
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  bandId: string;
  lat?: number;
  lng?: number;
}

export type EventType = 'show' | 'rehearsal' | 'meeting';
export type EventStatus = 'draft' | 'confirmed' | 'canceled';

export interface Assignment {
  userId: string;
  role: string;
  fee?: number;
}

export interface CallSheetTimingItem {
    id: string;
    time: string;
    description: string;
}

export interface CallSheetTravelPartyItem {
    id: string;
    userId?: string;
    name: string;
    role: string;
    contact?: string;
    callTime: string;
}

export interface CallSheetContactItem {
    id: string;
    name: string;
    role: string;
    phone: string;
}

export interface CallSheetLineupItem {
    id: string;
    time: string;
    act: string;
}

export interface CallSheet {
    artistParking?: { address: string; details: string; };
    loadin?: { address: string; details: string; };
    tourManagerId?: string;
    guests?: string[];
    timing?: CallSheetTimingItem[];
    travelParty?: CallSheetTravelPartyItem[];
    contacts?: CallSheetContactItem[];
    dressingRoom?: string;
    catering?: string;
    technical?: string;
    technicalRiderIds?: string[];
    venueInfo?: string;
    stageInfo?: string;
    lineup?: CallSheetLineupItem[];
    billingInfo?: string;
}


export interface Event {
  id:string;
  type: EventType;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  venueId: string;
  status: EventStatus;
  assignments: Assignment[];
  tags?: string[];
  bandId: string;
  callSheet?: CallSheet;
}

export interface Folder {
    id: string;
    name: string;
    bandId: string;
}

export type DocumentType = 
    'contract-artist' | 
    'contract-supplier' | 
    'setlist' | 
    'tech-rider' | 
    'callsheet' | 
    'other';

export interface Document {
    id: string;
    title: string;
    url: string;
    type: DocumentType;
    bandId: string; 
    folderId: string; 
}

// FIX: Added Task interface to resolve import error.
export interface Task {
    id: string;
    title: string;
    status: 'todo' | 'done';
    assignedTo?: string; // userId
    bandId: string;
}
