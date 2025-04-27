"use client";

import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        if (localStorage.getItem("showWelcome") === "true") {
            localStorage.removeItem("showWelcome");
            showWelcome();
        }
    }, []);

    return <h2>Hello World</h2>;
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
