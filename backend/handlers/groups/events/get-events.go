package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// api endpoint to query events with going/notgoing counts and my actual response (if no response yet -> nil) 
func GetEvents(w http.ResponseWriter, r *http.Request) {
	userId, _ := auth.GetUserId(r)
	gid := r.URL.Query().Get("group_id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	rows, err := tp.DB.Query(`
	    SELECT
	        e.id, e.creator_id, e.title, e.description,
	        e.start_time, e.created_at,
	        SUM(CASE WHEN r.response='going'     THEN 1 ELSE 0 END) AS going_cnt,
	        SUM(CASE WHEN r.response='not_going' THEN 1 ELSE 0 END) AS notgoing_cnt,
	        MAX(CASE WHEN r.user_id = ? THEN r.response ELSE NULL END) AS my_resp
	    FROM group_events e
	    LEFT JOIN event_responses r ON r.event_id = e.id
	    WHERE e.group_id = ?
	    GROUP BY e.id
	    ORDER BY e.start_time DESC, e.ROWID DESC
	    LIMIT ? OFFSET ?`, userId, gid, limit, offset)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var out []eventResp
	for rows.Next() {
		var ev eventResp
		var myResp sql.NullString
		if err := rows.Scan(
			&ev.ID, &ev.CreatorID, &ev.Title, &ev.Description,
			&ev.StartTime, &ev.CreatedAt,
			&ev.GoingCount, &ev.NotGoingCount,
			&myResp,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		ev.GroupID = gid
		if myResp.Valid {
			v := myResp.String == "going"
			ev.Going = &v // true or false
		} else {
			ev.Going = nil // nil ⇒ hasn't voted yet
		}
		out = append(out, ev)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}
