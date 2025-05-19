import type { Metadata } from "next";
import "../globals.css";
import { requireSession } from "@/lib/auth";
import SideBar from "@/components/SideBar";
import CreateButton from "@/components/CreateButton";

export const metadata: Metadata = {
    title: "Social Network",
    description: "Social platform",
};


export default async function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireSession();

    return (
        <>
            <SideBar />
            {children}
            {/* <CreateButton /> */}
        </>
    );
}