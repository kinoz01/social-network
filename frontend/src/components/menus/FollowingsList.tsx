import { getFollowers, getFollowings } from "@/lib/followers";
import { Followers, Followings } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";

import NoData from "../NoData";
import Loading from "../Loading";

function FollowingsList() {
  var throttleTimer = false;
  const limit = 5;
  const scrollTrigger = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
  const [followings, setFollowings] = useState<Followings>({
    followings: [],
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

    const data: Followings | null = await getFollowings(limit, page);

    if (data && data.followings) {
      if (data.followings.length === 0 || page === data.totalPages) {
        setHasMoreData(false);
      }

      setFollowings((prevData) => {
        const existingIds = new Set(prevData.followings.map((n) => n.id));
        const newFollowing = data.followings.filter(
          (n) => !existingIds.has(n.id)
        );
        return {
          ...prevData,
          followings: [...prevData.followings, ...newFollowing],
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

  // console.log("follofwings: ", followings);

  return (
    <div className={styles.users} ref={scrollTrigger}>
      {followings.followings === null || followings.followings.length === 0 ? (
        <NoData msg="No followings yet" />
      ) : (
        followings.followings.map((following) => {
          return (
            <ListItem key={following.id} type="followers" item={following} />
          );
        })
      )}
      {isDataLoading && <Loading />}
    </div>
  );
}

export default FollowingsList;
