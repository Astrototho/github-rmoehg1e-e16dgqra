export interface Profile {
  id: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  avatar_url?: string | null;
  email?: string | null;
  bio?: string | null;
  strava_username?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AppUser {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  strava_username?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type ActivityType =
  | 'trail'
  | 'course-a-pied'
  | 'velo-route'
  | 'velo'
  | 'vtt';

export interface Activity {
  id: string;
  title: string;
  type: string;
  start_date: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  distance: number;
  elevation: number;
  description?: string;
  organizer_id: string;
  organizer_name: string;
  organizer_avatar: string;
}

export interface Participation {
  id: string;
  user_id: string;
  activity_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface ParticipationWithUser extends Participation {
  user_name: string;
  user_avatar: string;
}

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  receiver_id: string;
  content: string;
}

export interface ConversationPreview {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  lastMessage: string;
  time: string;
}

export type NotificationType =
  | 'message'
  | 'participation_request'
  | 'participation_approved'
  | 'participation_rejected';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
