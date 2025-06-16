import { API_URL } from "@/lib/api_url";
import { User } from "./types";
import { popup } from "./utils";

const fetchUsers = async () => {
  try {
    const res = await fetch(`${API_URL}/api/allUsers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error((await res.json()).msg || "fetch failed");
    }
    const listUsers = await res.json();
    // console.log("fetch users=>", listUsers.Users)

    return listUsers;
  } catch (error) {
    console.error("error fetching users", error);
    return null;
  }
};

async function fetchUser(): Promise<User | null> {
  try {
    const userInfoRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/userInfo`,
      { credentials: "include" }
    );

    console.log("user res: ", userInfoRes.status);

    if (!userInfoRes.ok) return null;

    return await userInfoRes.json();
  } catch (error: any) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

export { fetchUser, fetchUsers };
