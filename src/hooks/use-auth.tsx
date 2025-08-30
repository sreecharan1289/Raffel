"use client";

// This file is no longer used for authentication but is kept 
// to avoid breaking other parts of the application that might import it.
// The authentication logic has been moved to the login and admin pages directly
// using localStorage. This is not a recommended practice for production.

import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (...args: any[]) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const value: AuthContextType = { 
      user: null, 
      loading: true, 
      signIn: async () => {}, 
      signOut: async () => {}
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Mock implementation to avoid errors in components that use this hook.
    return {
        user: null,
        loading: false,
        signIn: async () => { console.warn("SignIn is not implemented in mock Auth."); },
        signOut: async () => { console.warn("SignOut is not implemented in mock Auth."); }
    };
  }
  return context;
};
