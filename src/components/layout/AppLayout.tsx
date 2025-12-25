
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { LayoutDashboard, List, BarChart3, Settings } from 'lucide-react';
import { NotificationBell } from '../work-item/NotificationBell';
import { database } from '@/lib/db';
import { Notification } from '@/lib/types';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const router = useRouter();
    
    useEffect(() => {
        setNotifications(database.getNotifications());
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if(notification.taskId) {
            router.push(`/tasks/${notification.taskId}`);
        }
        const updatedNotifications = database.markNotificationsAsRead([notification.id]);
        setNotifications(updatedNotifications);
    };

    const handleMarkAllAsRead = () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        const updatedNotifications = database.markNotificationsAsRead(unreadIds);
        setNotifications(updatedNotifications);
    };

    const pathname = usePathname();

    return (
        <SidebarProvider>
            <Sidebar>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                        <h1 className="text-2xl font-bold tracking-tight">Work Item</h1>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/" isActive={pathname === '/'} tooltip="Dashboard">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/reports" isActive={pathname === '/reports'} tooltip="Reports">
                                    <BarChart3 />
                                    <span>Reports</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                    <div className="p-4 border-t">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/settings" isActive={pathname === '/settings'} tooltip="Settings">
                                    <Settings />
                                    <span>Settings</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                </div>
            </Sidebar>
            <SidebarInset>
                <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
                    <header className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-4xl font-bold tracking-tight font-headline">
                            {pathname === '/' ? 'Work Item' : pathname.startsWith('/reports') ? 'Reports' : pathname.substring(1).charAt(0).toUpperCase() + pathname.slice(2)}
                        </h1>
                      </div>
                      <NotificationBell 
                        notifications={notifications}
                        onNotificationClick={handleNotificationClick}
                        onMarkAllAsRead={handleMarkAllAsRead}
                      />
                    </header>
                    {children}
                    <footer className="text-center p-4 text-sm text-muted-foreground mt-8">
                        Built with a focus on clarity and simplicity.
                    </footer>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

// Helper to get active state for sidebar items
const isActive = (pathname: string, href: string) => {
    return pathname === href;
}
