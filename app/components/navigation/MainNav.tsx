'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useSession } from 'next-auth/react';
import UserNav from './UserNav';

export default function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const routes = [
    {
      href: '/',
      label: 'Home',
      active: pathname === '/',
    },
    {
      href: '/leagues/weekly',
      label: 'Weekly Leagues',
      active: pathname === '/leagues/weekly' || pathname.startsWith('/leagues/weekly/'),
    },
    {
      href: '/leagues/my-leagues',
      label: 'My Leagues',
      active: pathname === '/leagues/my-leagues',
      auth: true,
    },
    {
      href: '/how-it-works',
      label: 'How It Works',
      active: pathname === '/how-it-works',
    },
  ];

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                FPL Stakes
              </span>
            </Link>
            <nav className="ml-10 hidden md:flex items-center space-x-6">
              {routes.map((route) => {
                if (route.auth && !session) return null;
                
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                      route.active ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {route.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <Link href="/wallet">
                  <Button variant="outline" size="sm">
                    Wallet
                  </Button>
                </Link>
                <UserNav />
              </>
            ) : (
              <>
                <Link href="/api/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/api/auth/signin">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t py-4">
          <div className="container mx-auto px-4 space-y-3">
            {routes.map((route) => {
              if (route.auth && !session) return null;
              
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`block text-sm font-medium transition-colors hover:text-blue-600 ${
                    route.active ? 'text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {route.label}
                </Link>
              );
            })}
            
            <div className="pt-4 border-t mt-4 flex flex-col space-y-3">
              {session ? (
                <>
                  <Link href="/wallet" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">
                      Wallet
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">
                      Profile
                    </Button>
                  </Link>
                  <Link href="/api/auth/signout" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">
                      Sign Out
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/api/auth/signin" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/api/auth/signin" onClick={() => setIsOpen(false)}>
                    <Button className="w-full" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}