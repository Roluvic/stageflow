

// FIX: Add Task to import list
import type { User, Venue, Event, Document, Band, Folder, CallSheet, Assignment, UserRole, DocumentType, Task } from '../types';

export const mockBands: Band[] = [
  { id: 'band-1', name: 'Milk Inc.', logoUrl: 'https://i.pravatar.cc/150?u=milkinc', themeColor: '#3B82F6' },
  { id: 'band-2', name: 'Pommelien Thijs', logoUrl: 'https://i.pravatar.cc/150?u=pommelien', themeColor: '#EC4899' },
  { id: 'band-3', name: 'Metejoor', logoUrl: 'https://i.pravatar.cc/150?u=metejoor', themeColor: '#F59E0B' },
];

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Hannes De Wyze', firstName: 'Hannes', lastName: 'De Wyze', email: 'hannes@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=hannes', role: 'owner', password: 'password', bandId: 'band-1', phone: '0477123456', companyName: 'StageFlow BV', vatNumber: 'BE0123456789', address: 'Kerkstraat 1', city: 'Antwerpen', postalCode: '2000', country: 'België', isUser: true },
  { id: 'user-2', name: 'Merel Cappaert', firstName: 'Merel', lastName: 'Cappaert', email: 'merel@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=merel', role: 'artist', password: 'password', bandId: 'band-1', phone: '0477234567', companyName: 'Artist Co', vatNumber: 'BE0987654321', address: 'Molenstraat 5', city: 'Gent', postalCode: '9000', country: 'België', isUser: false },
  { id: 'user-3', name: 'Linda Mertens', firstName: 'Linda', lastName: 'Mertens', email: 'linda@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=linda', role: 'artist', password: 'password', bandId: 'band-1', isUser: true },
  { id: 'user-4', name: 'Regi Penxten', firstName: 'Regi', lastName: 'Penxten', email: 'regi@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=regi', role: 'manager', password: 'password', bandId: 'band-1', phone: '0478276822', isUser: true },
  { id: 'user-5', name: 'Paul-Henri', firstName: 'Paul-Henri', lastName: 'Verstraete', email: 'ph@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=paulhenri', role: 'viewer', password: 'password', bandId: 'band-1', isUser: false },
  { id: 'user-6', name: 'Flor Boey', firstName: 'Flor', lastName: 'Boey', email: 'flor@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=flor', role: 'crew', password: 'password', bandId: 'band-1', phone: '0478376031', isUser: false },
  { id: 'user-7', name: 'Peter Van Eyck', firstName: 'Peter', lastName: 'Van Eyck', email: 'peter@stageflow.be', avatar: 'https://i.pravatar.cc/150?u=peter', role: 'crew', password: 'password', bandId: 'band-1', phone: '0478276822', isUser: false },
];

