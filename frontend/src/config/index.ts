const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error(
    '[Config] EXPO_PUBLIC_BACKEND_URL is required but not set. ' +
      'Set it in the Replit Secrets & Environment panel.',
  );
}

export const config = {
  backendUrl: backendUrl.replace(/\/+$/, ''),
} as const;
