
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar, SidebarRail } from '@/components/ui/sidebar';
import { LayoutDashboard, List, BarChart3, Settings, Calendar, BookOpen, ChevronLeft } from 'lucide-react';
import { NotificationBell } from '../work-item/NotificationBell';
import { database } from '@/lib/db';
import { Notification } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

function TasksSubMenu() {
    const pathname = usePathname();
    const { open } = useSidebar();
    const isTasksActive = pathname === '/' || pathname.startsWith('/tasks');

    return (
        <Collapsible defaultOpen={isTasksActive}>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                    variant="ghost" 
                    className="w-full justify-start"
                    isActive={isTasksActive && !pathname.startsWith('/tasks/')}
                >
                    <List />
                    <span>Work Item</span>
                    <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === '/'}>
                            <Link href="/">Overview</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === '/tasks/list'}>
                             <Link href="/tasks/list">Work Item List</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/tasks/collections') || pathname.startsWith('/collections')}>
                             <Link href="/tasks/collections">Collections</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
    )
}

function AppSidebarHeader() {
    const { open } = useSidebar();

    return (
        <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">{open ? "Work Item" : ""}</h1>
            <SidebarTrigger>
                <ChevronLeft />
            </SidebarTrigger>
        </div>
    );
}


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

    const getPageTitle = () => {
        if (pathname === '/') return 'Work Item Overview';
        if (pathname === '/tasks/list') return 'Work Item List';
        if (pathname.startsWith('/tasks/collections')) return 'Collections';
        if (pathname.startsWith('/dashboard')) return 'Dashboard';
        if (pathname.startsWith('/reports')) return 'Reports';
        if (pathname.startsWith('/calendar')) return 'Calendar';
        if (pathname.startsWith('/collections')) return 'Collection Details';
        if (pathname.startsWith('/tasks/')) return 'Work Item Details';
        if (pathname.startsWith('/settings')) return 'Settings';
        return 'Work Item';
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <div className="flex flex-col h-full">
                    <AppSidebarHeader />
                    <div className="flex-1 overflow-y-auto">
                        <SidebarMenu>
                             <SidebarMenuItem>
                               <TasksSubMenu />
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/calendar" isActive={pathname === '/calendar'} tooltip="Calendar">
                                    <Calendar />
                                    <span>Calendar</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton href="/dashboard" isActive={pathname === '/dashboard'} tooltip="Dashboard">
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
                <SidebarRail />
            </Sidebar>
            <SidebarInset>
                <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
                    <header className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-bold tracking-tight font-headline">
                           {getPageTitle()}
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
