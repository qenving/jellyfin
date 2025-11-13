'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Welcome Back
          </h1>
          <p className="text-white/60">
            Sign in to continue watching your favorite anime
          </p>
        </div>

        <div className="glass rounded-xl p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
