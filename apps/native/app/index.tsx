// Root `/` route — renders nothing. AuthGate in _layout.tsx redirects to
// either /(auth)/login or /(app) once the navigation container is ready.
// We previously used <Redirect> here but it triggered Expo Router's
// "Attempted to navigate before mounting" error by competing with AuthGate.
// Keeping a placeholder file so Expo Router has *some* root match instead of
// rendering an empty Stack on first paint.
export default function Index() {
  return null;
}
