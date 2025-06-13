import Feed from "@/components/posts/Feed";
import styles from "@/components/groups/style/groupFeed.module.css";

export default async function GroupPage({ params }: { params: any }) {
    const { id } = await params;

    return (
        <div className="mainContent home">
            <Feed type="group" id={id} />
        </div>
    );
}