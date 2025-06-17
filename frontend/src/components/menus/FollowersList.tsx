"use client";

import { getFollowers, getProfileInfo } from "@/lib/followers";
import { useEffect, useRef, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import Loading from "../Loading";
import { useUser } from "@/context/UserContext";
import { Followers, User } from "../types";
import { throttle } from "../utils";
import NoData from "../NoData";
import { log } from "console";

function FollowersList({
  page,
  profileId,
}: {
  page?: "home" | "profile";
  profileId?: string;
}) {
  const limit = 5;
  const { user: loggedUser } = useUser();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);


  useEffect(() => {
    const fetchProfileInfo = async () => {
      setIsDataLoading(true);

      const profileInfo = await getProfileInfo(profileId || "");
      setProfileUser(profileInfo);
    };

    fetchProfileInfo();
    setIsDataLoading(false);
  }, [profileId]);


  const user: User | null = page === "home" ? loggedUser : profileUser;

  const scrollTrigger = useRef<HTMLDivElement>(null);
  const [currentPage, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
  const [followers, setFollowers] = useState<Followers>({
    followers: [],
    totalCount: 0,
    totalPages: 0,
  });


  const loadMore = async () => {
    if (isDataLoading || !hasMoreData) {
      return;
    }

    setIsDataLoading(true);

    const data: Followers | null = await getFollowers(
      user?.id || "",
      limit,
      currentPage
    );

    if (data && data.followers) {
      if (data.followers.length === 0 || currentPage === data.totalPages) {
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

    const handleScroll = throttle(async () => {

      if (
        scrollTrigger.current &&
        scrollTrigger.current.scrollTop +
        scrollTrigger.current.clientHeight >=
        scrollTrigger.current.scrollHeight
      ) {
        if (!isDataLoading) {
          await loadMore();
        }
      }
    }, 300);


    const container = scrollTrigger.current;
    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [user, hasMoreData, currentPage, isDataLoading]);

  useEffect(() => {
    async function initialFetch() {
      await loadMore();
    }
    initialFetch();
  }, [user]);



  return (
    <div className={styles.users} ref={scrollTrigger}>
      {followers.followers === null || followers.followers.length === 0 ? (
        <NoData msg="No Followers yet" />
      ) : (
        followers.followers.map((follower) => {
          return (
            <ListItem
              key={follower.id}
              type="followers"
              item={follower}
              loggedUser={loggedUser}
            />
          );
        })
      )}
      {isDataLoading && <Loading />}
    </div>
  );
}

export default FollowersList;
