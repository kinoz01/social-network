import List from "../menus/List"
import Event from "./Event"
import styles from "./events.module.css"
function Events() {
    return (
        <div className={styles.events}>
            <Event />
            <Event />
            <Event />
            <Event />
            <Event />
            <Event />
            <Event />
        </div>
    )
}

export default Events