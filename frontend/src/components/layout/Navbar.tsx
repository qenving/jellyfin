'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: '/anime', label: 'Anime' },
        { href: '/watchlist', label: 'Watchlist' },
        { href: '/profile', label: 'Profile' },
      ]
    : [
        { href: '/login', label: 'Login' },
        { href: '/register', label: 'Register' },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? '/anime' : '/'} className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-anime flex items-center justify-center font-bold text-xl">
              A
            </div>
            <span className="text-xl font-bold gradient-text">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Anime Platform'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg transition-all duration-200',
                  pathname === link.href
                    ? 'bg-anime-purple text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-anime flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm">{user?.displayName || user?.username}</span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    href="/profile"
                    className="block px-4 py-3 hover:bg-white/10 transition-colors rounded-t-lg"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors rounded-b-lg text-red-400"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg mb-2 transition-all duration-200',
                  pathname === link.href
                    ? 'bg-anime-purple text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-white/10"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
