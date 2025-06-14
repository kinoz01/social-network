import RightMenu from "@/components/menus/RightMenu";
import Feed from "@/components/posts/Feed";

export default async function ProfilePage({ params }: { params: any }) {
    const { id } = await params;

    return (
        <>
            <Feed type="profile" id={id} />
            <RightMenu page="profile" />
        </>
    );
}
