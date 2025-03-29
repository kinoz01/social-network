"use client";
import { useEffect, useState } from "react";
import AuthModal from "../components/AuthModal";
import LoadingSpinner from "../components/Loading";

export default function Home() {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
    const [showWelcome, setShowWelcome] = useState(false); // Track welcome state

    async function checkUserSession() {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-session`, {
                credentials: "include",
            });
            const data = await res.json();
            setLoggedIn(data.loggedIn);

            // Show welcome message if the user just signed up
            if (localStorage.getItem("showWelcome") === "true") {
                localStorage.removeItem("showWelcome");
                setShowWelcome(true); 
            }
        } catch (error) {
            setLoggedIn(false);
        }
    }

    useEffect(() => {
        checkUserSession();
    }, []);

    if (loggedIn === null) return <LoadingSpinner />;

    return (
        <div>
            {loggedIn ? (
                <>
                    <h2>Hello World</h2>
                    {showWelcome && <WelcomePopup />}
                </>
            ) : (
                <AuthModal authSuccess={checkUserSession} />
            )}
        </div>
    );
}

// Welcome Popup Component
const WelcomePopup = () => {
    useEffect(() => {
        const popup = document.createElement("div");
        popup.classList.add("welcome-popup");
        popup.innerHTML = `
            <span class="close-popup">&times;</span>
            🎉🎉🎉<br>
            <strong>Welcome to our Community!</strong><br>
            Feel free to share your thoughts.
        `;
        document.body.appendChild(popup);
        document.querySelector(".close-popup")?.addEventListener("click", () => popup.remove());
        setTimeout(() => popup.classList.add("fade-out"), 5000);
        setTimeout(() => popup.remove(), 6500);
    }, []);

    return null; // This component runs effects but doesn't render anything
};
