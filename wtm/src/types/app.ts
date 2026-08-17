export type MoveCategory =
  | 'just_us'
  | 'the_scene'
  | 'bars'
  | 'sports'
  | 'food'
  | 'music'
  | 'outdoor'
  | 'gaming'
  | 'art'
  | 'social'
  | 'other';

export type RsvpStatus = 'going' | 'maybe' | 'waitlist' | 'left';

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
  /** ISO date string (YYYY-MM-DD). Null until age-gate screen completes. */
  birthdate: string | null;
  /** Instagram or Snapchat @handle — accountability anchor. */
  social_handle: string | null;
  /** Set true by admin when account violates community rules. */
  is_banned: boolean;
  /** Set true by admin after manual photo review. Unlocks invite-code issuance. */
  photo_approved: boolean;
  /** '17-20' | '21-25' — derived from birthdate by DB trigger. */
  age_range: string | null;
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

/**
 * What one member is allowed to see about another. Backed by the
 * `public_profiles` view — `profiles` itself is own-row-only under RLS, so this
 * is the only shape available for anyone but yourself.
 */
export type PublicProfile = Pick<
  Profile,
  | 'id'
  | 'username'
  | 'display_name'
  | 'avatar_url'
  | 'bio'
  | 'city'
  | 'follower_count'
  | 'following_count'
  | 'moves_created'
  | 'created_at'
>;

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
  /** Caller's own RSVP status, resolved server-side in nearby_moves — avoids an RPC per card. */
  my_status: string | null;
  /** RSVP velocity score — drives the "Trending 🔥" badge. Higher = filling faster. */
  hot_score: number;
  /** How many people are currently queued on the waitlist. */
  waitlist_count: number;
  /** Friends already going — whoever invited you, whoever you invited, and
   *  anyone in your squad on this move. Drives the social-proof row on cards. */
  crew_going: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }>;
}

export type ActivityType =
  | 'rsvp_on_your_move'
  | 'squad_confirmed'
  | 'move_trending'
  | 'move_starting_soon'
  | 'waitlist_promoted';

export type ReactionEmoji = '🔥' | '❤️' | '👀' | '💯' | '🙌';

export interface Reaction {
  emoji: ReactionEmoji;
  total: number;
  i_reacted: boolean;
}

export interface ChatMessage {
  id: string;
  move_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor_id: string | null;
  move_id: string | null;
  read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null } | null;
  move: { title: string; category: string } | null;
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

// Order matters: this is the order the picker and the filter bar render in, and
// the first two are the ones the whole product is organised around.
export const CATEGORY_META: Record<MoveCategory, CategoryMeta> = {
  just_us: { label: 'Just Us', emoji: '🛋️', gradient: ['#FF9E3D', '#8A4A12'] },
  the_scene: { label: 'The Scene', emoji: '🌃', gradient: ['#7C3AED', '#2E1065'] },
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

// ---------- Fire Spots (permanent map gems) ----------

export type SpotCategory =
  | 'urbex'
  | 'skate'
  | 'sunset'
  | 'view'
  | 'swim'
  | 'chill'
  | 'photo'
  | 'other';

export interface NearbySpot {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  category: SpotCategory;
  address: string | null;
  city: string;
  cover_image_url: string | null;
  best_time: string | null;
  fire_count: number;
  save_count: number;
  created_at: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  i_fired: boolean;
  i_saved: boolean;
}

export interface SpotDetail extends Omit<NearbySpot, 'distance_m'> {
  creator_username: string;
  creator_avatar: string | null;
}

export interface CreateSpotInput {
  name: string;
  description?: string;
  category: SpotCategory;
  latitude: number;
  longitude: number;
  address?: string;
  best_time?: string;
  cover_image_url?: string;
}

export const SPOT_CATEGORY_META: Record<SpotCategory, CategoryMeta> = {
  urbex: { label: 'Urbex', emoji: '🏚️', gradient: ['#78716C', '#292524'] },
  skate: { label: 'Skate', emoji: '🛹', gradient: ['#F59E0B', '#78350F'] },
  sunset: { label: 'Sunset', emoji: '🌅', gradient: ['#F97316', '#7C2D12'] },
  view: { label: 'Fire View', emoji: '🌆', gradient: ['#8B5CF6', '#4C1D95'] },
  swim: { label: 'Swim', emoji: '💧', gradient: ['#0EA5E9', '#0C4A6E'] },
  chill: { label: 'Chill', emoji: '🌳', gradient: ['#22C55E', '#14532D'] },
  photo: { label: 'Photo Op', emoji: '📸', gradient: ['#EC4899', '#831843'] },
  other: { label: 'Other', emoji: '📍', gradient: ['#6B7280', '#374151'] },
};

export const RADIUS_OPTIONS = [
  { label: '1 mi', meters: 1609 },
  { label: '3 mi', meters: 4828 },
  { label: '5 mi', meters: 8047 },
  { label: '10 mi', meters: 16093 },
  { label: '25 mi', meters: 40234 },
];
