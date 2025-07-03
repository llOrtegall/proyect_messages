import { createContext, useContext, useEffect, useState } from 'react';
import { IAuthContext, User } from '@/types/interfaces';
import axios from 'axios';
import { useLocation } from 'wouter';

const AuthContext = createContext<IAuthContext | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [_, location] = useLocation()

  useEffect(() => {
    axios.get('/profile')
    .then((response) => {
      const { id, username } = response.data
      setUser({ id, username })
      location('/home')
    })
    .catch((error) => {
      if (error.response?.status === 401) {
        setUser(null)
      } else {
        console.error('Error fetching user profile:', error)
      }
    }).finally(() => {
      location('/login')
    })
  }, [])


  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}