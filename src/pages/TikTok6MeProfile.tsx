import React from 'react';
import UserProfileView from '@/components/tiktok6/UserProfileView';

/**
 * TikTok6 User Profile Page
 * Accessible via /me route.
 */
export default function UserProfilePage() {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <UserProfileView />
    </div>
  );
}