export const mockVenues: Venue[] = [
  { id: 'venue-1', name: 'Sportpaleis', address: 'Schijnpoortweg 119, 2170 Antwerpen', bandId: 'band-1', lat: 51.230, lng: 4.441 },
  { id: 'venue-2', name: 'Lotto Arena', address: 'Schijnpoortweg 119, 2170 Antwerpen', bandId: 'band-1', lat: 51.229, lng: 4.440 },
  { id: 'venue-3', name: 'Ancienne Belgique', address: 'Anspachlaan 110, 1000 Brussel', bandId: 'band-1', lat: 50.848, lng: 4.347 },
  { id: 'venue-4', name: 'Genk', address: 'Genk, Limburg', bandId: 'band-1', lat: 50.965, lng: 5.500 },
  { id: 'venue-5', name: 'Leuven', address: 'Leuven, Vlaams-Brabant', bandId: 'band-1', lat: 50.879, lng: 4.700 },
  { id: 'venue-6', name: 'Merksplas', address: 'Merksplas, Antwerpen', bandId: 'band-1', lat: 51.359, lng: 4.860 },
  { id: 'venue-7', name: 'Dendermonde', address: 'Dendermonde, Oost-Vlaanderen', bandId: 'band-1', lat: 51.031, lng: 4.100 },
  { id: 'venue-8', name: 'Turnhout', address: 'Turnhout, Antwerpen', bandId: 'band-1', lat: 51.323, lng: 4.945 },
  { id: 'venue-9', name: 'Willebroek', address: 'Willebroek, Antwerpen', bandId: 'band-1', lat: 51.062, lng: 4.360 },
  { id: 'venue-10', name: 'Moen', address: 'Moen, West-Vlaanderen', bandId: 'band-1', lat: 50.757, lng: 3.391 },
  { id: 'venue-11', name: 'Oostende', address: 'Oostende, West-Vlaanderen', bandId: 'band-1', lat: 51.225, lng: 2.914 },
  { id: 'venue-12', name: 'Nieuwpoort', address: 'Nieuwpoort, West-Vlaanderen', bandId: 'band-1', lat: 51.130, lng: 2.751 },
  { id: 'venue-13', name: 'Gent', address: 'Gent, Oost-Vlaanderen', bandId: 'band-1', lat: 51.050, lng: 3.716 },
  { id: 'venue-14', name: 'Kinrooi', address: 'Kinrooi, Limburg', bandId: 'band-1', lat: 51.156, lng: 5.803 },
  { id: 'venue-15', name: 'Zomergem', address: 'Zomergem, Oost-Vlaanderen', bandId: 'band-1', lat: 51.132, lng: 3.585 },
  { id: 'venue-16', name: 'Aalter', address: 'Aalter, Oost-Vlaanderen', bandId: 'band-1', lat: 51.087, lng: 3.447 },
  { id: 'venue-17', name: 'Edegem', address: 'Edegem, Antwerpen', bandId: 'band-1', lat: 51.158, lng: 4.426 },
  { id: 'venue-18', name: 'Beveren', address: 'Beveren, Oost-Vlaanderen', bandId: 'band-1', lat: 51.213, lng: 4.256 },
  { id: 'venue-19', name: 'Brasschaat', address: 'Brasschaat, Antwerpen', bandId: 'band-1', lat: 51.282, lng: 4.489 },
  { id: 'venue-20', name: 'Scherpenheuvel', address: 'Scherpenheuvel, Vlaams-Brabant', bandId: 'band-1', lat: 50.981, lng: 4.975 },
  { id: 'venue-21', name: 'Bergfeest Tessenderlo', address: 'Varode 21, 3980 Tessenderlo-Ham', bandId: 'band-1', lat: 51.068, lng: 5.088 }
];

const createDate = (day: number, month: number, year: number, hour: number, minute: number): Date => new Date(year, month - 1, day, hour, minute);

const createShow = (startDate: Date, durationMinutes: number = 90): { start: Date, end: Date } => ({
    start: startDate,
    end: new Date(startDate.getTime() + durationMinutes * 60000)
});

const getFeeForRole = (role: UserRole): number | undefined => {
    switch (role) {
        case 'owner':
        case 'manager':
        case 'artist':
            return (Math.floor(Math.random() * 13) + 8) * 50; // 400 - 1000
        case 'crew':
            return (Math.floor(Math.random() * 9) + 6) * 25; // 150 - 350
        default:
            return undefined;
    }
};

const populateFees = (assignments: Assignment[]): Assignment[] => {
    return assignments.map(a => {
        if (a.fee) return a;
        const user = mockUsers.find(u => u.id === a.userId);
        return { ...a, fee: user ? getFeeForRole(user.role) : undefined };
    });
};

const generateDummyCallsheet = (eventAssignments: Assignment[], users: User[]): CallSheet => {
    const assignedUsers = eventAssignments
        .map(a => users.find(u => u.id === a.userId))
        .filter((u): u is User => !!u);

    return {
        artistParking: { address: 'Zie backstage ingang', details: 'Aanmelden bij de stagemanager.' },
        loadin: { address: 'Loading dock achter het podium', details: 'Na het lossen, wagens parkeren op de crew parking.' },
        tourManagerId: 'user-6', // Flor Boey
        guests: ['Gast 1', 'Gast 2'],
        timing: [
            { id: 't-1', time: '18:00', description: 'Get in & load-in' },
            { id: 't-2', time: '19:00', description: 'Soundcheck' },
            { id: 't-3', time: '20:00', description: 'Diner' },
            { id: 't-4', time: '21:00', description: 'Showtime' },
            { id: 't-5', time: '22:30', description: 'Einde show' },
        ],
        travelParty: assignedUsers.map(user => ({
            id: `tp-${user.id}`,
            userId: user.id,
            name: user.name,
            role: eventAssignments.find(a => a.userId === user.id)?.role || user.role,
            contact: user.phone,
            callTime: '18:00'
        })),
        contacts: [
            { id: 'c-1', name: 'Lokale Promoter', role: 'Promoter', phone: '0499 12 34 56' },
            { id: 'c-2', name: 'Podium Verantwoordelijke', role: 'Stage Manager', phone: '0488 98 76 54' },
        ],
        dressingRoom: '1 kleedkamer voorzien met drank en handdoeken.',
        catering: 'Warme maaltijd voorzien voor de show. Drank beschikbaar.',
        technical: 'Standaard PA en licht aanwezig. Zie technische rider voor details.',
        technicalRiderIds: ['doc-1'],
        billingInfo: 'Facturatie via One Bookings BV, Bachtekerkstraat 5, 9800 Bachte-Maria-Leerne, BE 0809 259 518'
    };
};

