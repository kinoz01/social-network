import { API_URL } from "./api_url";
import { Followers, Followings, FriendRequest, User } from "./types";

async function getProfileInfo(id: string): Promise<User | null> {
  // Get profile user id from the params objects
  const url = `${API_URL}/api/followers/info?profileid=${id}`;

  try {
    const res = await fetch(url, {
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data: User = await res.json();
    console.log("daaaaaata: ", data);
    return data;
  } catch (error) {
    console.log("error: ", error);
  }
  return null;
}

async function addFollower(body: {}, url: string): Promise<String> {
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

    return await res.json();
  } catch (error: any) {
    console.log("fetch error", error);
  }

  return "";
}


async function isUserFollowed(id: string) {
  const url = `${API_URL}/api/followers/isfollowed?profileid=${id}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(await res.json());
    }

    if (!res.ok) {
      throw await res.json();
    }

    return await res.json();
  } catch (error: any) {
    console.log("fetch error", error);
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
      throw new Error(await res.json());
    }

    const data: FriendRequest = await res.json();
    console.log("ressssssssss: ", data);

    return data;
  } catch (error) {
    console.log("fetch error", error);
  }
  return null;
}

async function getFollowers(
  limit?: number,
  page?: number
): Promise<Followers | null> {
  const url = `${API_URL}/api/followers?limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(await res.json());
    }

    const data: Followers = await res.json();

    return data;
  } catch (error) {
    console.log("fetch error", error);
  }
  return null;
}

async function getFollowings(
  limit?: number,
  page?: number
): Promise<Followings | null> {
  const url = `${API_URL}/api/followings?limit=${limit}&page=${page}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(await res.json());
    }

    const data: Followings = await res.json();

    console.log("data: ", data);

    return data;
  } catch (error) {
    console.log("fetch error", error);
  }
  return null;
}

async function getSuggestions(): Promise<User[] | null> {
  const url = `${API_URL}/api/suggestions`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(await res.json());
    }

    const data: User[] = await res.json();
    return data;
  } catch (error) {
    console.log("fetch error", error);
  }
  return null;
}

export {
  getProfileInfo,
  addFollower,
  isUserFollowed,
  getFollowers,
  getFollowings,
  getFollowingRequests,
  getSuggestions,
};
