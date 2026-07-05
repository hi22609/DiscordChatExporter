/**
 * Hand-authored Supabase schema types.
 *
 * Regenerate with `npm run supabase:types` once a Supabase project exists —
 * until then this mirrors supabase/migrations/ and keeps every query typed.
 */

type MoveCategory =
  | 'bars' | 'sports' | 'food' | 'music' | 'outdoor'
  | 'gaming' | 'art' | 'social' | 'other';
type RsvpStatus = 'going' | 'maybe' | 'left';
type SpotCategory =
  | 'urbex' | 'skate' | 'sunset' | 'view' | 'swim'
  | 'chill' | 'photo' | 'other';

interface ProfileRow {
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

interface MoveRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: MoveCategory;
  location_name: string;
  location_point: unknown; // PostGIS geography — write as WKT string, never read raw
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

interface MoveWithCountsRow extends MoveRow {
  attendee_count: number;
  spots_left: number | null;
  is_empty: boolean;
  is_full: boolean;
}

interface RsvpRow {
  id: string;
  move_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
}

interface InviteCodeRow {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  max_uses: number;
  use_count: number;
  expires_at: string | null;
  created_at: string;
}

interface SpotRow {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  category: SpotCategory;
  location_point: unknown;
  address: string | null;
  city: string;
  cover_image_url: string | null;
  best_time: string | null;
  fire_count: number;
  save_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: 'move' | 'spot' | 'profile';
  target_id: string;
  reason: string;
  created_at: string;
}

interface NearbyMoveResult {
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
  vibes: string[];
  created_at: string;
  updated_at: string;
  attendee_count: number;
  spots_left: number | null;
  is_full: boolean;
  latitude: number;
  longitude: number;
  distance_m: number;
  my_status: string | null;
}

interface NearbySpotResult {
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

type Insertable<Row, Required extends keyof Row> =
  Pick<Row, Required> & Partial<Omit<Row, Required>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, 'id' | 'username'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      moves: {
        Row: MoveRow;
        Insert: Insertable<
          MoveRow,
          'creator_id' | 'title' | 'category' | 'location_name' | 'location_point' | 'starts_at'
        >;
        Update: Partial<MoveRow>;
        Relationships: [];
      };
      rsvps: {
        Row: RsvpRow;
        Insert: Insertable<RsvpRow, 'move_id' | 'user_id'>;
        Update: Partial<RsvpRow>;
        Relationships: [];
      };
      invite_codes: {
        Row: InviteCodeRow;
        Insert: Insertable<InviteCodeRow, 'code'>;
        Update: Partial<InviteCodeRow>;
        Relationships: [];
      };
      spots: {
        Row: SpotRow;
        Insert: Insertable<
          SpotRow,
          'created_by' | 'name' | 'category' | 'location_point'
        >;
        Update: Partial<SpotRow>;
        Relationships: [];
      };
      spot_fires: {
        Row: { spot_id: string; user_id: string; created_at: string };
        Insert: { spot_id: string; user_id: string; created_at?: string };
        Update: Partial<{ spot_id: string; user_id: string }>;
        Relationships: [];
      };
      spot_saves: {
        Row: { spot_id: string; user_id: string; created_at: string };
        Insert: { spot_id: string; user_id: string; created_at?: string };
        Update: Partial<{ spot_id: string; user_id: string }>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Insertable<ReportRow, 'reporter_id' | 'target_type' | 'target_id' | 'reason'>;
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: Partial<{ blocker_id: string; blocked_id: string }>;
        Relationships: [];
      };
    };
    Views: {
      moves_with_counts: {
        Row: MoveWithCountsRow;
      };
    };
    Functions: {
      nearby_moves: {
        Args: {
          lat: number;
          lng: number;
          radius_m?: number;
          filter_cat?: string | null;
          page_offset?: number;
          page_size?: number;
        };
        Returns: NearbyMoveResult[];
      };
      nearby_spots: {
        Args: {
          lat: number;
          lng: number;
          radius_m?: number;
          filter_cat?: string | null;
          page_size?: number;
        };
        Returns: NearbySpotResult[];
      };
      get_spot: {
        Args: { p_spot_id: string };
        Returns: Array<
          Omit<NearbySpotResult, 'distance_m'> & {
            creator_username: string;
            creator_avatar: string | null;
          }
        >;
      };
      search_moves: {
        Args: { query: string; lat?: number | null; lng?: number | null; radius_m?: number };
        Returns: MoveWithCountsRow[];
      };
      get_move_attendees: {
        Args: { p_move_id: string; p_limit?: number };
        Returns: Array<{
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
        }>;
      };
      my_rsvp_status: {
        Args: { p_move_id: string };
        Returns: string | null;
      };
      get_my_upcoming_moves: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          creator_id: string;
          title: string;
          category: MoveCategory;
          location_name: string;
          city: string;
          starts_at: string;
          cover_image_url: string | null;
          attendee_count: number;
          rsvp_status: string;
        }>;
      };
      get_user_moves: {
        Args: { p_user_id: string; include_past?: boolean };
        Returns: MoveWithCountsRow[];
      };
      get_my_invite: {
        Args: Record<string, never>;
        Returns: Array<{
          code: string;
          max_uses: number;
          use_count: number;
          invites_left: number;
        }>;
      };
      get_my_referrals: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          joined_at: string;
        }>;
      };
    };
    Enums: {
      move_category: MoveCategory;
      rsvp_status: RsvpStatus;
      spot_category: SpotCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}
