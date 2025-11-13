import React from 'react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-anime-dark border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-anime flex items-center justify-center font-bold text-xl">
                A
              </div>
              <span className="text-xl font-bold gradient-text">
                Anime Platform
              </span>
            </div>
            <p className="text-white/60 text-sm">
              Your ultimate destination for streaming anime content.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/anime" className="text-white/60 hover:text-anime-purple transition-colors">
                  Browse Anime
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-white/60 hover:text-anime-purple transition-colors">
                  My Watchlist
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-white/60 hover:text-anime-purple transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-white/60 hover:text-anime-purple transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-anime-purple transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-anime-purple transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-white/60 hover:text-anime-purple transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-anime-purple transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-anime-purple transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          <p>&copy; {currentYear} Anime Platform. All rights reserved.</p>
          <p className="mt-2">Powered by Jellyfin</p>
        </div>
      </div>
    </footer>
  );
}
