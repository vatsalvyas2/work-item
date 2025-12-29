
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { User } from '@/lib/types';

const users: User[] = [
    { name: 'Presh Chopra' },
    { name: 'Vatsal Vyas' },
    { name: 'Avinash Mahajan' },
    { name: 'Jatin Malhotra' },
    { name: 'Prince Jha' },
    { name: 'Chethan' },
];

interface UserContextType {
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
