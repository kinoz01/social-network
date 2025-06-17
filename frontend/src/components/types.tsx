export interface CommentInfo {
    commentId: string;
    content: string;
    userID: string;
    img_comment: string;
    postID: string;
    first_name: string;
    last_name: string;
    avatar: string;
    createdAt: string;
    hasReact?: string;
    likesCount: number;
}
export interface Profile {
    email: string;
    username: string;
    profile_pic: string;
    first_name: string;
    last_name: string;
    birthday: string;
    about_me: string;
    account_type: string;
    posts: Post[];
    post_nbr: number;
    total_followers: number;
    total_followings: number;
}
export interface User {
    id: string;
    email: string;
    username?: string;
    profile_pic: string;
    first_name: string;
    last_name: string;
    birthday: string;
    about_me?: string;
    account_type: string;
}

export interface Post {
    id: string;
    userID: string;
    content: string;
    visibility: string;
    imag_post: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    profile_pic: string;
    hasReact?: string;
    totalLikes: number;
    totalComments: number;
}



export interface CommentInfo {
  commentId: string;
  content: string;
  userID: string;
  img_comment: string;
  postID: string;
  first_name: string;
  last_name: string;
  avatar: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userID: string;
  content: string;
  visibility: string;
  imag_post: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  profile_pic: string;
  hasReact?: string;
  totalLikes: number;
  totalComments: number;
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
  totalCount: number;
  totalPages: number;
}

export interface Followers {
  followers: User[];
  totalCount: number;
  totalPages: number;
}

export interface Followings {
  followings: User[];
  totalCount: number;
  totalPages: number;
}

export interface FriendRequest {
  requests: User[];
  totalCount: number;
  totalPages: number;
}