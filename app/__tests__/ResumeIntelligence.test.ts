import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resumeIntelligenceService } from '../src/services/ResumeIntelligenceService';
import { aiService } from '../src/lib/ai/UnifiedAIService';

// Mock UnifiedAIService
vi.mock('../src/lib/ai/UnifiedAIService', () => ({
    aiService: {
        ask: vi.fn()
    },
    default: {
        ask: vi.fn()
    }
}));

// Mock Supabase
vi.mock('../src/lib/supabase/browser', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { presenting_issue: 'Test Issue', eligibility_rationale: 'Test Rationale' } })
                })
            })
        })
    })
}));

describe('ResumeIntelligenceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should draft high-impact work highlights', async () => {
        (aiService.ask as any).mockResolvedValue('- Developed a new intake system\n- Optimized database queries\n- Led a team of 5 developers');

        const highlights = await resumeIntelligenceService.draftWorkHighlights(
            'Senior Developer',
            'Made some software and talked to people',
            'I want to be a lead',
            'Candidate shows strong potential'
        );

        expect(highlights).toHaveLength(3);
        expect(highlights[0]).toBe('Developed a new intake system');
        expect(aiService.ask).toHaveBeenCalledWith(expect.objectContaining({
            prompt: expect.stringContaining('Senior Developer'),
            temperature: 0.7
        }));
    });

    it('should draft a professional summary', async () => {
        (aiService.ask as any).mockResolvedValue('Experienced professional with strong technical skills. Committed to vocational success.');

        const summary = await resumeIntelligenceService.draftProfessionalSummary(
            { basics: { name: 'Jane Doe', email: '', phone: '' } },
            'Test Issue',
            'Test Rationale'
        );

        expect(summary).toContain('strong technical skills');
        expect(aiService.ask).toHaveBeenCalled();
    });

    it('should enhance a resume with intelligence data', async () => {
        (aiService.ask as any).mockResolvedValueOnce('AI Summary Text') // For draftProfessionalSummary
            .mockResolvedValueOnce('- Highlight 1\n- Highlight 2'); // For draftWorkHighlights

        const baseResume = {
            basics: { name: 'Jane Doe', email: 'jane@example.com', phone: '123' },
            work: [{ position: 'Developer', name: 'Tech Co', startDate: '2020', highlights: [] }],
            skills: [{ name: 'Tech', keywords: ['JS', 'TS'] }]
        };

        const enhanced = await resumeIntelligenceService.enhanceResumeWithIntelligence('test-id', baseResume);

        expect(enhanced.basics.summary).toBe('AI Summary Text');
        expect(enhanced.work![0].highlights).toContain('Highlight 1');
    });
});
