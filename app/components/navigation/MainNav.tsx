'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Wallet, Home, Trophy, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import UserNav from './UserNav';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the current user from Supabase
  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
      
      // Set up auth state change listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    getUser();
  }, []);

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const routes = [
    {
      href: '/',
      label: 'Home',
      icon: <Home className="h-4 w-4 mr-1.5" />,
      active: pathname === '/',
    },
    {
      href: '/leagues/weekly',
      label: 'Weekly Leagues',
      icon: <Trophy className="h-4 w-4 mr-1.5" />,
      active: pathname === '/leagues/weekly' || pathname.startsWith('/leagues/weekly/'),
    },
    {
      href: '/leagues/my-leagues',
      label: 'My Leagues',
      icon: <Trophy className="h-4 w-4 mr-1.5" />,
      active: pathname === '/leagues/my-leagues',
      auth: true,
    },
    {
      href: '/how-it-works',
      label: 'How It Works',
      icon: <HelpCircle className="h-4 w-4 mr-1.5" />,
      active: pathname === '/how-it-works',
    },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 shadow-lg shadow-black/20' 
            : 'bg-transparent backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group relative">
                <motion.span 
                  className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  FPL Stakes
                </motion.span>
                <motion.div 
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 w-0 group-hover:w-full transition-all duration-300"
                  initial={{ width: 0 }}
                  animate={{ width: scrolled ? "100%" : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
              <nav className="ml-10 hidden md:flex items-center space-x-6">
                {routes.map((route, index) => {
                  if (route.auth && !user) return null;
                  
                  return (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <Link
                        href={route.href}
                        className={`text-sm font-medium transition-colors relative group flex items-center ${
                          route.active ? 'text-indigo-400' : 'text-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          {route.icon}
                          {route.label}
                        </span>
                        <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300 group-hover:w-full ${
                          route.active ? 'w-full' : 'w-0'
                        }`}></span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <motion.div 
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link href="/wallet">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200 backdrop-blur-sm shadow-sm flex items-center"
                    >
                      <Wallet className="h-3.5 w-3.5 mr-1.5" />
                      Wallet
                    </Button>
                  </Link>
                  <UserNav user={user} />
                </motion.div>
              ) : (
                <motion.div 
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link href="/auth/signin">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200 backdrop-blur-sm shadow-sm"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all duration-200 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Sign Up</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>

            <motion.button
              className="md:hidden text-gray-300 hover:text-indigo-400 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
        
        {/* Mobile menu with improved glassmorphism and animations */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden border-t border-gray-800/50 py-4 bg-gray-900/95 backdrop-blur-xl shadow-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto px-4 space-y-3">
                {routes.map((route, index) => {
                  if (route.auth && !user) return null;
                  
                  return (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={route.href}
                        className={`block text-sm font-medium transition-colors hover:text-indigo-400 py-3 px-2 rounded-md ${
                          route.active 
                            ? 'text-indigo-400 bg-indigo-900/20 border-l-2 border-indigo-500 pl-3' 
                            : 'text-gray-300'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center">
                          {route.icon}
                          {route.label}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
                
                <div className="pt-4 border-t border-gray-800/50 mt-4 flex flex-col space-y-3">
                  {user ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Link href="/wallet" onClick={() => setIsOpen(false)}>
                          <Button 
                            variant="outline" 
                            className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200 backdrop-blur-sm flex items-center justify-center" 
                            size="sm"
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallet
                          </Button>
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                          <Button 
                            variant="outline" 
                            className="w-full border-gray-700/70 text-gray-300 hover:bg-gray-800/70 hover:text-indigo-400 transition-all duration-200" 
                            size="sm"
                          >
                            Profile
                          </Button>
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full border-gray-700/70 text-gray-300 hover:bg-gray-800/70 hover:text-indigo-400 transition-all duration-200" 
                          size="sm"
                          onClick={async () => {
                            await supabase.auth.signOut();
                            setIsOpen(false);
                          }}
                        >
                          Sign Out
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                          <Button 
                            variant="outline" 
                            className="w-full border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200 backdrop-blur-sm" 
                            size="sm"
                          >
                            Sign In
                          </Button>
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                          <Button 
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all duration-200" 
                            size="sm"
                          >
                            Sign Up
                          </Button>
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* This div creates space below the fixed header for all pages */}
      <div className="h-16"></div>
    </>
  );
}