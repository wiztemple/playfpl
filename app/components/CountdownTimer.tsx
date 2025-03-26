"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetDate: string | Date;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
      };
    };

    setTimeRemaining(calculateTimeRemaining());

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="w-12 h-12 flex items-center justify-center bg-gray-800/70 border border-gray-700 rounded-md shadow-inner"
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 0 8px 0 rgba(99, 102, 241, 0.3)",
          borderColor: "rgba(99, 102, 241, 0.5)",
        }}
      >
        <span className="text-lg font-bold">{value.toString().padStart(2, "0")}</span>
      </motion.div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </motion.div>
  );

  if (isExpired) {
    return (
      <div className="text-red-400 font-medium">
        Expired
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <TimeUnit value={timeRemaining.days} label="Days" />
      <span className="text-gray-500 mx-1">:</span>
      <TimeUnit value={timeRemaining.hours} label="Hours" />
      <span className="text-gray-500 mx-1">:</span>
      <TimeUnit value={timeRemaining.minutes} label="Mins" />
      <span className="text-gray-500 mx-1">:</span>
      <TimeUnit value={timeRemaining.seconds} label="Secs" />
    </div>
  );
}