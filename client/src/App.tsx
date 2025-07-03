import { Route, Router } from "wouter";
import { lazy, Suspense } from "react";

const RegisterPage = lazy(() => import("@/components/register"));
const LoginForm = lazy(() => import("./components/login-form"));
const ChatApp = lazy(() => import("@/app/chat-app"));

function App() {
  return (
    <Router>
      <Suspense fallback={<p>cargando ...</p>}>
        <Route path="/home" component={ChatApp} />
        <Route path="/login" component={LoginForm} />
        <Route path="/register" component={RegisterPage} />
      </Suspense>
    </Router>
  );
}

export default App
