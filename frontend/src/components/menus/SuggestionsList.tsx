"use client"

import { getSuggestions } from "@/lib/followers";
import { User } from "@/lib/types";
import { useEffect, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import NoData from "../NoData";
import Loading from "../Loading";

function SuggestionsList() {
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<User[] | null>([]);

  useEffect(() => {
    async function fetchSuggestions() {
      const data: User[] | null = await getSuggestions(); // Initial fetch on component mount
      setSuggestions(data);
    }
    fetchSuggestions();
    setIsDataLoading(false);
  }, []); // Empty dependency array means this only runs once on mount

  return (
    <div className={styles.users}>
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
