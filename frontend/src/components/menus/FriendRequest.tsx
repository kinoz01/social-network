"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useWS } from "@/context/wsClient";
import { getFollowingRequests, addFollower } from "@/lib/followers";
import { throttle } from "@/lib/utils";
import NoData from "../NoData";
import Loading from "../Loading";
import styles from "./menus.module.css";
import { API_URL } from "@/lib/api_url";

const LIMIT = 10;

// backend row
type ReqUser = {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic: string | null;
};

export default function FriendRequests() {
  const { deleteNotification } = useWS();
  const { user: loggedUser } = useUser();

  const [list, setList] = useState<ReqUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setMore] = useState(true);
  const [loading, setLoading] = useState(true);

  /* fetch page */
  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    const res = await getFollowingRequests(LIMIT, p);
    if (!res || !res.requests) {
      setMore(false);
      setLoading(false);
      return;
    }
    setList(prev => [...prev, ...res.requests]);
    setMore(p < res.totalPages);
    setPage(p + 1);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  /* optimistic remove */
  const dropRow = (id: string) => {
    setList(prev => prev.filter(u => u.id !== id));
    deleteNotification(id);
  };

  /* unified callback */
  const handleAction = async (
    action: "accepted" | "rejected",
    userId: string
  ) => {
    dropRow(userId);
    await addFollower(
      {
        action,
        status: action,
        followerID: userId,
        followedId: String(loggedUser?.id),
      },
      "/api/followers/add"
    );
  };

  /* scroll helper */
  const boxRef = useRef<HTMLDivElement>(null);
  useInfiniteScroll(boxRef, { loading, hasMore, page, fetchPage });

  return (
    <div className={styles.followRequestsMenu} ref={boxRef}>
      <h4 className={styles.heading}>FOLLOW REQUESTS</h4>

      {list.length === 0 && !loading ? (
        <NoData msg="No Follow Requests yet" />
      ) : (
        <ul className={styles.liist}>
          {list.map(u => (
            <li key={u.id} className={styles.item}>
              <Link
                href={`/profile/${u.id}`}
                className={styles.rowLink}
                scroll={false}
              >
                <Image
                  className={styles.avt}
                  src={
                    u.profile_pic
                      ? `${API_URL}/api/storage/avatars/${u.profile_pic}`
                      : "/img/default-avatar.png"
                  }
                  alt=""
                  width={36}
                  height={36}
                />
                <span className={styles.name}>
                  {u.first_name} {u.last_name}
                </span>
              </Link>

              <div
                className={styles.buttons}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className={styles.icnButton}
                  title="Accept"
                  onClick={() => handleAction("accepted", u.id)}
                >
                  <Image
                    src="/img/accept.svg"
                    alt="Accept"
                    width={20}
                    height={20}
                  />
                </button>
                <button
                  className={styles.icnButton}
                  title="Reject"
                  onClick={() => handleAction("rejected", u.id)}
                >
                  <Image
                    src="/img/refuse.svg"
                    alt="Reject"
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && <Loading />}
    </div>
  );
}

/* tiny helper */
function useInfiniteScroll(
  ref: any,
  opts: {
    loading: boolean;
    hasMore: boolean;
    page: number;
    fetchPage: (p: number) => void;
    bottomGap?: number;
    wait?: number;
  }
) {
  const {
    loading,
    hasMore,
    page,
    fetchPage,
    bottomGap = 32,
    wait = 250,
  } = opts;

  const onScroll = useCallback(
    throttle(() => {
      const el = ref.current;
      if (!el || loading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - bottomGap) {
        fetchPage(page);
      }
    }, wait),
    [loading, hasMore, page, fetchPage, bottomGap, wait]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, ref]);
}
