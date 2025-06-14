import { FollowShip, FriendRequest, User } from "./types";
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

    popup(await res.json(), true);
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

async function getFollowShip(
  type: string,
  userId: string,
  limit?: number,
  page?: number
): Promise<FollowShip | null> {
  const url = `${API_URL}/api/getfollows?kind=${type == "follower" ? "followers": "followings"}&id=${userId}&limit=${limit}&page=${page}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 206) {
      throw Object.assign(new Error("private profile"), { status: 206 });
    } else if (!res.ok) {
      throw await res.json();
    }
    const data: FollowShip = await res.json();

    return data;
  } catch (error: any) {
    throw error
  }
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

export {
  addFollower,
  handleFollow,
  isUserFollowed,
  getFollowingRequests,
  getSuggestions,
  getFollowShip
};
