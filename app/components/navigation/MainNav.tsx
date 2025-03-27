'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import UserNav from './UserNav';

export default function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Handle scroll effect for transparent to solid transition
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

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
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-gray-950/90 backdrop-blur-md border-b border-gray-800/80 shadow-lg' 
            : 'bg-transparent backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
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
                      className={`text-sm font-medium transition-colors relative group ${
                        route.active ? 'text-indigo-400' : 'text-gray-300'
                      }`}
                    >
                      {route.label}
                      <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300 group-hover:w-full ${
                        route.active ? 'w-full' : 'w-0'
                      }`}></span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              {session ? (
                <>
                  <Link href="/wallet">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200 backdrop-blur-sm shadow-sm"
                    >
                      Wallet
                    </Button>
                  </Link>
                  <UserNav />
                </>
              ) : (
                <>
                  <Link href="/api/auth/signin">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200 backdrop-blur-sm shadow-sm"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/api/auth/signin">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all duration-200"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden text-gray-300 hover:text-indigo-400 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu with improved glassmorphism */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-800/50 py-4 bg-gray-900/90 backdrop-blur-xl shadow-lg">
            <div className="container mx-auto px-4 space-y-3">
              {routes.map((route) => {
                if (route.auth && !session) return null;
                
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`block text-sm font-medium transition-colors hover:text-indigo-400 py-2 ${
                      route.active ? 'text-indigo-400' : 'text-gray-300'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-800/50 mt-4 flex flex-col space-y-3">
                {session ? (
                  <>
                    <Link href="/wallet" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200 backdrop-blur-sm" 
                        size="sm"
                      >
                        Wallet
                      </Button>
                    </Link>
                    <Link href="/profile" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-700/70 text-gray-300 hover:bg-gray-800/70 hover:text-indigo-400 transition-all duration-200" 
                        size="sm"
                      >
                        Profile
                      </Button>
                    </Link>
                    <Link href="/api/auth/signout" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-700/70 text-gray-300 hover:bg-gray-800/70 hover:text-indigo-400 transition-all duration-200" 
                        size="sm"
                      >
                        Sign Out
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/api/auth/signin" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200 backdrop-blur-sm" 
                        size="sm"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/api/auth/signin" onClick={() => setIsOpen(false)}>
                      <Button 
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all duration-200" 
                        size="sm"
                      >
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
      
      {/* This div creates space below the fixed header for all pages */}
      <div className="h-16"></div>
    </>
  );
}