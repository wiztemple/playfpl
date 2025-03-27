"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

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
    // Compact version for LeagueCard
    return (
      <div className="flex items-center space-x-1.5">
        <Clock className="h-3.5 w-3.5 text-indigo-400" />
        <div className="text-xs font-medium">
          {timeLeft.isExpired ? (
            <span className="text-red-400">Expired</span>
          ) : (
            <span className="text-indigo-300">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          )}
        </div>
      </div>
    );
  }

  // Detailed version for league details page
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <Clock className="h-4 w-4 mr-2 text-indigo-400" />
        <h3 className="text-sm font-medium text-gray-300">{label}</h3>
      </div>
      
      {timeLeft.isExpired ? (
        <div className="text-red-400 font-medium">Expired</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 border border-gray-700 rounded-md p-2 text-center"
          >
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {timeLeft.days}
            </div>
            <div className="text-xs text-gray-400 mt-1">Days</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/70 border border-gray-700 rounded-md p-2 text-center"
          >
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {timeLeft.hours}
            </div>
            <div className="text-xs text-gray-400 mt-1">Hours</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/70 border border-gray-700 rounded-md p-2 text-center"
          >
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {timeLeft.minutes}
            </div>
            <div className="text-xs text-gray-400 mt-1">Minutes</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/70 border border-gray-700 rounded-md p-2 text-center"
          >
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {timeLeft.seconds}
            </div>
            <div className="text-xs text-gray-400 mt-1">Seconds</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}