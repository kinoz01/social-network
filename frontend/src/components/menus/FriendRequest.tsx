"use client";

import { getFollowingRequests } from "@/lib/followers";
import { FriendRequest, User } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import NoData from "../NoData";
import Loading from "../Loading";
import { useUser } from "@/context/UserContext";

function FriendRequestList({ profileId }: { profileId?: string }) {
  var throttleTimer = false;
  const limit = 5;
  const { user: loggedUser } = useUser();

  const scrollTrigger = useRef<HTMLDivElement>(null);

  const [currentPage, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
  const [friendRequests, setRequests] = useState<FriendRequest>({
    requests: [],
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

    const data: FriendRequest | null = await getFollowingRequests(
      limit,
      currentPage
    );

    if (data && data.requests) {
      if (data.requests.length === 0 || currentPage === data.totalPages) {
        setHasMoreData(false);
      }

      setRequests((prevData) => {
        const existingIds = new Set(prevData.requests.map((n) => n.id));
        const newRequests = data.requests.filter((n) => !existingIds.has(n.id));
        return {
          ...prevData,
          requests: [...prevData.requests, ...newRequests],
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
  }, [hasMoreData, currentPage, isDataLoading]); // Watch for changes in `hasMoreData` and `isDataLoading`

  useEffect(() => {
    async function initialFetch() {
      await loadMore(); // Initial fetch on component mount
    }
    initialFetch();
  }, []); // Empty dependency array means this only runs once on mount

  return (
    <div className={styles.users} ref={scrollTrigger}>
      {friendRequests.requests === null ||
        friendRequests.requests.length === 0 ? (
        <NoData msg="No Freind Requests yet" />
      ) : (
        friendRequests.requests.map((request) => {
          return (
            <ListItem
              key={request.id}
              type="friendRequests"
              item={request}
              loggedUser={loggedUser}
            />
          );
        })
      )}
      {isDataLoading && <Loading />}
    </div>
  );
}

export default FriendRequestList;
