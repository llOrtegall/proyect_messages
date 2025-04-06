import RegisterPage from "@/components/register"
import { useAuth } from "./auth/AuthProvider"

function App() {
  const { user } = useAuth()

  if (user) {
    return <div>Welcome {user.username}</div>
  }

  return <RegisterPage />
}

export default App
