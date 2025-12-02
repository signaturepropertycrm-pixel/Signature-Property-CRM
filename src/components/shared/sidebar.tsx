
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  PhoneForwarded,
  Calendar,
  Settings,
  Rocket,
  Home,
  ChevronDown,
  LineChart,
  History,
  Trash2,
  MessageSquare,
  ClipboardList,
  Badge,
  MoreHorizontal,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { buyerStatuses } from '@/lib/data';
import { useProfile } from '@/context/profile-context';
import { useUI } from '@/app/(protected)/layout';

const mainMenuItems = [
  { href: '/overview', label: 'Overview', icon: <LayoutDashboard />, roles: ['Admin', 'Agent'] },
  { 
    href: '/properties', 
    label: 'Properties', 
    icon: <Building2 />, 
    roles: ['Admin', 'Agent']
  },
  { 
    href: '/buyers', 
    label: 'Buyers', 
    icon: <Users />, 
    roles: ['Admin', 'Agent'],
    subItems: [
        { href: '/buyers', label: 'All Buyers'},
        ...buyerStatuses.map(status => ({ href: `/buyers?status=${encodeURIComponent(status)}`, label: status }))
    ]
  },
  { href: '/team', label: 'Team', icon: <UserCog />, roles: ['Admin'] },
  { 
    href: '/tools', 
    label: 'Tools', 
    icon: <ClipboardList />, 
    roles: ['Admin'],
    subItems: [
        { href: '/tools/list-generator', label: 'List Generator' },
        { href: '/tools/post-generator', label: 'Post Generator' },
    ]
  },
  { href: '/follow-ups', label: 'Follow-ups', icon: <PhoneForwarded />, roles: ['Admin', 'Agent'] },
  { 
    href: '/appointments', 
    label: 'Appointments', 
    icon: <Calendar />, 
    roles: ['Admin', 'Agent'],
    subItems: [
        { href: '/appointments', label: 'All Appointments' },
        { href: '/appointments?type=Buyer', label: 'Buyer' },
        { href: '/appointments?type=Owner', label: 'Owner' },
    ]
  },
  { href: '/activities', label: 'Activities', icon: <History />, roles: ['Admin', 'Agent'] },
  { href: '/trash', label: 'Trash', icon: <Trash2 />, roles: ['Admin', 'Agent'] },
];


const bottomMenuItems = [
  { href: '/settings', label: 'Settings', icon: <Settings />, roles: ['Admin', 'Agent'] },
  { href: '/support', label: 'Support', icon: <MessageSquare />, roles: ['Admin', 'Agent'] },
  { href: '/upgrade', label: 'Upgrade', icon: <Rocket />, roles: ['Admin'] },
];


