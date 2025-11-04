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
import { Bell, ChevronDown, Moon, Search, Sun } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from 'next-themes';
import { Input } from '../ui/input';

const adminAvatar = PlaceHolderImages.find(img => img.id === 'avatar-admin');

export function AppHeader() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      
      <div className="hidden md:flex items-center gap-2">
        <h1 className="text-xl font-bold text-foreground font-headline">Hello, Demo Admin</h1>
        <p className="text-muted-foreground text-sm">Welcome back!</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="w-full md:w-64 pl-10 rounded-full bg-input/80" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-full">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-full p-1 h-auto">
              <Avatar className="h-9 w-9 border-2 border-primary/50">
                {adminAvatar && <AvatarImage src={adminAvatar.imageUrl} data-ai-hint={adminAvatar.imageHint} />}
                <AvatarFallback>DA</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-semibold">Demo Admin</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
