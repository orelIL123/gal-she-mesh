/**
 * Scheduling system constants
 * All time slot calculations and validations should use these constants
 */

// Global slot size in minutes - all scheduling is based on this grid
export const SLOT_SIZE_MINUTES = 25;

// Time grid points (in minutes from start of hour)
export const TIME_GRID_POINTS = [0, 25, 50]; // HH:00, HH:25, HH:50

// Helper function to snap time to the nearest 25-minute grid point
export const snapToGrid = (date: Date): Date => {
  const minutes = date.getMinutes();
  const hours = date.getHours();
  
  // Find the closest grid point
  let snappedMinutes = 0;
  if (minutes <= 12) {
    snappedMinutes = 0;
  } else if (minutes <= 37) {
    snappedMinutes = 25;
  } else if (minutes <= 62) {
    snappedMinutes = 50;
  } else {
    snappedMinutes = 75;
  }
  
  const snappedDate = new Date(date);
  if (snappedMinutes === 75) {
    snappedDate.setHours(hours + 1, 15, 0, 0);
  } else {
    snappedDate.setMinutes(snappedMinutes, 0, 0);
  }
  
  return snappedDate;
};

// Helper function to check if a duration is valid (multiple of 25 minutes)
export const isValidDuration = (durationMinutes: number): boolean => {
  return durationMinutes > 0 && durationMinutes % SLOT_SIZE_MINUTES === 0;
};

// Helper function to get the number of slots needed for a duration
export const getSlotsNeeded = (durationMinutes: number): number => {
  return Math.ceil(durationMinutes / SLOT_SIZE_MINUTES);
};

// Helper function to generate time slots for a given time range
export const generateTimeSlots = (startHour: number, endHour: number): string[] => {
  const slots: string[] = [];
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;
  
  // Find the first 25-minute boundary at or after startHour
  const firstSlotMinutes = Math.ceil(dayStartMinutes / SLOT_SIZE_MINUTES) * SLOT_SIZE_MINUTES;
  
  // Generate continuous 25-minute increments (no hour jumps)
  for (let currentMinutes = firstSlotMinutes; currentMinutes < dayEndMinutes; currentMinutes += SLOT_SIZE_MINUTES) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
};

// Helper function to convert time string to minutes from midnight
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes from midnight to time string
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to check if a time string is on the grid
export const isOnGrid = (timeString: string): boolean => {
  const totalMinutes = timeStringToMinutes(timeString);
  // Check if the time is on a 25-minute boundary from midnight
  return totalMinutes % SLOT_SIZE_MINUTES === 0;
};

// Helper function to get next grid point
export const getNextGridPoint = (timeString: string): string => {
  const minutes = timeStringToMinutes(timeString);
  const hourMinutes = minutes % 60;
  const hour = Math.floor(minutes / 60);
  
  for (const gridPoint of TIME_GRID_POINTS) {
    if (gridPoint > hourMinutes) {
      return minutesToTimeString(hour * 60 + gridPoint);
    }
  }
  
  // If no grid point found in current hour, go to next hour's first grid point
  return minutesToTimeString((hour + 1) * 60 + TIME_GRID_POINTS[0]);
};

// Helper function to get previous grid point
export const getPreviousGridPoint = (timeString: string): string => {
  const minutes = timeStringToMinutes(timeString);
  const hourMinutes = minutes % 60;
  const hour = Math.floor(minutes / 60);
  
  for (let i = TIME_GRID_POINTS.length - 1; i >= 0; i--) {
    const gridPoint = TIME_GRID_POINTS[i];
    if (gridPoint < hourMinutes) {
      return minutesToTimeString(hour * 60 + gridPoint);
    }
  }
  
  // If no grid point found in current hour, go to previous hour's last grid point
  const prevHour = hour - 1;
  const lastGridPoint = TIME_GRID_POINTS[TIME_GRID_POINTS.length - 1];
  return minutesToTimeString(prevHour * 60 + lastGridPoint);
};

// Helper function to check if a slot fits within day boundaries (end-exclusive)
export const slotFitsInDay = (startTime: string, durationMinutes: number, dayEndHour: number): boolean => {
  const startMinutes = timeStringToMinutes(startTime);
  const dayEndMinutes = dayEndHour * 60;
  const slotEndMinutes = startMinutes + durationMinutes;
  
  return slotEndMinutes <= dayEndMinutes;
};

// Helper function to get valid slots for a treatment duration within day boundaries
export const getValidSlotsForTreatment = (availableSlots: string[], durationMinutes: number, dayEndHour: number): string[] => {
  return availableSlots.filter(slot => slotFitsInDay(slot, durationMinutes, dayEndHour));
};

// Helper function to check if a time range (for blocking) fits within day boundaries
export const timeRangeFitsInDay = (startTime: string, endTime: string, dayEndHour: number): boolean => {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  const dayEndMinutes = dayEndHour * 60;
  
  return startMinutes < dayEndMinutes && endMinutes <= dayEndMinutes;
};

// Utility functions for stable time operations
export const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const addMinutes = (hhmm: string, delta: number): string => {
  const t = toMin(hhmm) + delta;
  const h = String(Math.floor(t / 60)).padStart(2, '0');
  const m = String(t % 60).padStart(2, '0');
  return `${h}:${m}`;
};

export const isContiguous = (slots: string[]): boolean => {
  if (slots.length <= 1) return true;
  const s = [...slots].sort((a, b) => toMin(a) - toMin(b));
  for (let i = 1; i < s.length; i++) {
    if (toMin(s[i]) - toMin(s[i - 1]) !== SLOT_SIZE_MINUTES) return false;
  }
  return true;
};

// Local date utilities (avoiding UTC issues)
export const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export const fromYMD = (ymd: string): Date => {
  const [Y, M, D] = ymd.split('-').map(Number);
  return new Date(Y, M - 1, D);
};

export const getDayOfWeekFromYMD = (ymd: string): number => {
  const [Y, M, D] = ymd.split('-').map(Number);
  return new Date(Y, M - 1, D).getDay();
};
