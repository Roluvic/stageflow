
import type { Event } from '../types';

/**
 * Checks if two events have a scheduling conflict.
 * A conflict occurs if the events have overlapping times AND
 * either share the same venue OR involve at least one of the same people.
 * @param eventA The first event.
 * @param eventB The second event.
 * @returns True if there is a conflict, otherwise false.
 */
export const isConflict = (eventA: Event, eventB: Event): boolean => {
  // 1. Check for time overlap
  const hasTimeOverlap = eventA.start < eventB.end && eventA.end > eventB.start;
  if (!hasTimeOverlap) {
    return false;
  }

  // 2. Check for same venue
  const hasVenueConflict = eventA.venueId === eventB.venueId;
  if (hasVenueConflict) {
    return true;
  }

  // 3. Check for shared people
  const peopleA = new Set(eventA.assignments.map(a => a.userId));
  const peopleB = new Set(eventB.assignments.map(a => a.userId));
  
  for (const personId of peopleA) {
    if (peopleB.has(personId)) {
      return true; // Found a shared person
    }
  }

  return false;
};
