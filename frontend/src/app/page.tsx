import Feed from "@/components/posts/Feed";
import RightMenu from "@/components/menus/RightMenu";
import LeftMenu from "@/components/menus/LeftMenu";

export default async function Home() {
  return (
    <div className="mainContent home">
      <LeftMenu type="home" />
      <Feed />
      <RightMenu />
    </div>
  );
}
