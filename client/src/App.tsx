import { AuthProvider } from "./auth/AuthProvider";
import { Route, Router } from "wouter";
import { lazy, Suspense } from "react";

const RegisterPage = lazy(() => import("@/app/register"));
const LoginForm = lazy(() => import("@/app/login"));
const ChatApp = lazy(() => import("@/app/chat-app"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<p>cargando ...</p>}>
          <Route path="/home" component={ChatApp} />
          <Route path="/login" component={LoginForm} />
          <Route path="/register" component={RegisterPage} />
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App
