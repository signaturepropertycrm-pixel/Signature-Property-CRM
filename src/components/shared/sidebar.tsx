
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { buyerStatuses } from '@/lib/data';
import { useProfile } from '@/context/profile-context';

const menuItems = [
  { href: '/activities', label: 'Activities', icon: <History />, roles: ['Admin', 'Editor'] },
  { href: '/trash', label: 'Trash', icon: <Trash2 />, roles: ['Admin', 'Editor'] },
];

const bottomMenuItems = [
  { href: '/support', label: 'Support', icon: <MessageSquare />, roles: ['Admin'] },
  { href: '/settings', label: 'Settings', icon: <Settings />, roles: ['Admin'] },
  { href: '/upgrade', label: 'Upgrade Plan', icon: <Rocket />, roles: ['Admin'] },
];

const buyerStatusLinks = [
    'All',
    ...buyerStatuses
];

const propertyStatusLinks: {label: string, status: string}[] = [
    { label: 'All Properties', status: 'All' },
    { label: 'Available', status: 'Available' },
    { label: 'Sold', status: 'Sold' },
    { label: 'Recorded', status: 'Recorded' },
];

const appointmentStatusLinks: {label: string, type: string}[] = [
    { label: 'All Appointments', type: 'All' },
    { label: 'Buyer', type: 'Buyer' },
    { label: 'Owner', type: 'Owner' },
];


