export type MoveCategory =
  | 'bars'
  | 'sports'
  | 'food'
  | 'music'
  | 'outdoor'
  | 'gaming'
  | 'art'
  | 'social'
  | 'other';

export type RsvpStatus = 'going' | 'maybe' | 'left';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string;
  push_token: string | null;
  referral_code: string | null;
  invited_by: string | null;
  follower_count: number;
  following_count: number;
  moves_created: number;
  created_at: string;
  updated_at: string;
}

export interface MyInvite {
  code: string;
  max_uses: number;
  use_count: number;
  invites_left: number;
}

export interface Referral {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
}

export interface Move {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: MoveCategory;
  location_name: string;
  address: string | null;
  city: string;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  cover_image_url: string | null;
  is_public: boolean;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  vibes: string[];
  created_at: string;
  updated_at: string;
}

export interface MoveWithCounts extends Move {
  attendee_count: number;
  spots_left: number | null;
  is_empty: boolean;
  is_full: boolean;
}

export interface NearbyMove extends MoveWithCounts {
  latitude: number;
  longitude: number;
  distance_m: number;
}

export interface Rsvp {
  id: string;
  move_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
}

export interface MoveAttendee {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface CreateMoveInput {
  title: string;
  description?: string;
  category: MoveCategory;
  location_name: string;
  location_lat: number;
  location_lng: number;
  address?: string;
  starts_at: Date;
  ends_at?: Date;
  max_attendees?: number;
  cover_image_url?: string;
  vibes?: string[];
}

export interface FilterState {
  category: MoveCategory | null;
  radiusMeters: number;
  timeWindow: '12h' | '24h' | '48h';
}

export type InviteValidationResult =
  | { valid: true; codeId: string }
  | { valid: false; reason: 'not_found' | 'used' | 'expired' | 'missing_code' | 'server_error' };

export interface CategoryMeta {
  label: string;
  emoji: string;
  gradient: [string, string];
}

export const CATEGORY_META: Record<MoveCategory, CategoryMeta> = {
  bars: { label: 'Bars & Nightlife', emoji: '🍺', gradient: ['#7C3AED', '#4C1D95'] },
  sports: { label: 'Sports', emoji: '🏀', gradient: ['#059669', '#064E3B'] },
  food: { label: 'Food', emoji: '🍕', gradient: ['#DC2626', '#7F1D1D'] },
  music: { label: 'Music', emoji: '🎵', gradient: ['#0EA5E9', '#0C4A6E'] },
  outdoor: { label: 'Outdoor', emoji: '🌿', gradient: ['#16A34A', '#14532D'] },
  gaming: { label: 'Gaming', emoji: '🎮', gradient: ['#9333EA', '#581C87'] },
  art: { label: 'Art & Culture', emoji: '🎨', gradient: ['#F59E0B', '#78350F'] },
  social: { label: 'Social', emoji: '🥂', gradient: ['#F43F5E', '#881337'] },
  other: { label: 'Other', emoji: '✨', gradient: ['#6B7280', '#374151'] },
};

export const RADIUS_OPTIONS = [
  { label: '1 mi', meters: 1609 },
  { label: '3 mi', meters: 4828 },
  { label: '5 mi', meters: 8047 },
  { label: '10 mi', meters: 16093 },
  { label: '25 mi', meters: 40234 },
];
