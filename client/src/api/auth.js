import client from './client';

// Sign-up/sign-in/sign-out themselves go straight to Supabase (see hooks/useAuth.jsx) —
// this file only covers the parts that live in our own API.
export const me = () => client.get('/auth/me').then((r) => r.data);

export const submitOnboarding = (name, requestedRole) =>
  client.patch('/auth/onboarding', { name, requestedRole }).then((r) => r.data);
