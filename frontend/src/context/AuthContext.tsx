import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import supabase from '../supabase';

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
}

interface SignupPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authError: string;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<{ emailConfirmationRequired: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const res = await fetch(`${API_URL}/profile?user_id=${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.id) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

async function updateProfile(userId: string, name?: string, phone?: string): Promise<void> {
  const payload: any = { user_id: userId };
  if (name !== undefined) payload.name = name;
  if (phone !== undefined) payload.phone = phone;

  try {
    await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn("Failed to update profile via API", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const manualSignOutRef = useRef(false);

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  const refreshProfile = useCallback(async (userId?: string) => {
    const targetId = userId ?? user?.id;
    if (!targetId) {
      setProfile(null);
      return;
    }

    try {
      const profileData = await fetchProfile(targetId);
      setProfile(profileData);
    } catch (error: any) {
      setProfile(null);
      setAuthError(error.message || 'Unable to load profile.');
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      const activeSession = data.session;
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      if (mounted) {
        setLoading(false);
      }

      if (activeSession?.user?.id) {
        try {
          const profileData = await fetchProfile(activeSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } catch (profileError: any) {
          if (mounted) {
            setAuthError(profileError.message || 'Unable to load profile.');
          }
        }
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        if (event === 'SIGNED_OUT' && !manualSignOutRef.current) {
          setAuthError('Session expired. Please log in again.');
        }
        manualSignOutRef.current = false;
        return;
      }

      manualSignOutRef.current = false;

      if (mounted) {
        setLoading(false);
      }

      try {
        const profileData = await fetchProfile(nextSession.user.id);
        if (mounted) {
          setProfile(profileData);
        }

        if (profileData) {
          const currentMeta = (nextSession.user.user_metadata ?? {}) as {
            name?: string;
            phone?: string;
          };

          const metadataPatch: { name?: string; phone?: string } = {};
          if (!currentMeta.name && profileData.name) {
            metadataPatch.name = profileData.name;
          }
          if (!currentMeta.phone && profileData.phone) {
            metadataPatch.phone = profileData.phone;
          }

          if (metadataPatch.name || metadataPatch.phone) {
            const { error: metadataError } = await supabase.auth.updateUser({ data: metadataPatch });
            if (metadataError && mounted) {
              setAuthError(metadataError.message || 'Unable to sync user metadata.');
            }
          }
        }
      } catch (profileError: any) {
        if (mounted) {
          setProfile(null);
          setAuthError(profileError.message || 'Unable to load profile.');
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      const metadata = data.user.user_metadata;
      if (metadata?.name || metadata?.phone) {
        await updateProfile(data.user.id, metadata.name, metadata.phone);
      }
    }
  }, []);

  const signup = useCallback(async ({ name, phone, email, password }: SignupPayload) => {
    setAuthError('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    const signedUpUser = data.user;
    if (!signedUpUser) {
      return { emailConfirmationRequired: true };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const activeSession = data.session ?? sessionData.session;
    if (!activeSession) {
      // Email confirmation flow: no authenticated session yet, so defer profile writes.
      return { emailConfirmationRequired: true };
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
        phone: phone.trim(),
      },
    });

    if (metadataError) {
      throw metadataError;
    }

    // B) After login/signup, run update to ensure profile is populated:
    await updateProfile(signedUpUser.id, name.trim(), phone.trim());

    await refreshProfile(signedUpUser.id);

    return { emailConfirmationRequired: false };
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    setAuthError('');
    manualSignOutRef.current = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      manualSignOutRef.current = false;
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    loading,
    authError,
    clearAuthError,
    login,
    signup,
    logout,
    refreshProfile,
  }), [authError, clearAuthError, loading, login, logout, profile, refreshProfile, session, signup, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
