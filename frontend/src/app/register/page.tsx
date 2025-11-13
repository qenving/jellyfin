'use client';

import React from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Join Us Today
          </h1>
          <p className="text-white/60">
            Create your account and start watching amazing anime
          </p>
        </div>

        <div className="glass rounded-xl p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
