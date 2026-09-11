import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const client = axios.create({
  baseURL: '/api',
});

// Every request carries the current Supabase session's access token — our Express
// API verifies it and looks up the matching profile (role/status) itself.
client.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export function getErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => d.message).join(' ');
  }
  return data?.error || error.message || 'Something went wrong.';
}

export default client;
