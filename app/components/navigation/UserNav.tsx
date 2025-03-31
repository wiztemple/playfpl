'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { CreditCard, LogOut, Settings, User as UserIcon } from 'lucide-react';

interface UserNavProps {
  user: User;
}

export default function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-indigo-500/30 bg-gray-900">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ''} />
            <AvatarFallback className="bg-indigo-950 text-indigo-200 text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-1 bg-gray-900 border border-gray-800" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-200">
              {user?.user_metadata?.name || user?.email}
            </p>
            <p className="text-xs leading-none text-gray-400">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        <Link href="/profile" onClick={() => setIsOpen(false)}>
          <DropdownMenuItem className="cursor-pointer text-gray-300 focus:bg-gray-800 focus:text-indigo-300">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/wallet" onClick={() => setIsOpen(false)}>
          <DropdownMenuItem className="cursor-pointer text-gray-300 focus:bg-gray-800 focus:text-indigo-300">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Wallet</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/settings" onClick={() => setIsOpen(false)}>
          <DropdownMenuItem className="cursor-pointer text-gray-300 focus:bg-gray-800 focus:text-indigo-300">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem 
          className="cursor-pointer text-gray-300 focus:bg-gray-800 focus:text-indigo-300"
          onClick={async () => {
            await supabase.auth.signOut();
            setIsOpen(false);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
