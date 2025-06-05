import RightMenu from "@/components/menus/RightMenu";
import Feed from "@/components/posts/Feed";
import ProfileCard from "@/components/profile/ProfileCrad";
import ProfileInfo from "@/components/profile/ProfileInfo";
import { getProfileInfo } from "@/lib/followers";
import { User } from "@/lib/types";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

async function ProfilePage({ params }: { params: any }) {
  const { id } = await params;

  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  const user: User | null = await getProfileInfo(id || "", {
    Cookie: cookie,
  });

  if (!user) {
    notFound()
  }


  return (
    <div className="mainContent profile">
      <ProfileCard type="profile" user={user} />
      <div className="profileContent">
        <ProfileInfo user={user} />
        <Feed type="profile" />
        <RightMenu profileId={id} page="profile" />
      </div>
    </div>
  );
}

export default ProfilePage;
