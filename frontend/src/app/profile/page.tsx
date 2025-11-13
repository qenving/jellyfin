'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { UserProfile, UserStats } from '@/types/user';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get<UserProfile>('/user/profile'),
        api.get<UserStats>('/user/stats'),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setDisplayName(profileRes.data.displayName || profileRes.data.username);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      await api.put('/user/profile', { displayName });
      await refreshUser();
      setIsEditing(false);
      await loadProfileData();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 gradient-text">My Profile</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <div className="glass rounded-lg p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-anime flex items-center justify-center text-4xl font-bold mb-4">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold">
                    {profile?.displayName || profile?.username}
                  </h2>
                  <p className="text-white/60">@{profile?.username}</p>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Total Watched</span>
                      <span className="font-bold">{stats.totalWatched}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Watchlist</span>
                      <span className="font-bold">{stats.totalWatchlist}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Completed</span>
                      <span className="font-bold">{stats.totalCompleted}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Account Information */}
              <div className="glass rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Account Information</h3>
                  {!isEditing && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      label="Display Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />

                    <div className="flex gap-4">
                      <Button
                        onClick={handleUpdateProfile}
                        isLoading={isLoading}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(profile?.displayName || profile?.username || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/60 text-sm">Username</p>
                      <p className="font-medium">{profile?.username}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Email</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Display Name</p>
                      <p className="font-medium">
                        {profile?.displayName || profile?.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Member Since</p>
                      <p className="font-medium">
                        {profile?.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences */}
              <div className="glass rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-6">Preferences</h3>
                <p className="text-white/60">
                  Preferences management coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
