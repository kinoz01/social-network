import Post from "./Post";
import styles from "./posts.module.css";
import "../../app/globals.css";
function Feed() {
  return (
    <div className={styles.feed}>
      <Post />
      <Post />
      <Post />
    </div>
  );
}

export default Feed;
