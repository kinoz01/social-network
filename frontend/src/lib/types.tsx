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
    followers?: string[];
    followRequests?: string[];
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
    hasReact?: string;
    likesCount: number;
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

    /* core info */
    type: string;            // "group_invite", "friend request", ...
    content: string;
    createdAt: string;
    isRead: boolean;

    /* actors */
    receiver: string;      // user-ID who should see it
    sender: User;          // sender payload

    /* contextual foreign keys */
    groupId?: string;   // related_group_id
    eventId?: string;   // related_event_id
    invitationId?: string;   // related_invitation_id
    requestId?: string;   // related_request_id
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
