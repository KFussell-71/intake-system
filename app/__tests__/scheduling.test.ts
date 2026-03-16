import { describe, it, expect } from 'vitest';
import { generateTimeSlots } from '../src/lib/logic/scheduling';
import { addHours, setHours, startOfDay } from 'date-fns';

describe('Scheduling Logic', () => {
    const baseDate = new Date('2026-02-15T09:00:00Z'); // Sunday

    it('should generate slots for a full day with no conflicts', () => {
        const slots = generateTimeSlots(
            baseDate,
            [], // No appointments
            [], // No blocks
            9,  // 9 AM
            17, // 5 PM
            60  // 60 min slots
        );

        // 9, 10, 11, 12, 13, 14, 15, 16 (8 slots)
        expect(slots.length).toBe(8);
        expect(slots.every(s => s.available)).toBe(true);
    });

    it('should mark slots as unavailable if appointment exists', () => {
        const apptStart = setHours(startOfDay(baseDate), 10); // 10:00
        const apptEnd = addHours(apptStart, 1); // 11:00

        const slots = generateTimeSlots(
            baseDate,
            [{ start: apptStart, end: apptEnd }],
            [],
            9, 17, 60
        );

        const slot10am = slots.find(s => s.start.getHours() === 10);
        expect(slot10am?.available).toBe(false);

        const slot9am = slots.find(s => s.start.getHours() === 9);
        expect(slot9am?.available).toBe(true);
    });

    it('should mark slots as unavailable if blocked', () => {
        const blockStart = setHours(startOfDay(baseDate), 12); // 12:00 (Lunch)
        const blockEnd = addHours(blockStart, 1); // 13:00

        const slots = generateTimeSlots(
            baseDate,
            [],
            [{ start: blockStart, end: blockEnd }],
            9, 17, 60
        );

        const slot12pm = slots.find(s => s.start.getHours() === 12);
        expect(slot12pm?.available).toBe(false);
    });
});
