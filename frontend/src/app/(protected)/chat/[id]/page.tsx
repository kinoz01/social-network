import Chat from "@/components/chat/Chat";
import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
// import "./chatPage.css"

async function ChatPage() {
  return (
    <div className="mainContent chat">
      <LeftMenu type="home" />
      <Chat />
      <RightMenu page="home" />
    </div>
  );
}

export default ChatPage;
