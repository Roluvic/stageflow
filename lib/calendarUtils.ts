import type { Event, User, Venue } from '../types';

// Function to format a date into the required UTC format for iCal (YYYYMMDDTHHMMSSZ)
const toIcsDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Function to escape special characters in iCal strings
const escapeIcsString = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
};

// Simplified: users and venues are not available here, so we'll create a simpler description.
export function exportToIcs(events: Event[]): string {
  let icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StageFlow//Event Calendar//NL',
    'CALSCALE:GREGORIAN',
  ].join('\r\n');

  for (const event of events) {
    const descriptionParts = [];
    if (event.description) descriptionParts.push(event.description);
    descriptionParts.push(`Type: ${event.type}`);
    
    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${event.id}@stageflow.app`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(event.start)}`,
      `DTEND:${toIcsDate(event.end)}`,
      `SUMMARY:${escapeIcsString(event.title)}`,
      // `LOCATION` and detailed `DESCRIPTION` are omitted as we don't pass venues/users anymore.
      `DESCRIPTION:${escapeIcsString(descriptionParts.join('\\n'))}`,
      `STATUS:${event.status === 'confirmed' ? 'CONFIRMED' : event.status === 'canceled' ? 'CANCELLED' : 'TENTATIVE'}`,
      'END:VEVENT',
    ];

    icsString += '\r\n' + eventLines.join('\r\n');
  }

  icsString += '\r\n' + 'END:VCALENDAR';

  return icsString;
}