'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, Wallet, Home, Trophy, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
            ? 'bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/80 shadow-lg shadow-purple-900/10' 
            : 'bg-transparent backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group relative">
                <div className="relative">
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
                  <motion.div
                    className="absolute -top-1 -right-6 text-yellow-400"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                </div>
              </Link>
              <nav className="ml-10 hidden md:flex items-center space-x-6">
                {routes.map((route, index) => {
                  if (route.auth && !session) return null;
                  
                  return (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <Link
                        href={route.href}
                        className={`text-sm font-medium transition-colors relative group flex items-center px-3 py-2 rounded-md ${
                          route.active 
                            ? 'text-white bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-800/30' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                        }`}
                      >
                        <span className="flex items-center">
                          {route.icon}
                          {route.label}
                        </span>
                        {route.active && (
                          <motion.span 
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400"
                            layoutId="activeNavIndicator"
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {session ? (
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
                      className="border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200 backdrop-blur-sm shadow-md shadow-indigo-900/20 flex items-center"
                    >
                      <Wallet className="h-3.5 w-3.5 mr-1.5" />
                      Wallet
                    </Button>
                  </Link>
                  <UserNav />
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
                      className="border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200 backdrop-blur-sm shadow-md shadow-purple-900/20"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/30 transition-all duration-200 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Sign Up</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rotate-180"></span>
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>

            <motion.button
              className="md:hidden text-gray-300 hover:text-indigo-400 transition-colors bg-gray-900/50 p-2 rounded-md border border-gray-800/50"
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        
        {/* Mobile menu with improved glassmorphism and animations */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden border-t border-gray-800/50 py-4 bg-gray-900/95 backdrop-blur-xl shadow-lg shadow-purple-900/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto px-4 space-y-3">
                {routes.map((route, index) => {
                  if (route.auth && !session) return null;
                  
                  return (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={route.href}
                        className={`block text-sm font-medium transition-colors hover:text-indigo-400 py-3 px-4 rounded-lg ${
                          route.active 
                            ? 'text-white bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-800/30' 
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
                  {session ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Link href="/wallet" onClick={() => setIsOpen(false)}>
                          <Button 
                            variant="outline" 
                            className="w-full border-indigo-600/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200 hover:border-indigo-500/60 transition-all duration-200 backdrop-blur-sm flex items-center justify-center shadow-md shadow-indigo-900/10" 
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
                            className="w-full border-gray-700/70 text-gray-300 hover:bg-gray-800/70 hover:text-indigo-400 transition-all duration-200 shadow-md shadow-gray-900/10" 
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
                        <Link href="/api/auth/signout" onClick={() => setIsOpen(false)}>
                          <Button 
                            variant="outline" 
                            className="w-full border-gray-700/70 text-gray-300 hover:bg-gray-800/70 hover:text-indigo-400 transition-all duration-200 shadow-md shadow-gray-900/10" 
                            size="sm"
                          >
                            Sign Out
                          </Button>
                        </Link>
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
                            className="w-full border-purple-600/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 hover:border-purple-500/60 transition-all duration-200 backdrop-blur-sm shadow-md shadow-purple-900/10" 
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
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/30 transition-all duration-200 relative overflow-hidden group" 
                            size="sm"
                          >
                            <span className="relative z-10">Sign Up</span>
                            <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rotate-180"></span>
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