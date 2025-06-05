"use client";

import styles from "./notifications.module.css";
import { useEffect, useRef, useState } from "react";
import Notification from "./Notification";
import Loading from "../Loading";
import NoData from "../NoData";
import { useWS } from "@/context/wsClient";
import { throttle } from "@/lib/utils";

function NotificationDashboard() {
  const limit = 10;
  const scrollTrigger = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
  const { socket, notifications, getNotifications } = useWS();

  const [isDataLoading, setIsDataLoading] = useState(false);



  const loadMore = async () => {

    if (isDataLoading || !hasMoreData) return;

    setIsDataLoading(true);
    getNotifications(page, limit);
    setIsDataLoading(false);

    setPage((prevPage) => prevPage + 1);
  };


  useEffect(() => {
    if (page > 1 && notifications.notifications.length > 0) {
      if (page > notifications.totalPages) {
        setHasMoreData(false);
      }
      setIsDataLoading(false);
    }
  }, [notifications.notifications.length, notifications.totalPages]);


  useEffect(() => {
    const container = scrollTrigger.current;

    if (!container) {
      return;
    }


    const handleScroll = throttle(async () => {

      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10
      ) {
        if (!isDataLoading) {
          loadMore();
        }
      }
    }, 300);


    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMoreData, isDataLoading, page]);


  useEffect(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      loadMore();
    }
  }, [socket]);


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
