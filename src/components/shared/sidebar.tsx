
'use client';

import React, { useState, useEffect } from 'react';
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
  Gem,
  ShieldCheck,
  PieChart,
  FileArchive,
  Video,
  Edit,
  Mail,
  Plus,
  ArrowUpCircle,
  Workflow,
  LogOut,
  Database
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { motion } from 'framer-motion';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { AddPropertyDialog } from '../add-property-dialog';
import { AddBuyerDialog } from '../add-buyer-dialog';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import type { Property, Buyer, ListingType, UserRole } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const mainMenuItems = [
  { href: '/overview', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Agent', 'Video Recorder'] },
  { href: '/team', label: 'Team', icon: <UserCog />, roles: ['Admin'] },
];

const productivityMenuItems = [
  { href: '/appointments', label: 'Appointments', icon: <Calendar />, roles: ['Admin', 'Agent']},
  { href: '/follow-ups', label: 'Follow-ups', icon: <PhoneForwarded />, roles: ['Admin', 'Agent']},
  { href: '/activities', label: 'Activities', icon: <History />, roles: ['Admin', 'Agent'] },
  { href: '/inbox', label: 'Inbox', icon: <Mail />, roles: ['Admin']},
];

const growthMenuItems = [
    { href: '/analytics', label: 'Analytics', icon: <PieChart />, roles: ['Admin'] },
    { href: '/reports', label: 'Reports', icon: <ClipboardList />, roles: ['Admin'] },
];

const managementMenuItems = [
    { href: '/documents', label: 'Documents', icon: <FileArchive />, roles: ['Admin'] },
    { href: '/trash', label: 'Trash', icon: <Trash2 />, roles: ['Admin', 'Agent'] },
];

const videoMenuItems = [
    { href: '/recording', label: 'Recording', icon: <Video />, roles: ['Video Recorder'] },
    { href: '/editing', label: 'Editing', icon: <Edit />, roles: ['Video Recorder'] },
];

const bottomMenuItems = [
  { href: '/settings', label: 'Settings', icon: <Settings />, roles: ['Admin', 'Agent'] },
  { href: '/support', label: 'Get Help', icon: <MessageSquare />, roles: ['Admin', 'Agent'] },
  { href: '/upgrade', label: 'Upgrade Plan', icon: <Gem />, roles: ['Admin'] },
];

const allMobileMenuItems = [
    ...mainMenuItems,
    ...productivityMenuItems,
    ...growthMenuItems,
    ...managementMenuItems,
    ...videoMenuItems,
    ...bottomMenuItems
];


export function AppSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
  const [propertyListingType, setPropertyListingType] = useState<ListingType>('For Sale');
  
  const agencyPropertiesQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'properties') : null, [profile.agency_id, firestore]);
  const { data: allProperties } = useCollection<Property>(agencyPropertiesQuery);
  const agencyBuyersQuery = useMemoFirebase(() => profile.agency_id ? collection(firestore, 'agencies', profile.agency_id, 'buyers') : null, [profile.agency_id, firestore]);
  const { data: allBuyers } = useCollection<Buyer>(agencyBuyersQuery);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    localStorage.removeItem('app-profile');
    router.push('/');
  };

  const handleOpenAddDialog = (type: 'Property' | 'Buyer', listingType: ListingType) => {
    if (type === 'Property') {
        setPropertyListingType(listingType);
        setIsAddPropertyOpen(true);
    } else {
        setIsAddBuyerOpen(true);
    }
  }

  const renderMenuItem = (item: any) => {
    
    // Role check
    if (!item.roles.includes(profile.role)) {
      return null;
    }
    
    const isActive = pathname === item.href;

    return (
      <SidebarMenuItem key={item.href} className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={isActive}
                className={cn("transition-all duration-200")}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">{item.label}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  };

  if (isMobile === null) {
      return null; // Don't render anything until we know the screen size
  }

  if (isMobile) {
    if (profile.role === 'Video Recorder') {
      const recorderNavItems = [
        { href: '/recording', label: 'Recording', icon: <Video />, roles: [], isCenter: false },
        { href: '/overview', label: 'Overview', icon: <LayoutDashboard />, roles: [], isCenter: true },
        { href: '/editing', label: 'Editing', icon: <Edit />, roles: [], isCenter: false },
      ];
      return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-20 border-t bg-card/80 backdrop-blur-md">
          <div className="grid h-full grid-cols-3 relative">
            {recorderNavItems.map(item => {
              const isActive = pathname.startsWith(item.href);
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
      )
    }
    // New Mobile Nav for Admin/Agent
    const mobileNavItems = [
        { href: '/team', label: 'Team', icon: <UserCog /> },
        { href: '/properties', label: 'Properties', icon: <Building2 /> },
        { href: '/overview', label: 'Dashboard', icon: <LayoutDashboard />, isCenter: true },
        { href: '/buyers', label: 'Buyers', icon: <Users /> },
        { href: '#', label: 'More', icon: <MoreHorizontal />, isSheet: true },
    ];
    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-20 border-t bg-card/80 backdrop-blur-md">
            <div className="grid h-full grid-cols-5 relative">
                {mobileNavItems.map(item => {
                    const isActive = !item.isSheet && pathname.startsWith(item.href);
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
                    if (item.isSheet) {
                        return (
                            <Sheet key={item.label}>
                                <SheetTrigger asChild>
                                    <button className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                                        {React.cloneElement(item.icon, { className: 'h-5 w-5' })}
                                        <span>{item.label}</span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[80%] rounded-t-2xl">
                                    <SheetHeader>
                                        <SheetTitle>More Options</SheetTitle>
                                    </SheetHeader>
                                    <div className="grid grid-cols-3 gap-4 py-4">
                                        {allMobileMenuItems
                                            .filter(i => !mobileNavItems.map(n => n.href).includes(i.href) && i.roles.includes(profile.role))
                                            .map(i => (
                                            <Link key={i.href} href={i.href} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-accent">
                                                {React.cloneElement(i.icon, { className: 'h-6 w-6 text-primary' })}
                                                <span className="text-xs text-center">{i.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                    <Separator />
                                     <Button variant="ghost" onClick={handleLogout} className="w-full justify-start mt-4">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Button>
                                </SheetContent>
                            </Sheet>
                        )
                    }
                    if (!item.roles || item.roles.includes(profile.role)) {
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
                    }
                    return null;
                })}
            </div>
        </div>
    )
  }

  const CollapsibleMenuItem = ({
    label,
    icon,
    children,
    parentPath,
    roles
  }: {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    parentPath: string;
    roles: UserRole[];
  }) => {
    if (!roles.includes(profile.role)) return null;
    const isActive = pathname.startsWith(parentPath);
    const [isOpen, setIsOpen] = useState(isActive);
     useEffect(() => {
        if(isActive){
            setIsOpen(true);
        }
    }, [isActive]);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} className="justify-between">
            <div className="flex items-center gap-3">
              {icon}
              <span className="flex-1 truncate">{label}</span>
            </div>
            <ChevronDown className="size-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu className="pl-6 pt-2">
            {children}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const CollapsibleSubItem = ({ href, label }: { href: string; label: string }) => {
    const searchParams = useSearchParams();
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    const isActive = pathname === href.split('?')[0] && currentParams.toString() === (href.split('?')[1] || '');
    
    return (
      <SidebarMenuItem>
        <Link href={href}>
          <SidebarMenuButton size="sm" isActive={isActive}>
            {label}
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };


  return (
    <>
    <TooltipProvider>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="hidden md:flex flex-col bg-card dark:bg-neutral-900"
      >
        <SidebarHeader>
          <SidebarMenuButton asChild size="lg" className="justify-start my-2">
            <Link href="/overview">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg font-headline text-foreground whitespace-nowrap">
                        Signature Property CRM
                    </span>
                </div>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent className="flex-1 p-3">
          <SidebarMenu>
            {mainMenuItems.map(renderMenuItem)}
             {profile.role === 'Video Recorder' && videoMenuItems.map(renderMenuItem)}
          </SidebarMenu>
          
           <SidebarMenu className="mt-4">
            <h3 className="text-xs text-muted-foreground font-semibold pl-4 mb-1 group-data-[state=collapsed]:pl-0 group-data-[state=collapsed]:text-center">Leads</h3>
             <CollapsibleMenuItem label="Properties" icon={<Building2 />} parentPath="/properties" roles={['Admin', 'Agent']}>
                <p className="text-xs font-semibold text-muted-foreground px-4 py-2">Sale Properties</p>
                <CollapsibleSubItem href="/properties?status=All%20(Sale)" label="All (Sale)" />
                <CollapsibleSubItem href="/properties?status=Pending" label="Pending" />
                <CollapsibleSubItem href="/properties?status=Available%20(Sale)" label="Available" />
                <CollapsibleSubItem href="/properties?status=Sold" label="Sold" />
                <CollapsibleSubItem href="/properties?status=Sold%20(External)" label="Sold (External)" />
                <CollapsibleSubItem href="/properties?status=Recorded" label="Recorded" />
                <Separator className="my-2" />
                <p className="text-xs font-semibold text-muted-foreground px-4 py-2">Rent Properties</p>
                <CollapsibleSubItem href="/properties?status=All%20(Rent)" label="All (Rent)" />
                <CollapsibleSubItem href="/properties?status=Available%20(Rent)" label="Available" />
                <CollapsibleSubItem href="/properties?status=Rent%20Out" label="Rent Out" />
            </CollapsibleMenuItem>
            <CollapsibleMenuItem
              label="Buyers"
              icon={<Users />}
              parentPath="/buyers"
              roles={['Admin', 'Agent']}
            >
              <Separator className="my-2" />
              <p className="text-xs font-semibold text-muted-foreground px-4 py-2">Filter by Status</p>
              {buyerStatuses.map(status => (
                  <CollapsibleSubItem key={status} href={`/buyers?status=${encodeURIComponent(status)}`} label={status} />
              ))}
            </CollapsibleMenuItem>
          </SidebarMenu>

          <SidebarMenu className="mt-4">
             <h3 className="text-xs text-muted-foreground font-semibold pl-4 mb-1 group-data-[state=collapsed]:pl-0 group-data-[state=collapsed]:text-center">Productivity</h3>
             {productivityMenuItems.map(renderMenuItem)}
          </SidebarMenu>
          
          <SidebarMenu className="mt-4">
            <h3 className="text-xs text-muted-foreground font-semibold pl-4 mb-1 group-data-[state=collapsed]:pl-0 group-data-[state=collapsed]:text-center">Growth</h3>
            {growthMenuItems.map(renderMenuItem)}
            <CollapsibleMenuItem
                label="Tools"
                icon={<Rocket />}
                parentPath="/tools"
                roles={['Admin', 'Agent']}
            >
                <CollapsibleSubItem href="/tools/list-generator" label="List Generator" />
                <CollapsibleSubItem href="/tools/find-by-budget" label="Find By Budget" />
            </CollapsibleMenuItem>
          </SidebarMenu>

          <SidebarMenu className="mt-4">
             <h3 className="text-xs text-muted-foreground font-semibold pl-4 mb-1 group-data-[state=collapsed]:pl-0 group-data-[state=collapsed]:text-center">Management</h3>
            {managementMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>

     <AddPropertyDialog
        isOpen={isAddPropertyOpen}
        setIsOpen={setIsAddPropertyOpen}
        propertyToEdit={null}
        allProperties={allProperties || []}
        onSave={() => {}}
        listingType={propertyListingType}
        limitReached={false}
      />
      
      <AddBuyerDialog
        isOpen={isAddBuyerOpen}
        setIsOpen={setIsAddBuyerOpen}
        totalSaleBuyers={allBuyers?.filter(b => !b.is_deleted && b.listing_type !== 'For Rent').length || 0}
        totalRentBuyers={allBuyers?.filter(b => !b.is_deleted && b.listing_type === 'For Rent').length || 0}
        onSave={() => {}}
        limitReached={false}
      />
    </>
  );
}
