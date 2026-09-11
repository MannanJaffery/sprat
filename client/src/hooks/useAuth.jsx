import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // `user` is our own `profiles` row (id, name, email, role, status, user_group_id) —
  // everything downstream keeps working exactly as before. It's null both while
  // signed out and momentarily while a just-created Supabase session hasn't been
  // picked up by the backend yet.
  const refresh = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        return;
      }
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refresh();
  }, [refresh]);

  // Returns { needsEmailConfirmation: true } if Supabase requires the user to
  // confirm their email before a session exists yet.
  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) return { needsEmailConfirmation: true };
    await refresh();
    return { needsEmailConfirmation: false };
  }, [refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const resetPasswordForEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }, []);

  const submitOnboarding = useCallback(async (name, requestedRole) => {
    const profile = await authApi.submitOnboarding(name, requestedRole);
    setUser(profile);
    return profile;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signUp, logout, resetPasswordForEmail, submitOnboarding, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
