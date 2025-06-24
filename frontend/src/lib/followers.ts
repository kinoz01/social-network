import { Followers, Followings, FriendRequest, User } from "./types";
import { popup } from "./utils";
import { API_URL } from "./api_url";


async function addFollower(body: {}, url: string) {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      throw await res.json();
    }
  } catch (error: any) {
    popup(error.msg, false);
  }
}

async function handleFollow(
  profileUser: User | null,
  loggedUser: User | null,
  followingAction: Boolean,
  isFollowed: Boolean
) {
  if (profileUser) {
    if (
      profileUser.account_type === "public" ||
      (profileUser.account_type === "private" && isFollowed)
    ) {
      await addFollower(
        {
          action: followingAction ? "unfollow" : "follow",
          followerID: String(loggedUser?.id),
          followedId: profileUser.id,
        },
        "/api/followers/add"
      );
    } else if (profileUser.account_type === "private") {
      await addFollower(
        {
          action: "friendRequest",
          followerID: String(loggedUser?.id),
          followedId: profileUser.id,
        },
        "/api/followers/add"
      );
    }
  }
}

async function isUserFollowed(id: string) {
  const url = `${API_URL}/api/followers/isfollowed?profileid=${id}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw await res.json();
    }

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
}

async function getFollowingRequests(
  limit?: number,
  page?: number
): Promise<FriendRequest | null> {
  const url = `${API_URL}/api/followers/requests?limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw await res.json();
    }

    const data: FriendRequest = await res.json();

    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}


async function getProfileInfo(id: string, headers?: {}): Promise<User | null> {
  // Get profile user id from the params objects
  const url = `${API_URL}/api/profileData/${id}`;

  try {
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data: User = await res.json();
    return data;
  } catch (error: any) {
    console.log("error: ", error);
    // popup(error.msg, false);
  }

  return null;
}

async function getFollowers(
  userId: string,
  limit?: number,
  page?: number
): Promise<Followers | "private" | null> {
  
  const url = `${API_URL}/api/followers?id=${userId}&limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 206) return "private"; 
    if (!res.ok) {
      throw await res.json();
    }

    const data: Followers = await res.json();

    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}


async function getSuggestions(): Promise<User[] | null> {
  const url = `${API_URL}/api/suggestions`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw await res.json();
    }
    if (res.status === 204) {
      return [];
    }
    const data: User[] = await res.json();
    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}

async function getFollowings(
  userId: string,
  limit?: number,
  page?: number
): Promise<Followings | "private" | null> {
  const url = `${API_URL}/api/followings?id=${userId}&limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 206) return "private"; 
    if (!res.ok) {
      throw await res.json();
    }

    const data: Followings = await res.json();

    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}

export {
  addFollower,
  handleFollow,
  isUserFollowed,
  getFollowingRequests,
  getSuggestions,
  getFollowers,
  getFollowings,
  getProfileInfo
};
