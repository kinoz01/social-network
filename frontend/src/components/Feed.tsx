import Post from "./Post";
import styles from "../app/page.module.css";
function Feed(){
  return (
    <div className={styles.feed}>
      <Post />
      <Post />
      <Post />
    </div>
  );
};

export default Feed;
