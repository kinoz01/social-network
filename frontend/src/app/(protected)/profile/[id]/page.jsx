import ProfileHeader from "@/components/profile/ProfileHeader";
export default function ProfilePAge({params}) {
  const { id } = params;

  return (
    <div className="mainContent profile">

      <ProfileHeader userId={id} />
    </div>
  );
}
