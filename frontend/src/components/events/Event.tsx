import List from "../menus/List"
import styles from "./events.module.css"
function Event() {
    return (
        <div className={styles.eventCard}>
            <div className={styles.eventHeader}>
                <span>
                Piscine Rust
                </span>
                <button className={styles.button}>
                    Register
                </button>
            </div>
            <div className={styles.eventInfo}>
                <List type="event" title="Registred Users" />
                <div className={styles.eventDates}>

                    <div className={styles.startsAt}>
                        <span>Starts at </span>
                        08/05/2025
                    </div>
                    <div className={styles.endsAt}>
                        <span>Ends at </span>
                        08/06/2025
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Event