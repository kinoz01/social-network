"use client"
import Chat from "@/components/chat/Chat"
// import FetchUsers from "@/components/chat/fetchUsers"
import LeftMenu from "@/components/menus/LeftMenu"
import RightMenu from "@/components/menus/RightMenu"
// import "./chatPage.css"

function ChatPage() {
 
    
    return (
        <div className="mainContent chat">
            <LeftMenu type="chat" />
            <Chat />
            <RightMenu/>
        </div>
    )
}

export default ChatPage