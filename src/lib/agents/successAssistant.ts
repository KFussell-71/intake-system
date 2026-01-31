import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntakeFormData } from '../../features/intake/types/intake';
import { SearchService, SearchResult } from '../services/SearchService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SuccessSuggestion {
    category: 'career' | 'resource' | 'training';
    title: string;
    description: string;
    action: string;
    sourceUrl?: string; // New field for grounding traceability
}

export async function generateSuccessSuggestions(intakeData: IntakeFormData): Promise<SuccessSuggestion[]> {
    if (!process.env.GEMINI_API_KEY) {
        return [];
    }

    // 1. Perform Real-Time Grounding Search
    const city = intakeData.address?.split(',')[0] || 'San Diego';
    const searchQuery = `entry level jobs and community resources in ${city} ${intakeData.employmentGoals}`;

    let searchContext: SearchResult[] = [];
    try {
        searchContext = await SearchService.search(searchQuery);
    } catch (e) {
        console.error('Search grounding failed, falling back to knowledge base', e);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
    You are the "New Beginning Success Architect". 
    Analyze the following client intake data and suggest 3 high-impact next steps to ensure their success.
    
    ### CLIENT DATA:
    - Location: ${intakeData.address}
    - Employment Goals: ${intakeData.employmentGoals}
    - Education Goals: ${intakeData.educationGoals}
    - Housing Needs: ${intakeData.housingNeeds}
    - Strengths: ${intakeData.keyStrengths}
    - Barriers: ${intakeData.transportationAssistance ? 'Needs Transportation' : ''} ${intakeData.childcareAssistance ? 'Needs Childcare' : ''}
    
    ### LIVE WEB SEARCH CONTEXT (GROUNDING):
    ${searchContext.length > 0
            ? searchContext.map(s => `- ${s.title}: ${s.snippet} (Source: ${s.link})`).join('\n')
            : "No live results available. Use your internal knowledge of social services."}
    
    ### INSTRUCTIONS:
    1. Use the "LIVE WEB SEARCH CONTEXT" to provide real, active links to job boards, training centers, or housing resources if available.
    2. If the search context is empty, suggest well-known regional resources (e.g. MTS for San Diego, local Community Colleges).
    3. Ensure suggestions match the client's Strengths and minimize their Barriers.
    
    ### OUTPUT:
    Return exactly 3 suggestions in a JSON array format:
    [{ "category": "career" | "resource" | "training", "title": "...", "description": "...", "action": "...", "sourceUrl": "..." }]
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
        console.error('AI Success Suggestion Error:', error);
        return [];
    }
}
