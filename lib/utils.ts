import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

export const getWeekStart = (date: Date = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
};

export const getWeekEnd = (date: Date = new Date()): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const generateTimeBlocks = (
  startTime: string = '06:00',
  endTime: string = '22:00',
  intervalMinutes: number = 30
): Array<{ time: string; label: string }> => {
  const blocks: Array<{ time: string; label: string }> = [];
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);

  let currentHour = start.hours;
  let currentMinute = start.minutes;

  while (
    currentHour < end.hours ||
    (currentHour === end.hours && currentMinute <= end.minutes)
  ) {
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute
      .toString()
      .padStart(2, '0')}`;
    const hour12 = currentHour % 12 || 12;
    const ampm = currentHour >= 12 ? 'PM' : 'AM';
    const label = `${hour12}:${currentMinute.toString().padStart(2, '0')} ${ampm}`;

    blocks.push({ time: timeStr, label });

    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return blocks;
};
