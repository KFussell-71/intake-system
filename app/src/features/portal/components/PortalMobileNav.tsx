'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, MessageSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PortalMobileNav() {
    const pathname = usePathname();

    const links = [
        { href: '/portal', label: 'Home', icon: Home },
        { href: '/portal/documents', label: 'Docs', icon: FileText },
        { href: '/portal/messages', label: 'Chat', icon: MessageSquare },
        { href: '/portal/book', label: 'Book', icon: Calendar },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-50">
            <div className="flex justify-around items-center h-16 pb-safe">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95",
                                isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
