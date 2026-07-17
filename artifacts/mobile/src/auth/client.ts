import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { config } from '@/config';

export const authClient = createAuthClient({
  baseURL: config.backendUrl,
  plugins: [
    expoClient({
      scheme: 'exzibo-manager',
      storagePrefix: 'exzibo-manager',
      storage: SecureStore,
    }),
  ],
});
