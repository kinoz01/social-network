import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
import Feed from "@/components/posts/Feed";
import { requireSession } from "@/lib/auth";

async function Home() {
  return (
    <div className="mainContent home">
      <LeftMenu type="home" />
      <Feed type="home"/>
      <RightMenu page="home" />
    </div>
  );
}

export default Home;
