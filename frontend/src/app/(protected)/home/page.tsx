import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
import Feed from "@/components/posts/Feed";
import UserSearchMenu from "@/components/menus/UsersSearch";
import style from "@/components/chat/style/chat.module.css";

export default function Home() {
    useEffect(() => {
        if (localStorage.getItem("showWelcome") === "true") {
            localStorage.removeItem("showWelcome");
            showWelcome();
        }
    }, []);

    return (
        <div className="mainContent home">
            <div className={`${style.menuLayout} ${style.menuLayoutLeft}`}>
                <UserSearchMenu />
                <LeftMenu />
            </div>
            <Feed type="home" />
            <RightMenu />
        </div >
    );

}

export default Home;