export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const { isMoreMenuOpen, setIsMoreMenuOpen } = useUI();
  
  const [openCollapsibles, setOpenCollapsibles] = useState(() => {
    const initialState: { [key: string]: boolean } = {};
    mainMenuItems.forEach(item => {
        if (item.subItems) {
            initialState[item.href] = pathname.startsWith(item.href);
        }
    });
    return initialState;
  });

  const toggleCollapsible = (href: string) => {
      setOpenCollapsibles(prev => ({...prev, [href]: !prev[href]}));
  }

  const mobileNavItems = [
     { href: '/team', label: 'Team', icon: <UserCog />, roles: ['Admin'] },
     { href: '/properties', label: 'Properties', icon: <Building2 />, roles: ['Admin', 'Agent'] },
     { href: '/overview', label: 'Overview', icon: <LayoutDashboard />, roles: ['Admin', 'Agent'], isCenter: true },
     { href: '/buyers', label: 'Buyers', icon: <Users />, roles: ['Admin', 'Agent'] },
     { href: '/more', label: 'More', icon: <MoreHorizontal />, roles: ['Admin', 'Agent'], isSheet: true },
  ].filter(item => item.roles.includes(profile.role));

  const moreSheetItems = mainMenuItems.concat(bottomMenuItems).filter(item => 
      !['/overview', '/properties', '/buyers', '/team'].includes(item.href) &&
      item.roles.includes(profile.role)
  );

  const renderMenuItem = (item: any) => {
    if (!item.roles.includes(profile.role)) {
      return null;
    }

    const isActive = !item.subItems && pathname === item.href;
    const isCollapsibleActive = item.subItems && pathname.startsWith(item.href);

    if (item.subItems) {
        return (
            <Collapsible key={item.href} open={openCollapsibles[item.href] || false} onOpenChange={() => toggleCollapsible(item.href)}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            isActive={isCollapsibleActive}
                            className="rounded-full justify-between transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span className="flex-1 truncate">{item.label}</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", (openCollapsibles[item.href] || false) && "rotate-180")} />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent>
                    <SidebarMenu className="pl-6">
                        {item.subItems.map((subItem: any) => {
                            const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
                            const subItemParams = new URLSearchParams(subItem.href.split('?')[1]);
                            const paramKey = subItem.href.includes('status=') ? 'status' : 'type';

                            const currentParamValue = currentParams.get(paramKey);
                            const subItemParamValue = subItemParams.get(paramKey);

                            const isSubItemActive = pathname === subItem.href.split('?')[0] && (
                                (!currentParamValue && !subItemParamValue && (subItem.label === 'All Properties' || subItem.label === 'All Buyers' || subItem.label === 'All Appointments')) || 
                                (currentParamValue === subItemParamValue)
                            );

                            return (
                                <SidebarMenuItem key={subItem.href} className="relative">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={subItem.href}>
                                            <SidebarMenuButton
                                                variant="ghost"
                                                size="sm"
                                                isActive={isSubItemActive}
                                                className="rounded-full w-full justify-start transition-all duration-200 hover:bg-primary/10"
                                            >
                                                <span className="truncate">{subItem.label}</span>
                                            </SidebarMenuButton>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center">{subItem.label}</TooltipContent>
                                    </Tooltip>
                                    {isSubItemActive && <div className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
      <SidebarMenuItem key={item.href} className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={isActive}
                className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">{item.label}</TooltipContent>
        </Tooltip>
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
      </SidebarMenuItem>
    );
  };

  if (isMobile === null) {
      return null; // Don't render anything until we know the screen size
  }

  if (isMobile) {
    return (
      <TooltipProvider>
        {isMoreMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsMoreMenuOpen(false)}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
        )}
      <div className="fixed bottom-0 left-0 z-50 w-full h-20 border-t bg-card/80 backdrop-blur-md">
        <div className="grid h-full grid-cols-5 relative">
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            if (item.isSheet) {
                return (
                     <div key={item.href} className="relative flex flex-col items-center justify-center">
                        {isMoreMenuOpen && (
                            <div className="absolute bottom-full right-4 mb-4 flex flex-col items-end gap-3 z-50">
                               {moreSheetItems.map((sheetItem, index) => {
                                  const finalLabel = sheetItem.label;

                                  return (
                                    <Link key={sheetItem.href} href={sheetItem.href} onClick={() => setIsMoreMenuOpen(false)}>
                                        <div 
                                            className="flex items-center gap-3"
                                            style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
                                        >
                                            <span className="font-semibold text-slate-800 dark:text-white shadow-lg">{finalLabel}</span>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-white shadow-lg transition-all duration-300 hover:scale-110">
                                                {React.cloneElement(sheetItem.icon, { className: 'h-6 w-6' })}
                                            </div>
                                        </div>
                                    </Link>
                                  )
                               })}
                            </div>
                        )}
                        <button 
                            onClick={() => setIsMoreMenuOpen(prev => !prev)}
                            className={cn('flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-primary z-50')}
                        >
                            {isMoreMenuOpen ? <X className="h-5 w-5" /> : React.cloneElement(item.icon, { className: 'h-5 w-5' })}
                            <span>{item.label}</span>
                        </button>
                    </div>
                )
            }
            if (item.isCenter) {
                return (
                    <div key={item.href} className="relative flex items-center justify-center">
                        <Link href={item.href}>
                             <div className={cn(
                                'absolute -top-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 left-1/2 -translate-x-1/2',
                                'bg-gradient-to-br from-primary to-blue-500',
                                isActive && 'ring-4 ring-primary/30'
                             )}>
                                {React.cloneElement(item.icon, { className: 'h-7 w-7' })}
                            </div>
                        </Link>
                    </div>
                )
            }
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    )}
                >
                    {React.cloneElement(item.icon, { className: 'h-5 w-5' })}
                    <span>{item.label}</span>
                </Link>
            )
          })}
        </div>
      </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="hidden md:flex flex-col bg-card/60 backdrop-blur-lg border-r-0"
      >
        <SidebarHeader>
          <SidebarMenuButton asChild size="lg" className="justify-start my-2">
            <Link href="/overview">
                <div className="flex items-center gap-2">
                    <Home className="text-primary size-8" />
                    <span className="font-bold text-xl font-headline text-primary">
                        S.P CRM
                    </span>
                </div>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent className="flex-1">
          <SidebarMenu>
            {mainMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
