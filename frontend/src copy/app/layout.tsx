import type { Metadata } from "next";

import "../styles/globals.css";
import "../styles/theme.css"

export const metadata: Metadata = {
    title: "Social Network",
    description: "Social platform",
};


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <html lang="en">
            <body >
                <main >
                    {children}
                </main>
            </body>
        </html>
    );
}