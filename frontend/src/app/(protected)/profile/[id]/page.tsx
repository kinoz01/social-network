import RightMenu from "@/components/menus/RightMenu";
import Feed from "@/components/posts/Feed";
import ProfileHeader from "@/components/profile/ProfileHeader";

export default async function ProfilePage({ params }: { params: any }) {
    const { id } = await params;

    return (
        <>
            <Feed type="profile" id={id} />
            <RightMenu page="profile" />
        </>
    );
}
