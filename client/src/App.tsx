import RegisterPage from "@/components/register"
import { useAuth } from "./auth/AuthProvider"
import ChatApp from "@/app/chat-app"

function App() {
  const { user } = useAuth()

  if (user) {
    return <ChatApp />
  }

  return <RegisterPage />
}

export default App
