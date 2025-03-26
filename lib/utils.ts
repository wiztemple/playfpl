import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Formats a date string for display
 */
export function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'short',
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Calculates time remaining until a specified date
 */
export function calculateTimeRemaining(dateString: string | Date) {
  const targetDate = new Date(dateString);
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();
  
  if (difference <= 0) return 'Started';
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else {
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Formats currency values for display
 */
export const formatCurrency = (amount: number, currency: string = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Creates a debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncates text with ellipsis after a certain length
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Checks if an object is empty
 */
export function isEmptyObject(obj: object) {
  return Object.keys(obj).length === 0;
}

/**
 * Generates a random string (useful for temporary IDs)
 */
export function generateRandomId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Format FPL points for display
 */
export function formatPoints(points: number) {
  return points > 0 ? `+${points}` : String(points);
}

/**
 * Calculate prize amount based on prize pool and percentage
 */
export function calculatePrizeAmount(prizePool: number, percentageShare: number) {
  return Math.floor(prizePool * (percentageShare / 100));
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number, feePercentage = 10) {
  return amount * (feePercentage / 100);
}

/**
 * Get position suffix (1st, 2nd, 3rd, etc.)
 */
export function getPositionSuffix(position: number) {
  if (position === 1) return 'st';
  if (position === 2) return 'nd';
  if (position === 3) return 'rd';
  return 'th';
}

/**
 * Format large numbers with commas
 */
export function formatNumber(number: number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}