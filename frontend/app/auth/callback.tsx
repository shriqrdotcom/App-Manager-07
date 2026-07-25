import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import LoadingScreen from '@/src/components/LoadingScreen';

/**
 * OAuth deep-link callback screen.
 * The Better Auth Expo plugin processes the callback URL and restores the
 * session automatically. This screen shows a brief loading state and then
 * returns to the routing hub (index) which will redirect based on state.
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Give Better Auth a moment to persist the session from the callback URL,
    // then let the AppProvider state machine take over from index.
    const timer = setTimeout(() => {
      router.replace('/');
    }, 800);
    return () => clearTimeout(timer);
  }, [router]);

  return <LoadingScreen message="Completing sign in…" />;
}
