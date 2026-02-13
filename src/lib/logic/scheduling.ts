import { addMinutes, format, isSameDay, parse, setHours, setMinutes, startOfDay, endOfDay, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns';

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
}

interface BusyInterval {
    start: Date;
    end: Date;
}

/**
 * Generates available time slots for a given date, staff member, and duration.
 * 
 * @param date The date to generate slots for
 * @param existingAppointments List of existing appointments
 * @param blockedTimes List of availability blocks
 * @param workStartHour Start of work day (default 9)
 * @param workEndHour End of work day (default 17)
 * @param slotDurationMinutes Duration of each slot (default 60)
 */
export function generateTimeSlots(
    date: Date,
    existingAppointments: BusyInterval[],
    blockedTimes: BusyInterval[],
    workStartHour: number = 9,
    workEndHour: number = 17,
    slotDurationMinutes: number = 60
): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Define working hours for the specific date
    let currentSlotStart = setMinutes(setHours(startOfDay(date), workStartHour), 0);
    const workEndTime = setMinutes(setHours(startOfDay(date), workEndHour), 0);

    // Combine all busy times
    const allBusyTimes = [...existingAppointments, ...blockedTimes];

    while (isBefore(currentSlotStart, workEndTime)) {
        const currentSlotEnd = addMinutes(currentSlotStart, slotDurationMinutes);

        // Stop if slot exceeds work hours
        if (isAfter(currentSlotEnd, workEndTime)) break;

        // Check for overlaps
        const isBusy = allBusyTimes.some(busy => {
            return areIntervalsOverlapping(
                { start: currentSlotStart, end: currentSlotEnd },
                { start: busy.start, end: busy.end }
            );
        });

        // Also check if slot is in the past (if date is today)
        const isPast = isSameDay(date, new Date()) && isBefore(currentSlotStart, new Date());

        slots.push({
            start: currentSlotStart,
            end: currentSlotEnd,
            available: !isBusy && !isPast
        });

        // Move to next slot
        currentSlotStart = currentSlotEnd;
    }

    return slots;
}
