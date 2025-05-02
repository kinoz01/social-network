import Post from "./Post";
import styles from "./posts.module.css";
import "../../app/globals.css";
function Feed({ type }: { type: "home" | "group" }) {
  return (
    <div className={`${styles.feed} ${styles[type]}`}>
      <Post />
      <Post />
      <Post />
    </div>
  );
}

export default Feed;
