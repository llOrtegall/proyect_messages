"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
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
      <RegisterForm />
    </div>
  );
}
