"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Hourglass } from "lucide-react";

interface CountdownProps {
  targetDate: Date | string;
  variant?: "card" | "detail";
  label?: string;
  onComplete?: () => void;
}

export default function Countdown({
  targetDate,
  variant = "detail",
  label = "Time Remaining",
  onComplete
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onComplete) onComplete();
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (variant === "card") {
    // Enhanced compact version for LeagueCard
    return (
      <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 px-2.5 py-1.5 rounded-full border border-indigo-500/30">
        <Clock className="h-3.5 w-3.5 text-pink-400" />
        <div className="text-xs font-medium">
          {timeLeft.isExpired ? (
            <span className="text-red-400 font-semibold">Expired</span>
          ) : (
            <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent font-semibold">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          )}
        </div>
      </div>
    );
  }

  // Enhanced detailed version with animations and color
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 via-indigo-950/50 to-purple-950/50 backdrop-blur-md border border-indigo-500/30 rounded-xl p-5 shadow-lg">
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="flex items-center mb-4">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mr-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2 rounded-full"
        >
          <Hourglass className="h-5 w-5 text-pink-400" />
        </motion.div>
        <h3 className="text-sm font-medium bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
          {label}
        </h3>
      </div>
      
      {timeLeft.isExpired ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-400 font-bold text-center py-4 bg-red-900/20 rounded-lg border border-red-500/30"
        >
          Time Expired
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {/* Days */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-3 text-center border border-indigo-500/30 shadow-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <motion.div 
              animate={{ y: timeLeft.seconds % 2 === 0 ? -2 : 0 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent"
            >
              {String(timeLeft.days).padStart(2, '0')}
            </motion.div>
            <div className="text-xs text-indigo-300 mt-1 font-medium">Days</div>
          </motion.div>
          
          {/* Hours */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-3 text-center border border-blue-500/30 shadow-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <motion.div 
              animate={{ y: timeLeft.seconds % 2 === 0 ? 0 : -2 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent"
            >
              {String(timeLeft.hours).padStart(2, '0')}
            </motion.div>
            <div className="text-xs text-blue-300 mt-1 font-medium">Hours</div>
          </motion.div>
          
          {/* Minutes */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-3 text-center border border-purple-500/30 shadow-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <motion.div 
              animate={{ y: timeLeft.seconds % 2 === 0 ? -2 : 0 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"
            >
              {String(timeLeft.minutes).padStart(2, '0')}
            </motion.div>
            <div className="text-xs text-purple-300 mt-1 font-medium">Minutes</div>
          </motion.div>
          
          {/* Seconds */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="relative overflow-hidden bg-gradient-to-br from-pink-600/20 to-red-600/20 rounded-xl p-3 text-center border border-pink-500/30 shadow-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-red-300 bg-clip-text text-transparent"
            >
              {String(timeLeft.seconds).padStart(2, '0')}
            </motion.div>
            <div className="text-xs text-pink-300 mt-1 font-medium">Seconds</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}