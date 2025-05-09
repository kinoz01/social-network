"use client"

import LeftMenu from "@/components/menus/LeftMenu";
import { useUser } from "@/context/UserContext";

export default function GroupsPage() {
    const { user } = useUser();
    if (!user) return null
    console.log("user: ", user);
    
    return (
        <div className="mainContent groups">
            <LeftMenu type="groups" />
        </div>
    );
}
