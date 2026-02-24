import React from 'react';
import { ActivityFeedItem } from '@/types/dashboard';
import { FileText, UserPlus, Phone, StickyNote, Activity } from 'lucide-react';

interface ActivityFeedProps {
    items: ActivityFeedItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => {
    const getIcon = (type: ActivityFeedItem['event_type']) => {
        switch (type) {
            case 'intake':
                return <UserPlus className="h-5 w-5 text-blue-500" />;
            case 'document':
                return <FileText className="h-5 w-5 text-orange-500" />;
            case 'follow_up':
                return <Phone className="h-5 w-5 text-green-500" />;
            case 'note':
                return <StickyNote className="h-5 w-5 text-purple-500" />;
            default:
                return <Activity className="h-5 w-5 text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {items.map((item, itemIdx) => (
                    <li key={item.id}>
                        <div className="relative pb-8">
                            {itemIdx !== items.length - 1 ? (
                                <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 ring-8 ring-white">
                                    {getIcon(item.event_type)}
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {item.description}{' '}
                                            <span className="font-medium text-gray-900">
                                                ({item.client_name})
                                            </span>
                                        </p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            {items.length === 0 && (
                <div className="text-center py-6 text-gray-500 italic">No recent activity</div>
            )}
        </div>
    );
};
