import Feed from "@/components/posts/Feed";
import ProfileHeader from "@/components/profile/ProfileHeader";

export default async function ProfilePage({ params }: { params: any }) {
    const { id } = await params;

    return (
        <div className="mainContent profile">
            <Feed type="profile" id={id} />
        </div>
    );
}