const commonAssignments: Assignment[] = [
    { userId: 'user-3', role: 'Lead Vocals' },
    { userId: 'user-4', role: 'DJ / Manager' },
];

const milkIncBaseAssignments: Assignment[] = [
    { userId: 'user-2', role: 'Backing Vocals' },
    { userId: 'user-3', role: 'Lead Vocals' },
    { userId: 'user-4', role: 'DJ / Manager' },
    { userId: 'user-6', role: 'Crew' },
    { userId: 'user-7', role: 'Crew' },
];

export let mockEvents: Event[] = [
  // 2025
  {
    id: 'evt-milk-1', type: 'show', title: 'Warmste Week', 
    ...createShow(createDate(19, 12, 2025, 20, 0)),
    venueId: 'venue-4', status: 'confirmed',
    assignments: populateFees([ { userId: 'user-2', role: 'Backing Vocals', fee: 400 }, ...commonAssignments ]),
    bandId: 'band-1',
    callSheet: generateDummyCallsheet([ { userId: 'user-2', role: 'Backing Vocals' }, ...commonAssignments ], mockUsers),
  },
  {
    id: 'evt-callsheet-demo', type: 'show', title: 'REGI LIVE @ Bergfeest',
    start: createDate(9, 8, 2025, 22, 30),
    end: new Date(createDate(9, 8, 2025, 22, 30).getTime() + 85 * 60000),
    venueId: 'venue-21', status: 'confirmed',
    assignments: populateFees([
      { userId: 'user-2', role: 'Guest Artist' }, 
      { userId: 'user-3', role: 'Guest Artist' }, 
      { userId: 'user-4', role: 'Artist' }, 
      { userId: 'user-6', role: 'Productiemanager' },
      { userId: 'user-7', role: 'TM/PA Regi' },
    ]),
    bandId: 'band-1',
    callSheet: {
        artistParking: { address: 'Varode 21, 3980 Tessenderlo-Ham', details: 'Parking is voorzien aan de achterzijde van de tent/podium. Controle & toegang via namenlijst bij het oprijden van de locatie.'},
        loadin: { address: 'Varode 21, 3980 Tessenderlo-Ham', details: 'Aan de achterzijde van de tent, op het podium via loading dock. Na het lossen de wagens verplaatsen naar de voorziene parking.'},
        tourManagerId: 'user-6',
        guests: ['Linda', 'Pauline', 'Arno'],
        timing: [
            { id: 'csd-t1', time: '20:00', description: 'get in + load-out REGI LIVE' },
            { id: 'csd-t2', time: '21:00', description: 'diner' },
            { id: 'csd-t3', time: '21:50', description: "change-over + linecheck (40')" },
            { id: 'csd-t4', time: '22:30', description: "start show (85')" },
            { id: 'csd-t5', time: '23:55', description: "change-over (40')" },
        ],
        travelParty: [
            { id: 'csd-tp1', userId: 'user-4', name: 'Regi Penxten', role: 'Artist', callTime: 'on time' },
            { id: 'csd-tp2', userId: 'user-3', name: 'Linda Mertens', role: 'Guest Artist', callTime: '21:30' },
            { id: 'csd-tp3', userId: 'user-2', name: 'Merel Cappaert', role: 'Guest Artist', callTime: '21:30' },
            { id: 'csd-tp4', name: 'Pauline Slangen', role: 'Guest Artist', callTime: '21:30' },
            { id: 'csd-tp5', name: 'Arno Louwette', role: 'Guest Artist', callTime: '21:30' },
            { id: 'csd-tp6', name: 'Peter Schreurs', role: 'Band', contact: '0473 85 57 40', callTime: '21:00' },
            { id: 'csd-tp7', name: 'Michael Schack', role: 'Band', contact: '0477 26 46 58', callTime: '21:00' },
            { id: 'csd-tp8', userId: 'user-7', name: 'Peter Van Eyck', role: 'TM/PA Regi', contact: '0478 27 68 22', callTime: 'on time' },
            { id: 'csd-tp9', userId: 'user-6', name: 'Flor Boey', role: 'Productiemanager', contact: '0478 37 60 31', callTime: '19:45' },
            { id: 'csd-tp10', name: 'Pita Tanghe', role: 'FOH', contact: '0477 58 99 61', callTime: '20:00' },
            { id: 'csd-tp11', name: 'Wim Daans', role: 'Backline', contact: '0486 69 83 93', callTime: '20:00' },
            { id: 'csd-tp12', name: 'Dimi Theuwissen', role: 'LD - Lights', contact: '0475 83 44 15', callTime: '20:00' },
        ],
        contacts: [
            { id: 'csd-c1', name: 'Kurt Vermeyen', role: 'Artist Handling', phone: '0473 27 43 08'},
            { id: 'csd-c2', name: 'Guy Derieuw', role: 'Stage Manager', phone: '0493 78 19 87'},
        ],
        dressingRoom: '3 aparte ruimtes voorzien met pipe & drape',
        catering: 'Standaard drank, snacks, doorlopend buffet koud & warm tussen 17u00 - 22u00',
        technical: 'FSL - info@fslevents.be – 0477/23 80 28',
        technicalRiderIds: ['doc-1', 'doc-3'],
        venueInfo: 'Festivaltent 50 x 32 m, indoor, jaarlijks vierdaags festival, 5000 bezoekers',
        stageInfo: '10 x 8 m, > 6 m clearance, opbouw op rolling risers achter de backdrop 18x4m, monitors 5m x 4m op podium hoogte (stage L&R), ledwall 2m x 3m stage right & left > live captatie, 4 stagehands voorzien',
        lineup: [
            { id: 'csd-l1', time: '15:00', act: 'Deuren open' },
            { id: 'csd-l2', time: '16:00 - 16:50', act: 'Transistor' },
            { id: 'csd-l3', time: '17:25 - 18:25', act: 'Leez' },
            { id: 'csd-l4', time: '18:55 - 19:55', act: 'Aaron Blommaert' },
            { id: 'csd-l5', time: '20:35 - 21:50', act: 'Natalia' },
            { id: 'csd-l6', time: '22:30 - 23:55', act: 'Regi Live ft. Linda & Guests' },
            { id: 'csd-l7', time: '00:35 - 01:55', act: 'Les Truttes' },
        ],
        billingInfo: 'One Bookings BV, Bachtekerkstraat 5, 9800 Bachte-Maria-Leerne, BE 0809 259 518'
    }
  },
];


