import { format, formatDistanceToNow, isToday, isTomorrow, differenceInMinutes, differenceInHours } from 'date-fns';

export function formatMoveTime(startsAt: string): string {
  const date = new Date(startsAt);
  const now = new Date();
  const minutesUntil = differenceInMinutes(date, now);
  const hoursUntil = differenceInHours(date, now);

  if (minutesUntil < 0 && minutesUntil > -60) return 'Happening now';
  if (minutesUntil >= 0 && minutesUntil < 60) return `In ${minutesUntil}m`;
  if (hoursUntil >= 1 && hoursUntil < 3) return `In ${hoursUntil}h`;
  if (isToday(date)) return `Tonight at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, "EEE, MMM d 'at' h:mm a");
}

export function formatMoveDuration(startsAt: string, endsAt: string | null): string {
  if (!endsAt) return '';
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const hours = differenceInHours(end, start);
  const minutes = differenceInMinutes(end, start) % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), "EEEE, MMMM d 'at' h:mm a");
}

export function isMoveHappeningNow(startsAt: string, endsAt: string | null): boolean {
  const now = new Date();
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;

  if (end) return now >= start && now <= end;
  return Math.abs(differenceInMinutes(now, start)) < 30;
}

export function getMoveUrgency(startsAt: string): 'now' | 'soon' | 'today' | 'future' {
  const minutesUntil = differenceInMinutes(new Date(startsAt), new Date());
  if (minutesUntil < 0) return 'now';
  if (minutesUntil < 120) return 'soon';
  if (isToday(new Date(startsAt))) return 'today';
  return 'future';
}
