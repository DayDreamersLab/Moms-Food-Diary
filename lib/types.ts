export interface Profile {
  id: string;
  username: string;
  display_name: string;
  mom_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: string;
  dish_name: string;
  occasion?: string;
  review: string;
  recipe?: string;
  rating?: number;
  photo_url?: string;
  mood?: string;
  created_at: string;
  profiles?: Profile;
  likes?: Like[];
  like_count?: number;
  user_liked?: boolean;
}

export interface Like {
  id: number;
  user_id: string;
  post_id: number;
  emoji: string;
  created_at: string;
}