// Add more events for 2026
const events2026: Event[] = [
  { id: 'evt-milk-2', type: 'show', title: 'Vagebond', ...createShow(createDate(23, 4, 2026, 14, 0)), venueId: 'venue-5', status: 'confirmed', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-3', type: 'show', title: 'Vicaris', ...createShow(createDate(8, 5, 2026, 20, 0)), venueId: 'venue-6', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-4', type: 'show', title: 'Show Dendermonde', ...createShow(createDate(14, 5, 2026, 20, 0)), venueId: 'venue-7', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-5', type: 'show', title: 'Sunrise of Turnhout', ...createShow(createDate(26, 6, 2026, 20, 0)), venueId: 'venue-8', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-6', type: 'show', title: 'Show Willebroek', ...createShow(createDate(27, 6, 2026, 20, 0)), venueId: 'venue-9', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-7', type: 'show', title: 'Moen Feest', ...createShow(createDate(3, 7, 2026, 20, 0)), venueId: 'venue-10', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-8', type: 'show', title: 'Summerlove', ...createShow(createDate(4, 7, 2026, 20, 0)), venueId: 'venue-11', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-9', type: 'show', title: 'Beach festival', ...createShow(createDate(18, 7, 2026, 20, 0)), venueId: 'venue-12', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-10', type: 'show', title: 'Gentse Feesten', ...createShow(createDate(26, 7, 2026, 20, 0)), venueId: 'venue-13', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-11', type: 'show', title: 'Summer Sessions', ...createShow(createDate(31, 7, 2026, 20, 0)), venueId: 'venue-8', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-12', type: 'show', title: 'Bastionfestival', ...createShow(createDate(8, 8, 2026, 20, 0)), venueId: 'venue-14', status: 'confirmed', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-13', type: 'show', title: 'Rivers Festival', ...createShow(createDate(14, 8, 2026, 20, 0)), venueId: 'venue-15', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-14', type: 'show', title: 'Show Aalter', ...createShow(createDate(21, 8, 2026, 20, 0)), venueId: 'venue-16', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-15', type: 'show', title: 'Fairway Festival', ...createShow(createDate(22, 8, 2026, 20, 0)), venueId: 'venue-17', status: 'confirmed', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-16', type: 'show', title: 'Beveren Buiten', ...createShow(createDate(28, 8, 2026, 20, 0)), venueId: 'venue-18', status: 'confirmed', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-17', type: 'show', title: 'Show Brasschaat', ...createShow(createDate(29, 8, 2026, 20, 0)), venueId: 'venue-19', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-18', type: 'show', title: 'Loforlife', ...createShow(createDate(19, 9, 2026, 20, 0)), venueId: 'venue-20', status: 'draft', assignments: milkIncBaseAssignments, bandId: 'band-1' },
  { id: 'evt-milk-19', type: 'show', title: 'Sportpaleis', ...createShow(createDate(24, 10, 2026, 20, 0)), venueId: 'venue-1', status: 'confirmed', assignments: milkIncBaseAssignments, bandId: 'band-1' },
];

