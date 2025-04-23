import styles from "./page.module.css";
import RightMenu from "@/components/RightMenu";
import Feed from "@/components/Feed";

export default async function Home() {


  return (
    <div className={styles.body}>
      <main className={styles.main}>
        <RightMenu />
        <Feed />
        <RightMenu />
      </main>
    </div>
  );
}
