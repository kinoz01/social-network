"use client";

import { useEffect, useState } from "react";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUserSession() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-session`, {
          credentials: "include",
        });

        const data = await res.json();
        setLoggedIn(data.loggedIn);
      } catch (error) {
        setLoggedIn(false);
      }
    }
    checkUserSession();
  }, []);

  if (loggedIn === null) return <p>Loading...</p>;

  return (
    <div>
      {loggedIn ? <h2>Hello World</h2> : <AuthModal />}
    </div>
  );
}