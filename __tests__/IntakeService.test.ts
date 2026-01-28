import { describe, it, expect, vi } from 'vitest';
import { IntakeService } from '../src/services/IntakeService';

describe('IntakeService', () => {
    it('should coordinate intake submission through the repository', async () => {
        const mockRepo = {
            createClientWithIntakeRPC: vi.fn().mockResolvedValue({ id: '123' }),
            createClient: vi.fn(),
            createIntake: vi.fn(),
        } as any;

        const service = new IntakeService(mockRepo);
        const testData = { p_name: 'Test Client' };

        const result = await service.submitNewIntake(testData);

        expect(mockRepo.createClientWithIntakeRPC).toHaveBeenCalledWith(testData);
        expect(result).toEqual({ id: '123' });
    });
});
