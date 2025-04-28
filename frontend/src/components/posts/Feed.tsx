import Post from "./Post";
import styles from "./posts.module.css";
import AddPost from "./AddPost";

function Feed() {
  return (
    <div className={styles.feed}>
      <AddPost />
      <Post />
      <Post />
      <Post />
    </div>
  );
};

export default Feed;
