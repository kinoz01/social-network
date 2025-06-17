import { Followers, Followings, FriendRequest, User } from "@/components/types";
import { popup } from "./utils";

async function getProfileInfo(id: string, headers?: {}): Promise<User | null> {
  // Get profile user id from the params objects
  
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/profile/info?id=${id}`;
  
  console.log("id: ", id, url);
  try {
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      console.log("url : ", res.status);
      
      // if (res.status === 404) {
      //   notFound(); 
      // }
      return null;
    }

    const data: User = await res.json();
    console.log("daaaaaata: ", data);
    return data;
  } catch (error: any) {
    console.log("error: ", error);
    // popup(error.msg, false);
  }

  return null;
}

async function addFollower(body: {}, url: string) {
  console.log("heeeeeeeeeere: ", body);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
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
      console.log("here1");
      await addFollower(
        {
          action: followingAction ? "unfollow" : "follow",
          followerID: String(loggedUser?.id),
          followedId: profileUser.id,
        },
        "/api/followers/add"
      );
    } else if (profileUser.account_type === "private") {
      console.log("here2");

      await addFollower(
        {
          action: "friendRequest",
          followerID: String(loggedUser?.id),
          followedId: profileUser.id,
        },
        "/api/followers/add"
      );
      // if (!isFollowed) {
      //   await addNotification(
      //     {
      //       type: "friend request",
      //       content: "New friend request from",
      //       receiver: profileUser.id,
      //       sender: { id: loggedUser?.id },
      //       isRead: false,
      //     },
      //     "friendRequest"
      //   );
      // }
    }
  }
}

async function isUserFollowed(id: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/followers/isfollowed?profileid=${id}`;
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
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/followers/requests?limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw await res.json();
    }

    const data: FriendRequest = await res.json();
    console.log("ressssssssss: ", data);

    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}

async function getFollowers(
  userId: string,
  limit?: number,
  page?: number
): Promise<Followers | null> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/followers?id=${userId}&limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });

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

async function getFollowings(
  userId: string,
  limit?: number,
  page?: number
): Promise<Followings | null> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/followings?id=${userId}&limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw await res.json();
    }

    const data: Followings = await res.json();

    console.log("data: ", data);

    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}

async function getSuggestions(): Promise<User[] | null> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw await res.json();
    }

    const data: User[] = await res.json();

    console.log("data: ", data);

    return data;
  } catch (error: any) {
    console.log("fetch error", error);
    popup(error.msg, false);
  }
  return null;
}

export {
  getProfileInfo,
  addFollower,
  handleFollow,
  isUserFollowed,
  getFollowers,
  getFollowings,
  getFollowingRequests,
  getSuggestions,
};
