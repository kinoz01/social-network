import Profile from "@/components/profile/Profile";


export default async function ProfilePAge({params}) {
  const test = await params;

  console.log(test);
  

  return (
    <div className="mainContent profile">
      <Profile userId={test.id} />
    </div>
  );
}
