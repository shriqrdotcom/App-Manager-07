const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error(
    '[Config] EXPO_PUBLIC_BACKEND_URL is required but not set. ' +
      'Copy .env.example to .env.local and set the value.',
  );
}

export const config = {
  backendUrl: backendUrl.replace(/\/+$/, ''),
} as const;
