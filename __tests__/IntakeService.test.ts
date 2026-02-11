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
        const testData = {
            p_name: 'Test Client', // Legacy field support if needed by the test logic
            clientName: 'Test Client',
            phone: '555-0123',
            email: 'test@example.com',
            address: '123 Main St',
            ssnLastFour: '1234',
            reportDate: '2026-01-27',
            completionDate: '2026-01-27',
        } as any;

        const result = await service.submitNewIntake(testData);

        expect(mockRepo.createClientWithIntakeRPC).toHaveBeenCalledWith({
            p_name: testData.clientName,
            p_phone: testData.phone,
            p_email: testData.email,
            p_address: testData.address,
            p_ssn_last_four: testData.ssnLastFour,
            p_report_date: testData.reportDate,
            p_completion_date: testData.completionDate,
            p_intake_data: testData,
        });
        expect(result).toEqual({ id: '123' });
    });
});
