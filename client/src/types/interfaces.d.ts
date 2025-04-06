export interface User {
  id: string
  username: string
}

export interface IAuthContext {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}