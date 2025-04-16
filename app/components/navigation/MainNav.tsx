'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, Wallet, Home, Trophy, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import UserNav from './UserNav';
import Image from 'next/image';

// Define the new button gradient colors
const primaryButtonGradient = "from-[#E83676] to-[#BE0A55]";
const primaryButtonHoverGradient = "hover:from-[#d12f6a] hover:to-[#a8094c]"; // Slightly darker hover

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/70 backdrop-blur-lg border-b border-gray-800/50 shadow-lg' // More opaque on scroll with border
            : 'bg-transparent backdrop-blur-md' // Subtle blur when at top
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center group relative transition-transform duration-200 ease-out hover:scale-105">
                <Image
                  src="/fplstakeslogo.svg"
                  alt="FPL Stakes Logo"
                  width={40} // Slightly adjusted size
                  height={26}
                  className="mr-2" // Adjusted margin
                />
                <span className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                  FPL Stakes
                </span>
              </Link>
              {/* Desktop Navigation */}
              <nav className="ml-10 hidden md:flex items-center space-x-1"> {/* Reduced space */}
                {routes.map((route, index) => {
                  if (route.auth && !session) return null;

                  return (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <Link
                        href={route.href}
                        className={`text-sm font-medium transition-colors relative group flex items-center px-3 py-1.5 rounded-md ${ // Adjusted padding
                          route.active
                            ? 'text-white' // Simpler active state
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center">
                          {/* Keep icon optional or smaller */}
                          {/* {route.icon} */}
                          {route.label}
                        </span>
                        {/* Subtle underline indicator for active link */}
                        {route.active && (
                          <motion.span
                            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r ${primaryButtonGradient}`} // Use primary gradient for indicator
                            layoutId="activeNavIndicatorDesktop"
                          />
                        )}
                        {/* Hover underline effect */}
                        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${primaryButtonGradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center`}></span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3"> {/* Reduced space */}
              {session ? (
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Wallet Button - More subtle */}
                  <Link href="/wallet">
                    <Button
                      variant="ghost" // Changed to ghost
                      size="sm"
                      className="text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors duration-200 flex items-center"
                    >
                      <Wallet className="h-4 w-4 mr-1.5 text-gray-400" /> {/* Adjusted icon style */}
                      Wallet
                    </Button>
                  </Link>
                  <UserNav />
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Sign In Button - More subtle */}
                  <Link href="/auth/signin">
                    <Button
                      variant="ghost" // Changed to ghost
                      size="sm"
                      className="text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors duration-200"
                    >
                      Sign In
                    </Button>
                  </Link>
                  {/* Sign Up Button - Using the new gradient */}
                  <Link href="/auth/signup">
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${primaryButtonGradient} ${primaryButtonHoverGradient} text-white shadow-md shadow-[#BE0A55]/30 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-[#BE0A55]/40 hover:scale-105`}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden text-gray-300 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-lg border border-gray-700/60" // Slightly updated style
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden border-t border-gray-800/50 py-4 bg-black/90 backdrop-blur-xl shadow-2xl" // Darker, more blur
              initial={{ opacity: 0, y: -20 }} // Animate from top
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }} // Faster, smoother ease
            >
              <div className="container mx-auto px-4 space-y-2"> {/* Reduced space */}
                {routes.map((route, index) => {
                  if (route.auth && !session) return null;

                  return (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }} // Faster stagger
                    >
                      <Link
                        href={route.href}
                        className={`block text-base font-medium transition-colors hover:text-white py-2.5 px-3 rounded-lg ${ // Adjusted padding/text size
                          route.active
                            ? 'text-white bg-gradient-to-r from-gray-800/50 to-gray-900/30' // Subtle active background
                            : 'text-gray-400'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center">
                          {/* {route.icon} */} {/* Icons might clutter mobile view */}
                          {route.label}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile Auth Buttons */}
                <div className="pt-3 border-t border-gray-800/50 mt-3 flex flex-col space-y-3">
                  {session ? (
                    <>
                      {/* Mobile Wallet Button */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <Link href="/wallet" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full border-gray-700/80 bg-gray-800/40 text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200 flex items-center justify-center"
                            size="sm"
                          >
                            <Wallet className="h-4 w-4 mr-2 text-gray-400" />
                            Wallet
                          </Button>
                        </Link>
                      </motion.div>
                      {/* Mobile Profile Button */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full border-gray-700/80 bg-gray-800/40 text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200"
                            size="sm"
                          >
                            Profile
                          </Button>
                        </Link>
                      </motion.div>
                      {/* Mobile Sign Out Button */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <Link href="/api/auth/signout" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full border-gray-700/80 bg-gray-800/40 text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200"
                            size="sm"
                          >
                            Sign Out
                          </Button>
                        </Link>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Mobile Sign In Button */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="outline"
                            className="w-full border-gray-700/80 bg-gray-800/40 text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-200"
                            size="sm"
                          >
                            Sign In
                          </Button>
                        </Link>
                      </motion.div>
                      {/* Mobile Sign Up Button */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                        <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                          <Button
                            className={`w-full bg-gradient-to-r ${primaryButtonGradient} ${primaryButtonHoverGradient} text-white shadow-md shadow-[#BE0A55]/30 transition-all duration-300 ease-out`}
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

      {/* Spacer div */}
      <div className="h-16"></div>
    </>
  );
}