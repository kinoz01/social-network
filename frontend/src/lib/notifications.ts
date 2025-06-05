import Popup from "@/components/Popup";
import { NotifcationResponse, NotificationModel, User } from "./types";

// getting unread notifications count

async function getNotifications(
  limit?: number,
  page?: number
): Promise<NotifcationResponse | null> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?${
    limit ? `&limit=${limit}` : ""
  }${page ? `&page=${page}` : ""}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(await res.json());
    }

    const data: NotifcationResponse = await res.json();
    console.log("ressssssssss: ", data);

    return data;
  } catch (error) {
    console.log("fetch error", error);
  }
  return null;
}

async function getUnreadNotificationsCount(
  isRead: string
): Promise<number | null> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?isread=${isRead}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(await res.json());
    }

    const data: number = await res.json();
    console.log("ressssssssss: ", data);

    return data;
  } catch (error) {
    console.log("fetch error", error);
  }
  return null;
}

// set a notification  to read after user response
async function updateReadNotification(
  notification: NotificationModel
): Promise<String> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/friendRequest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notification.id,
          receiver: notification.receiver,
          sender: { id: notification.sender.id },
          isRead: true,
        }),
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error(await res.json());
    }

    return await res.json();
  } catch (error) {
    console.log("fetch error", error);
  }

  return "";
}

// add notification
async function addNotification(body: {}, url: String): Promise<string> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${url}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      }
    );
    if (!res.ok) {
      throw new Error(await res.json());
    }

    return await res.json();
  } catch (error) {
    console.log("fetch error", error);
  }
  return "";
}

export {
  getNotifications,
  getUnreadNotificationsCount,
  updateReadNotification,
  addNotification,
};
