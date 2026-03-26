export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateICS(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LandlordBot AI//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const event of events) {
    const end = event.endDate || new Date(event.startDate.getTime() + 86400000);
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@landlordbot`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(events: CalendarEvent[], filename = 'landlordbot.ics'): void {
  const blob = new Blob([generateICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportLeaseCalendar(
  leases: Array<{
    tenantName?: string;
    unitNumber: string;
    endDate: string;
    rentAmount: number;
  }>
): void {
  downloadICS(
    leases.map((l) => ({
      title: `Lease Expiry — Unit ${l.unitNumber}`,
      description: `Tenant: ${l.tenantName || 'Unknown'} | Rent: $${l.rentAmount}/mo`,
      startDate: new Date(l.endDate),
    })),
    'lease-calendar.ics'
  );
}
