import RegisterPage from "@/components/register"
import LoginForm from "./components/login-form"
import { useAuth } from "./auth/AuthProvider"
import { Route, Router } from "wouter"
import ChatApp from "@/app/chat-app"

function App() {
  const { user } = useAuth()

  return (
    <div>
      <Router>
        <Route path="/home" component={ChatApp} />
        <Route path="/login" component={LoginForm} />
        <Route path="/register" component={RegisterPage} />
      </Router>
    </div>
  )
}

export default App
