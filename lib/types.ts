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
}

export interface AppUser {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  strava_username?: string;
}

export interface Activity {
  id: string;
  title: string;
  type: string;
  start_date: string;
  location: string;
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
