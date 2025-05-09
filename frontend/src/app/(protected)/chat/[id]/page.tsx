"use client"
import Chat from "@/components/chat/Chat"
// import FetchUsers from "@/components/chat/fetchUsers"
import LeftMenu from "@/components/menus/LeftMenu"
import RightMenu from "@/components/menus/RightMenu"
import { User } from "@/lib/user";
import { useState } from "react";
// import "./chatPage.css"

function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
    return (
        <div className="mainContent chat">
            <LeftMenu type="chat" selectedUser={setSelectedUser}/>
            {selectedUser ? <Chat user={selectedUser}/> :<div>Select a user to start chat</div>}
            <RightMenu/>
        </div>
    )
}

export default ChatPage