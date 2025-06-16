"use client"

import { getSuggestions } from "@/lib/followers";
import { User } from "@/lib/types";
import { useEffect, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import NoData from "../NoData";
import Loading from "../Loading";
import { useFollowSync } from "@/context/FollowSyncContext";

type Props = {
  className?: string;
}

function SuggestionsList({ className = "" }: Props) {
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<User[] | null>([]);
  const { version } = useFollowSync()

  useEffect(() => {
    async function fetchSuggestions() {
      const data: User[] | null = await getSuggestions(); // Initial fetch on component mount
      setSuggestions(data);
    }
    fetchSuggestions();
    setIsDataLoading(false);
  }, [version]);

  return (
    <div className={`${styles.users} ${className}`}>
      {className ? <p>SUGGESTIONS</p>: ""} 
      {suggestions === null || suggestions.length === 0 ? (
        <NoData msg="No Suggestions yet" />
      ) : (
        suggestions.map((suggestion) => {
          return (
            <ListItem key={suggestion.id} type="followers" item={suggestion} />
          );
        })
      )}
      {isDataLoading && <Loading />}
    </div>
  );
}

export default SuggestionsList;