// Process all 2026 events to add fees and callsheets
const processedEvents2026 = events2026.map(event => {
    const assignmentsWithFees = populateFees(event.assignments);
    return {
        ...event,
        assignments: assignmentsWithFees,
        callSheet: generateDummyCallsheet(assignmentsWithFees, mockUsers),
    };
});

mockEvents.push(...processedEvents2026);

// FIX: Added mockTasks to resolve import error.
export const mockTasks: Task[] = [
    { id: 'task-1', title: 'Nieuwe setlist voorbereiden voor zomer 2026', status: 'todo', assignedTo: 'user-4', bandId: 'band-1' },
    { id: 'task-2', title: 'Tech rider updaten', status: 'done', assignedTo: 'user-6', bandId: 'band-1' },
    { id: 'task-3', title: 'Contact opnemen met Sportpaleis voor productie details', status: 'todo', assignedTo: 'user-4', bandId: 'band-1' },
];

export const mockFolders: Folder[] = [
    { id: 'folder-1', name: 'Contracten Artiesten', bandId: 'band-1' },
    { id: 'folder-2', name: 'Contracten Leveranciers', bandId: 'band-1' },
    { id: 'folder-3', name: 'Productie 2026', bandId: 'band-1' },
    { id: 'folder-4', name: 'Technische Riders', bandId: 'band-1' },
    { id: 'folder-5', name: 'Setlists', bandId: 'band-1' },
];

export const mockDocuments: Document[] = [
    { id: 'doc-1', title: 'Tech Rider - Zomer 2026', url: '#', type: 'tech-rider', bandId: 'band-1', folderId: 'folder-4' },
    { id: 'doc-2', title: 'Contract Merel Cappaert 2026', url: '#', type: 'contract-artist', bandId: 'band-1', folderId: 'folder-1' },
    { id: 'doc-3', title: 'Setlist Zomer 2026 v1.0', url: '#', type: 'setlist', bandId: 'band-1', folderId: 'folder-5' },
    { id: 'doc-4', title: 'PA Firma XYZ Contract', url: '#', type: 'contract-supplier', bandId: 'band-1', folderId: 'folder-2' },
    { id: 'doc-5', title: 'Callsheet - REGI LIVE @ Bergfeest', url: '#', type: 'callsheet', bandId: 'band-1', folderId: 'folder-3' },
];
