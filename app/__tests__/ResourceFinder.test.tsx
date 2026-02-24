
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResourceFinder } from '../src/features/resources/ResourceFinder';
import { vi } from 'vitest';
import * as actions from '../src/app/actions/resources/findResources';

// Mock the server action
vi.mock('../src/app/actions/resources/findResources', () => ({
    findResourcesAction: vi.fn()
}));

describe('ResourceFinder Component', () => {
    it('renders the search input and button', () => {
        render(<ResourceFinder />);
        expect(screen.getByPlaceholderText('Describe the need...')).toBeInTheDocument();
        expect(screen.getByText('Find Resources')).toBeInTheDocument();
    });

    it('performs a search and displays local results', async () => {
        const mockData = {
            matches: [
                {
                    id: '1',
                    name: 'Grace Resources',
                    category: 'Food',
                    description: 'Free groceries',
                    address: 'Lancaster, CA',
                    is_verified: true,
                    tags: ['pantry']
                }
            ],
            source: 'local',
            reasoning: 'Found local match'
        };

        (actions.findResourcesAction as any).mockResolvedValue({ success: true, data: mockData });

        render(<ResourceFinder />);

        const input = screen.getByPlaceholderText('Describe the need...');
        const button = screen.getByText('Find Resources');

        fireEvent.change(input, { target: { value: 'I need food' } });
        fireEvent.click(button);

        // The button goes into loading state, so "Find Resources" text might disappear or be replaced by spinner
        // Let's just wait for the results instead of asserting strictly on the loading state text if it's dynamic
        // or check for the loading spinner if accessible

        await waitFor(() => {
            expect(screen.getByText('Grace Resources')).toBeInTheDocument();
            expect(screen.getByText('Free groceries')).toBeInTheDocument();
            expect(screen.getByText('Verified')).toBeInTheDocument();
        });
    });

    it('displays discovery mode suggestion when no local results found', async () => {
        const mockData = {
            matches: [],
            source: 'web',
            reasoning: 'Recommended web search: "Food resources in Antelope Valley"'
        };

        (actions.findResourcesAction as any).mockResolvedValue({ success: true, data: mockData });

        render(<ResourceFinder />);

        const input = screen.getByPlaceholderText('Describe the need...');
        fireEvent.change(input, { target: { value: 'Rare item' } });
        fireEvent.click(screen.getByText('Find Resources'));

        await waitFor(() => {
            expect(screen.getByText('No local matches found.')).toBeInTheDocument();
            expect(screen.getByText('Search Google for Resources')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /Search Google/i })).toHaveAttribute('href', expect.stringContaining('google.com'));
        });
    });
});
