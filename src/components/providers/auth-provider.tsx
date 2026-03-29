"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { User as AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { app } from '@/lib/firebase'; // Ensure firebase is initialized

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // In a real app, you would fetch the user profile from Firestore
        // to get their role and other app-specific data.
        const userRole = fbUser.email?.includes('admin') ? 'Admin' : fbUser.email?.includes('b2c') ? 'B2C' : 'Student';
        const mockUser: AppUser = {
          user_id: fbUser.uid,
          email: fbUser.email!,
          role: userRole,
          displayName: fbUser.displayName || undefined,
          photoURL: fbUser.photoURL || undefined,
          ...(userRole === 'Admin' && { school_id: 'sch_123' }) // Add mock school_id for admin
        };
        setUser(mockUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (loading) return;

    const isPortalRoute = pathname.startsWith('/portal');
    const isLoginPage = pathname === '/portal/login';

    if (isPortalRoute && !user && !isLoginPage) {
      router.push('/portal/login');
    }
    // Optional: redirect logged-in users away from login page
    // if (user && isLoginPage) {
    //   router.push('/portal/admin/dashboard'); 
    // }

  }, [user, loading, pathname, router]);


  if (loading && pathname.startsWith('/portal') && pathname !== '/portal/login') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
