'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { User, Settings, LogOut, Wallet } from 'lucide-react';

export default function UserNav() {
  const { data: session } = useSession();
  
  if (!session) return null;
  
  const userInitials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : session.user.email?.charAt(0).toUpperCase() || 'U';
    
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-gray-700 p-1 hover:border-indigo-500 transition-colors duration-200 focus:outline-none">
          <Avatar className="h-8 w-8 bg-gray-800">
            <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
            <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">{userInitials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-800 text-gray-300" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-gray-200">{session.user.name}</p>
            <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-indigo-400">
            <Link href="/profile" className="flex cursor-pointer items-center">
              <User className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-indigo-400">
            <Link href="/wallet" className="flex cursor-pointer items-center">
              <Wallet className="mr-2 h-4 w-4 text-purple-400" />
              <span>Wallet</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-indigo-400">
            <Link href="/profile/settings" className="flex cursor-pointer items-center">
              <Settings className="mr-2 h-4 w-4 text-pink-400" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem 
          className="flex cursor-pointer items-center text-red-400 focus:bg-gray-800 focus:text-red-400" 
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