export function AppSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const [isBuyersOpen, setIsBuyersOpen] = useState(pathname.startsWith('/buyers'));
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(pathname.startsWith('/properties'));
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(pathname.startsWith('/appointments'));
  const [isToolsOpen, setIsToolsOpen] = useState(pathname.startsWith('/tools'));


  const mobileNavItems = [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Agent', 'Editor'] },
      { href: '/properties', label: 'Properties', icon: <Building2 />, roles: ['Admin', 'Agent', 'Editor'] },
      { href: '/buyers', label: 'Buyers', icon: <Users />, roles: ['Admin', 'Agent', 'Editor'] },
      { href: '/team', label: 'Team', icon: <UserCog />, roles: ['Admin'] },
      { href: '/follow-ups', label: 'Follow-ups', icon: <PhoneForwarded />, roles: ['Admin', 'Agent', 'Editor'] },
  ];


  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-card/80 backdrop-blur-md">
        <div className="grid h-16 grid-cols-5">
          {mobileNavItems.filter(item => item.roles.includes(profile.role)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium',
                pathname.startsWith(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {React.cloneElement(item.icon, { className: 'h-5 w-5' })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
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
            <Link href="/dashboard">
                <div className="flex items-center gap-2">
                    <Home className="text-primary size-8" />
                    <span className="font-bold text-xl font-headline text-primary">
                        Signature
                    </span>
                </div>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent className="flex-1">
          <SidebarMenu>
            <SidebarMenuItem className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/dashboard">
                      <SidebarMenuButton
                          isActive={pathname === '/dashboard'}
                          className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                      >
                          <LayoutDashboard />
                          <span className="flex-1 truncate">Dashboard</span>
                      </SidebarMenuButton>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">Dashboard</TooltipContent>
                </Tooltip>
                 {pathname === '/dashboard' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
            </SidebarMenuItem>
            
            {/* Properties Collapsible Menu */}
             <Collapsible open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
                 <SidebarMenuItem className="relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <CollapsibleTrigger asChild>
                                 <SidebarMenuButton
                                    isActive={pathname.startsWith('/properties')}
                                    className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                                >
                                    <Building2/>
                                    <span className="flex-1 truncate">Properties</span>
                                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isPropertiesOpen && "rotate-180")} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">Properties</TooltipContent>
                    </Tooltip>
                    {pathname.startsWith('/properties') && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
                 </SidebarMenuItem>

                <CollapsibleContent asChild>
                    <div className="group-data-[state=expanded]:py-2 group-data-[state=collapsed]:hidden">
                        <SidebarMenu className="pl-7">
                            {propertyStatusLinks.map(({label, status}) => {
                                const href = status === 'All' ? '/properties' : `/properties?status=${encodeURIComponent(status)}`;
                                const isActive = status === 'All' ? pathname === '/properties' : pathname.includes(`status=${encodeURIComponent(status)}`);
                                return (
                                     <SidebarMenuItem key={status}>
                                         <Link href={href}>
                                             <SidebarMenuButton size="sm" isActive={isActive} className="w-full justify-start rounded-full text-xs">
                                                 {label}
                                             </SidebarMenuButton>
                                         </Link>
                                     </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </div>
                </CollapsibleContent>
             </Collapsible>

            {/* Buyers Collapsible Menu */}
             <Collapsible open={isBuyersOpen} onOpenChange={setIsBuyersOpen}>
                 <SidebarMenuItem className="relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <CollapsibleTrigger asChild>
                                 <SidebarMenuButton
                                    isActive={pathname.startsWith('/buyers')}
                                    className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                                >
                                    <Users/>
                                    <span className="flex-1 truncate">Buyers</span>
                                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isBuyersOpen && "rotate-180")} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">Buyers</TooltipContent>
                    </Tooltip>
                    {pathname.startsWith('/buyers') && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
                 </SidebarMenuItem>

                <CollapsibleContent asChild>
                    <div className="group-data-[state=expanded]:py-2 group-data-[state=collapsed]:hidden">
                        <SidebarMenu className="pl-7">
                            {buyerStatusLinks.map(status => {
                                const href = status === 'All' ? '/buyers' : `/buyers?status=${encodeURIComponent(status)}`;
                                const isActive = status === 'All' ? pathname === '/buyers' : pathname.includes(`status=${encodeURIComponent(status)}`);
                                return (
                                     <SidebarMenuItem key={status}>
                                         <Link href={href}>
                                             <SidebarMenuButton size="sm" isActive={isActive} className="w-full justify-start rounded-full text-xs">
                                                 {status}
                                             </SidebarMenuButton>
                                         </Link>
                                     </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </div>
                </CollapsibleContent>
             </Collapsible>
             
              {/* Tools Collapsible Menu */}
             <Collapsible open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                 <SidebarMenuItem className="relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <CollapsibleTrigger asChild>
                                 <SidebarMenuButton
                                    isActive={pathname.startsWith('/tools')}
                                    className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                                >
                                    <ClipboardList/>
                                    <span className="flex-1 truncate">Tools</span>
                                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isToolsOpen && "rotate-180")} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">Tools</TooltipContent>
                    </Tooltip>
                    {pathname.startsWith('/tools') && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
                 </SidebarMenuItem>
                <CollapsibleContent asChild>
                    <div className="group-data-[state=expanded]:py-2 group-data-[state=collapsed]:hidden">
                        <SidebarMenu className="pl-7">
                             <SidebarMenuItem>
                                 <Link href="/tools">
                                     <SidebarMenuButton size="sm" isActive={pathname === '/tools'} className="w-full justify-start rounded-full text-xs">
                                         List Generator
                                     </SidebarMenuButton>
                                 </Link>
                             </SidebarMenuItem>
                             <SidebarMenuItem>
                                <Link href="/tools/post-generator">
                                    <SidebarMenuButton size="sm" isActive={pathname === '/tools/post-generator'} className="w-full justify-between rounded-full text-xs">
                                        Post Generator
                                        <Badge variant="destructive" className="scale-75">Coming Soon</Badge>
                                    </SidebarMenuButton>
                                </Link>
                             </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                </CollapsibleContent>
             </Collapsible>

            <SidebarMenuItem className="relative">
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Link href="/follow-ups">
                        <SidebarMenuButton
                            isActive={pathname === '/follow-ups'}
                            className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                        >
                            <PhoneForwarded />
                            <span className="flex-1 truncate">Follow-ups</span>
                        </SidebarMenuButton>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                    Follow-ups
                    </TooltipContent>
                </Tooltip>
                {pathname === '/follow-ups' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
            </SidebarMenuItem>

            {/* Appointments Collapsible Menu */}
             <Collapsible open={isAppointmentsOpen} onOpenChange={setIsAppointmentsOpen}>
                 <SidebarMenuItem className="relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <CollapsibleTrigger asChild>
                                 <SidebarMenuButton
                                    isActive={pathname.startsWith('/appointments')}
                                    className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                                >
                                    <Calendar/>
                                    <span className="flex-1 truncate">Appointments</span>
                                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isAppointmentsOpen && "rotate-180")} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">Appointments</TooltipContent>
                    </Tooltip>
                    {pathname.startsWith('/appointments') && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
                 </SidebarMenuItem>
                <CollapsibleContent asChild>
                    <div className="group-data-[state=expanded]:py-2 group-data-[state=collapsed]:hidden">
                        <SidebarMenu className="pl-7">
                            {appointmentStatusLinks.map(({label, type}) => {
                                const href = type === 'All' ? '/appointments' : `/appointments?type=${encodeURIComponent(type)}`;
                                const isActive = type === 'All' ? pathname === '/appointments' : pathname.includes(`type=${encodeURIComponent(type)}`);
                                return (
                                     <SidebarMenuItem key={type}>
                                         <Link href={href}>
                                             <SidebarMenuButton size="sm" isActive={isActive} className="w-full justify-start rounded-full text-xs">
                                                 {label}
                                             </SidebarMenuButton>
                                         </Link>
                                     </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </div>
                </CollapsibleContent>
             </Collapsible>
             
            {profile.roles.includes('Admin') && (
              <SidebarMenuItem className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/team">
                      <SidebarMenuButton
                          isActive={pathname === '/team'}
                          className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                      >
                          <UserCog />
                          <span className="flex-1 truncate">Team</span>
                      </SidebarMenuButton>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    Team
                  </TooltipContent>
                </Tooltip>
                 {pathname === '/team' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
              </SidebarMenuItem>
            )}

            {menuItems.filter(item => item.roles.includes(profile.role)).map((item) => (
              <SidebarMenuItem key={item.href} className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <SidebarMenuButton
                          isActive={pathname === item.href}
                          className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                      >
                          {item.icon}
                          <span className="flex-1 truncate">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
                 {pathname === item.href && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.filter(item => item.roles.includes(profile.role)).map((item) => (
               <SidebarMenuItem key={item.href} className="relative">
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Link href={item.href}>
                        <SidebarMenuButton isActive={pathname === item.href} className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105">
                            {item.icon}
                            <span className="flex-1 truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                   </TooltipTrigger>
                   <TooltipContent side="right" align="center">{item.label}</TooltipContent>
                 </Tooltip>
                  {pathname === item.href && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
