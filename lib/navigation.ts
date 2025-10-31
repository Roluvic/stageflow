import { Calendar, Home, Users, FileText, Settings, DollarSign, Briefcase } from 'lucide-react';

export const mainNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['owner', 'manager', 'artist', 'crew', 'viewer'] },
    { to: '/calendar', label: 'Kalender', icon: Calendar, roles: ['owner', 'manager', 'artist', 'crew', 'viewer'] },
    { to: '/persons', label: 'Personen', icon: Users, roles: ['owner', 'manager'] },
    { to: '/documents', label: 'Documenten', icon: FileText, roles: ['owner', 'manager'] },
    { to: '/finances', label: 'Financiën', icon: DollarSign, roles: ['owner', 'manager'] },
    { to: '/bands', label: 'Band Management', icon: Briefcase, roles: ['owner', 'manager'] },
];

export const footerNavItems = [
    { to: '/settings', label: 'Instellingen', icon: Settings, roles: ['owner', 'manager', 'artist', 'crew', 'viewer'] },
];

export const allNavItems = [...mainNavItems, ...footerNavItems];
