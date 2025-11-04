'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from 'next-themes';

const adminAvatar = PlaceHolderImages.find(img => img.id === 'avatar-admin');

export function AppHeader() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  const getPageTitle = () => {
    const segment = pathname.split('/').pop();
    if (!segment) return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
  };

  return (
    header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
      SidebarTrigger className="md:hidden" />
      h1 className="hidden text-lg font-semibold md:block font-headline">{getPageTitle()}h1>
      div className="ml-auto flex items-center gap-2">
        Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          span className="sr-only">Toggle themespan>
        Button>
        DropdownMenu>
          DropdownMenuTrigger asChild>
            Button variant="ghost" className="flex items-center gap-2">
              Avatar className="h-8 w-8">
                {adminAvatar && AvatarImage src={adminAvatar.imageUrl} data-ai-hint={adminAvatar.imageHint} />}
                AvatarFallback>DAAvatarFallback>
              Avatar>
              span className="hidden sm:inline">Demo Adminspan>
              ChevronDown className="h-4 w-4 text-muted-foreground" />
            Button>
          DropdownMenuTrigger>
          DropdownMenuContent align="end">
            DropdownMenuLabel>My AccountDropdownMenuLabel>
            DropdownMenuSeparator />
            DropdownMenuItem>SettingsDropdownMenuItem>
            DropdownMenuItem>SupportDropdownMenuItem>
            DropdownMenuSeparator />
            DropdownMenuItem>LogoutDropdownMenuItem>
          DropdownMenuContent>
        DropdownMenu>
      div>
    header>
  );
}
