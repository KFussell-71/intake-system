import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChatInterface } from './ChatInterface'; // We'll create this wrapper

export default async function MessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // We verify role here if needed, but keeping open for now

    return (
        <div className="container mx-auto p-6 h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Communication Center</h1>
            <ChatInterface userId={user.id} />
        </div>
    );
}
