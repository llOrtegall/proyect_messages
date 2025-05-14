export interface User {
  id: string
  username: string
}

export interface IAuthContext {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

export interface Message {
  content: string
  from: string
  to: string
  file?: boolean
}

export interface UserChat {
  id: string
  username: string
}

export interface File {
  name: string
  from: string
  to: string
  info: {
    type: string
    size: number
  }
}

export interface MessageData {
  type: string
  data?: UserChat[] | Message | File
}