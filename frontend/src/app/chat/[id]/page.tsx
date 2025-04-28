import Chat from "@/components/chat/Chat"
import LeftMenu from "@/components/menus/LeftMenu"

export default function ChatPage() {
    return (
        <div className="mainContent chat">
            <LeftMenu type="chat" />
            <Chat />
        </div>
    )
}

