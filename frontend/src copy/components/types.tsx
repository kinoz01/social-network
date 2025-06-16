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
