import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { FormEvent, useState } from "react";
import { User } from "@/types/interfaces";
import axios from "axios";

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const { setUser } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    axios.post<User>('/login', { username, password })
      .then((response) => {
        const { id, username } = response.data
        const userData: User = { id, username }
        setUser(userData)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const handlClickRegister = () => {
    console.log('clik');
  }

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-md">
        <CardHeader className="flex flex-col items-center gap-2">
          {/* Icono de usuario */}
          <div className="bg-gradient-to-tr from-blue-400 to-pink-400 p-3 rounded-full mb-2 shadow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Login to your account</CardTitle>
          <CardDescription className="text-gray-500">
            Welcome back! Please enter your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="@lortegal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm text-blue-500 underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  placeholder="********"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-pink-400 transition"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow-md hover:scale-105 transition-transform"
                >
                  Login
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Button onClick={handlClickRegister} variant="link" className="px-0 text-pink-500 hover:text-blue-500 transition">
              Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
