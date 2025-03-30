import { signOut } from 'next-auth/react';

export async function fetchWithSessionCheck(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  // Check if the response indicates a session expiration
  if (response.status === 401) {
    try {
      const data = await response.json();
      if (data.code === 'SESSION_EXPIRED') {
        // Session expired, sign out the user
        await signOut({ redirect: true, callbackUrl: '/login' });
        return null;
      }
    } catch (error) {
      // If we can't parse the JSON, just continue with normal error handling
    }
  }
  
  return response;
}