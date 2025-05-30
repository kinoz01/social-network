import ProfileHeader from "@/components/profile/ProfileHeader";

export default async function ProfilePage({ params }: { params: any }) {
  const { id } = await params;
  return (
    <div className="mainContent profile">
      <ProfileHeader id={id} />
    </div>
  );
}
