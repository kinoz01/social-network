import ChatBox from "@/components/chat/ChatBox";

export default function DMPage({ params }: { params: { id: string } }) {
    return <ChatBox peerId={params.id} />;
}