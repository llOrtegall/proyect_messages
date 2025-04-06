import { createContext, useContext, useState } from 'react'

interface User {
  id: string
  username: string
}

interface IAuthContext {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

const AuthContext = createContext<IAuthContext | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  // useEffect(() => {
  //   const cookie = document.cookie


  //   axios.get(`${LOGIN_URL}/profile`, { params: { app: APP_NAME } })
  //     .then(res => {
  //       if (res.status === 200) {
  //         setIsAuthenticated(true)
  //         setUser(res.data)
  //       }
  //     })
  //     .catch(error => {
  //       if (error.response.status === 401) {
  //         setIsAuthenticated(false)
  //         setUser(InitialUser)
  //       }
  //     })
  // }, [isAuthenticated])

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