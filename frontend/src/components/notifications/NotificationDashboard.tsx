"use client";

import { NotifcationResponse, User, NotificationModel } from "@/lib/types";
import styles from "./notifications.module.css";
import { useEffect, useRef, useState } from "react";
import Notification from "./Notification";
import { NotificationIcon } from "../icons";
import { getNotifications } from "@/lib/notifications";
import Loading from "../Loading";
import NoData from "../NoData";

function NotificationDashboard() {
  var throttleTimer = false;
  const limit = 7;
  const scrollTrigger = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
  const [notifications, setNotifications] = useState<NotifcationResponse>({
    notifications: [],
    totalCount: 0,
    totalPages: 0,
  });

  const throttle = (callback: Function, time: number) => {
    if (throttleTimer) return;
    throttleTimer = true;
    setTimeout(() => {
      callback();
      throttleTimer = false;
    }, time);
  };

  const [isDataLoading, setIsDataLoading] = useState(false);

  const loadMore = async () => {
    // Prevent multiple fetches when data is already loading
    if (isDataLoading || !hasMoreData) {
      return;
    }

    setIsDataLoading(true); // Mark loading start

    const data: NotifcationResponse | null = await getNotifications(
      limit,
      page
    );

    if (data && data.notifications) {
      console.log(
        "has more data: ",
        page,
        data.notifications.length,
        data.totalPages
      );

      if (data.notifications.length === 0 || page === data.totalPages) {
        setHasMoreData(false);
      }

      setNotifications((prevData) => {
        const existingIds = new Set(prevData.notifications.map((n) => n.id));
        const newNotifications = data.notifications.filter(
          (n) => !existingIds.has(n.id)
        );
        return {
          ...prevData,
          notifications: [...prevData.notifications, ...newNotifications],
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        };
      });

      setPage((prevPage) => prevPage + 1);
    }

    setIsDataLoading(false);
  };

  useEffect(() => {
    if (!scrollTrigger.current || !hasMoreData) {
      return;
    }

    const handleScroll = () => {
      throttle(() => {
        if (
          scrollTrigger.current &&
          scrollTrigger.current.scrollTop +
            scrollTrigger.current.clientHeight >=
            scrollTrigger.current.scrollHeight
        ) {
          // If we've reached the bottom and not loading data, trigger loadMore
          if (!isDataLoading) {
            loadMore();
          }
        }
      }, 300);
    };

    // Attach the scroll event listener
    const container = scrollTrigger.current;
    container.addEventListener("scroll", handleScroll);

    // Cleanup the scroll event listener
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasMoreData, page, isDataLoading]); // Watch for changes in `hasMoreData` and `isDataLoading`

  useEffect(() => {
    async function initialFetch() {
      await loadMore(); // Initial fetch on component mount
    }
    initialFetch();
  }, []); // Empty dependency array means this only runs once on mount

  return (
    <div className={styles.notificationDashboard}>
      <div className={styles.notifications} ref={scrollTrigger}>
        {notifications.notifications.length > 0 ? (
          notifications.notifications.map((notification) => (
            <Notification key={notification.id} notification={notification} />
          ))
        ) : (
          <div className={styles.noNotifications}>
            <NoData msg="No Notifications Yet!" />
          </div>
        )}
        {isDataLoading && <Loading />}
      </div>
    </div>
  );
}

export default NotificationDashboard;
