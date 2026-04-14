"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/chat");
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
      <LoginForm />
    </div>
  );
}
