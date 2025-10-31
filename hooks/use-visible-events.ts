import { useMemo, useContext } from 'react';
import { AppContext } from '../App';
import type { Event } from '../types';

/**
 * Custom hook to get events filtered based on the current user's role.
 * Owners and managers can see all events. Other roles see only their assigned events.
 */
export function useVisibleEvents(): Event[] {
  const { events, currentUser } = useContext(AppContext);

  const visibleEvents = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    
    const canViewAll = ['owner', 'manager'].includes(currentUser.role);
    if (canViewAll) {
      return events;
    }
    
    return events.filter(event => 
      event.assignments.some(a => a.userId === currentUser.id)
    );
  }, [events, currentUser]);

  return visibleEvents;
}
