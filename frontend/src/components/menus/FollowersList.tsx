import { getFollowers } from "@/lib/followers";
import { Followers } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import NoData from "../NoData";
import Loading from "../Loading";

function FollowersList() {
  var throttleTimer = false;
  const limit = 5;
  const scrollTrigger = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
  const [followers, setFollowers] = useState<Followers>({
    followers: [],
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

    const data: Followers | null = await getFollowers(limit, page);

    if (data && data.followers) {
      if (data.followers.length === 0 || page === data.totalPages) {
        setHasMoreData(false);
      }

      setFollowers((prevData) => {
        const existingIds = new Set(prevData.followers.map((n) => n.id));
        const newfollowers = data.followers.filter(
          (n) => !existingIds.has(n.id)
        );
        return {
          ...prevData,
          followers: [...prevData.followers, ...newfollowers],
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

  // console.log("follofwings: ", followers);

  return (
    <div className={styles.users} ref={scrollTrigger}>
      {( followers.followers === null) ||
      followers.followers.length === 0 ? (
        <NoData msg="No Followers yet" />
      ) : (
        followers.followers.map((follower) => {
          return (
            <ListItem key={follower.id} type="followers" item={follower} />
          );
        })
      )}
      {isDataLoading && <Loading />}
    </div>
  );
}

export default FollowersList;
