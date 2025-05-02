"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogout } from "@/lib/logout";
import Link from "next/link";

export default function Home() {
    const router = useRouter();
    const { handleLogout } = useLogout();

    useEffect(() => {
        if (localStorage.getItem("showWelcome") === "true") {
            localStorage.removeItem("showWelcome");
            showWelcome();
        }
    }, []);

    return (
        <div>
            <h2>Hello World</h2>
            <button onClick={handleLogout} className="logout-button">
                Logout
            </button>
            <Link href="/groups-dashboard">
                <button className="groups-button">Groups</button>
            </Link>
        </div>
    );
}

// Welcome Popup on signup
const showWelcome = () => {
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
};
