const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const isPreviewDemo = process.env.EXPO_PUBLIC_PREVIEW_DEMO === 'true';

if (!backendUrl && !isPreviewDemo) {
  throw new Error(
    '[Config] EXPO_PUBLIC_BACKEND_URL is required but not set. ' +
      'Set it in the Replit Secrets & Environment panel.',
  );
}

export const config = {
  // Preview demo mode is intentionally backend-free; normal mode still
  // requires a real backend URL above.
  backendUrl: backendUrl ? backendUrl.replace(/\/+$/, '') : '',
} as const;
