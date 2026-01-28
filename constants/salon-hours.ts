/** Salon operating hours (local time). */
export const SALON_OPEN_HOUR = 7;
export const SALON_CLOSE_HOUR = 21;

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Appointment start must be in [7:00, 21:00); cannot start at or after 21:00. */
export function isWithinSalonHoursForAppointment(d: Date): boolean {
  const m = minutesSinceMidnight(d);
  return m >= SALON_OPEN_HOUR * 60 && m < SALON_CLOSE_HOUR * 60;
}

/** Work schedule start/end must be in [7:00, 21:00] (inclusive). */
export function isWithinSalonHoursForSchedule(d: Date): boolean {
  const m = minutesSinceMidnight(d);
  return m >= SALON_OPEN_HOUR * 60 && m <= SALON_CLOSE_HOUR * 60;
}

export function formatSalonHours(): string {
  return `${SALON_OPEN_HOUR}:00 - ${SALON_CLOSE_HOUR}:00`;
}
