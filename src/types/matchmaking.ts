// MODULE 1: The Four-Tier Sovereign Profiles
// Global Human Connection & Matchmaking Platform Type Schema

export type UserProfileType = 'single' | 'married' | 'traveler' | 'interest_group';

export type InterestGroupCategory = 'fitness' | 'tech' | 'faith' | 'business' | 'creative' | 'education';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'premium';

export interface BaseProfile {
  id: string;
  name: string;
  age: number;
  country: string;
  city: string;
  verificationStatus: VerificationStatus;
  reputationScore: number; // 0-100 scale
  nellyCoinBalance: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SingleProfile extends BaseProfile {
  profileType: 'single';
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  interests: string[];
  bio: string;
  lookingFor: string[];
  photos: string[];
}

export interface MarriedProfile extends BaseProfile {
  profileType: 'married';
  spouseName?: string;
  relationshipDuration: number; // in years
  seekingAdvice: boolean;
  interests: string[];
  bio: string;
  photos: string[];
}

export interface TravelerProfile extends BaseProfile {
  profileType: 'traveler';
  currentLocation: string;
  destinations: string[];
  travelStyle: 'adventure' | 'relaxation' | 'cultural' | 'business' | 'solo' | 'group';
  languages: string[];
  bio: string;
  photos: string[];
}

export interface InterestGroupProfile extends BaseProfile {
  profileType: 'interest_group';
  category: InterestGroupCategory;
  groupName: string;
  memberCount: number;
  description: string;
  interests: string[];
  photos: string[];
}

export type MatchmakingProfile = SingleProfile | MarriedProfile | TravelerProfile | InterestGroupProfile;

export interface MatchCompatibility {
  profileId: string;
  targetId: string;
  compatibilityScore: number; // 0-100
  sharedInterests: string[];
  compatibilityFactors: {
    location: number;
    interests: number;
    age: number;
    reputation: number;
  };
}

export interface ConversationMetadata {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'public';
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  totalFeeCollected: number; // NellyCoins collected from conversational fees
}

export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  feeDeducted: number;
  isScamFlagged: boolean;
}
