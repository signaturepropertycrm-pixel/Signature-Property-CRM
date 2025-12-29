
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
import { motion } from 'framer-motion';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { AddPropertyDialog } from '../add-property-dialog';
import { AddBuyerDialog } from '../add-buyer-dialog';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';
import type { Property, Buyer, ListingType } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';


const mainMenuItems = [
  { href: '/overview', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Agent', 'Video Recorder'] },
  { href: '/lifecycle', label: 'Lifecycle', icon: <Workflow />, roles: ['Admin', 'Agent'] },
  { href: '/analytics', label: 'Analytics', icon: <LineChart />, roles: ['Admin'] },
  { 
    href: '/properties', 
    label: 'Projects', 
    icon: <Building2 />, 
    roles: ['Admin', 'Agent'],
  },
  { href: '/team', label: 'Team', icon: <Users />, roles: ['Admin'] },
];

const secondaryMenuItems = [
    { href: '/analytics', label: 'Analytics', icon: <LineChart />, roles: ['Admin'] },
];

const documentMenuItems = [
    { href: '/documents', label: 'Data Library', icon: <FileArchive />, roles: ['Admin'] },
    { href: '/reports', label: 'Reports', icon: <ClipboardList />, roles: ['Admin'] },
    { href: '/tools/find-by-budget', label: 'Word Assistant', icon: <Rocket />, roles: ['Admin'] },
];


const bottomMenuItems = [
  { href: '/settings', label: 'Settings', icon: <Settings />, roles: ['Admin', 'Agent'] },
  { href: '/support', label: 'Get Help', icon: <MessageSquare />, roles: ['Admin', 'Agent'] },
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
        if ('subItems' in item) {
            initialState[item.href] = pathname.startsWith(item.href);
        }
    });
    return initialState;
  });
  
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
        { href: '/recording', label: 'Recording', icon: <Video />, roles: [] },
        { href: '/overview', label: 'Overview', icon: <LayoutDashboard />, roles: [], isCenter: true },
        { href: '/editing', label: 'Editing', icon: <Edit />, roles: [] },
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
  }

  return (
    <>
    <TooltipProvider>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="hidden md:flex flex-col bg-card"
      >
        <SidebarHeader>
          <SidebarMenuButton asChild size="lg" className="justify-start my-2">
            <Link href="/overview">
                <div className="flex items-center gap-2">
                    <ArrowUpCircle className="text-primary size-8" />
                    <span className="font-bold text-xl font-headline text-foreground">
                        Acme Inc.
                    </span>
                </div>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent className="flex-1 p-3">
             <Popover>
                <PopoverTrigger asChild>
                    <SidebarMenuButton variant="default" className="w-full justify-start text-base">
                        <Plus />
                        Quick Create
                    </SidebarMenuButton>
                </PopoverTrigger>
                 <PopoverContent side="right" align="start" className="p-1 w-48">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleOpenAddDialog('Property', 'For Sale')}>Property for Sale</Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleOpenAddDialog('Property', 'For Rent')}>Property for Rent</Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleOpenAddDialog('Buyer', 'For Sale')}>Buyer for Sale</Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleOpenAddDialog('Buyer', 'For Rent')}>Buyer for Rent</Button>
                </PopoverContent>
            </Popover>

          <SidebarMenu className="mt-4">
            {mainMenuItems.map(renderMenuItem)}
          </SidebarMenu>
          
          <SidebarMenu className="mt-4">
            <h3 className="text-xs text-muted-foreground font-semibold pl-4 mb-1 group-data-[state=collapsed]:pl-0 group-data-[state=collapsed]:text-center">Documents</h3>
            {documentMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.map(renderMenuItem)}
          </SidebarMenu>
          <Separator className="my-2 bg-slate-700" />
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center justify-between w-full h-auto p-2">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={profile.avatar} alt={profile.name} />
                            <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="text-left group-data-[state=expanded]:inline hidden">
                            <p className="font-semibold text-sm">{profile.name}</p>
                            <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                    </div>
                    <MoreHorizontal className="group-data-[state=expanded]:inline hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-56 mb-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/support')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        totalSaleBuyers={allBuyers?.filter(b => b.listing_type === 'For Sale').length || 0}
        totalRentBuyers={allBuyers?.filter(b => b.listing_type === 'For Rent').length || 0}
        onSave={() => {}}
        limitReached={false}
      />
    </>
  );
}
