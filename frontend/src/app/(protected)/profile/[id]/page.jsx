import ProfileHeader from "@/components/profile/ProfileHeader";
export default async function ProfilePAge({params}) {
  console.log("params",await params);
  
  const { id } = params;

  return (
    <div className="mainContent profile">

      <ProfileHeader userId={id} />
    </div>
  );
}
