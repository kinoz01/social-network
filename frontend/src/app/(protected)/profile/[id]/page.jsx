import ProfileHeader from "@/components/profile/ProfileHeader";


export default async function ProfilePAge({params}) {
  const test = await params;

  console.log(test);
  

  return (
    <div className="mainContent profile">
      <ProfileHeader userId={test.id} />
    </div>
  );
}
