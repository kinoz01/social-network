export interface User {
  id: string;
  email: string;
  username?: string;
  profile_pic?: string;
  first_name: string;
  last_name: string;
  birthday: string;
  about_me?: string;
  account_type: string;
  followers?: string[];
  followRequests?: string[];
}

export interface NotificationModel {
  id: string;
  receiver: User;
  sender: User;
  content: string;
  createdAt: string;
  group?: string;
  event?: string;
  type?: string;
  isRead?: boolean;
}

export interface NotifcationResponse {
  notifications: NotificationModel[];
  totalCount?: number;
  totalPages?: number;
}

export interface Followers {
  followers: User[];
  totalCount?: number;
  totalPages?: number;
}

export interface Followings {
  followings: User[];
  totalCount?: number;
  totalPages?: number;
}

export interface FriendRequest {
  requests: User[];
  totalCount?: number;
  totalPages?: number;
}
