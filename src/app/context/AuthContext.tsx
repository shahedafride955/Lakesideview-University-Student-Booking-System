import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('lakeside_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Auto-logout after 5 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    resetTimer();
    events.forEach(event => document.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      // identifier can be user.name, user.id, or user.email
      // password should be user.email
      
      // Try to find user by name, id, or email as identifier
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.eq.${identifier},id.eq.${identifier},email.eq.${identifier}`)
        .maybeSingle();

      if (error || !users) {
        console.error('User not found:', error);
        return false;
      }

      // Check if password matches email
      if (users.email === password) {
        const userData: User = {
          id: users.id,
          name: users.name,
          email: users.email
        };
        setUser(userData);
        localStorage.setItem('lakeside_user', JSON.stringify(userData));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lakeside_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}