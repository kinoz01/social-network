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

func GetEvents(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}
	gid := r.URL.Query().Get("group_id")
	if gid == "" {
		help.JsonError(w, "group_id required", http.StatusBadRequest, nil)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	viewerID := u.ID

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
	    ORDER BY e.start_time ASC, e.id ASC
	    LIMIT ? OFFSET ?`, viewerID, gid, limit, offset)
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
			ev.Going = nil // nil ⇒ hasn’t voted
		}
		out = append(out, ev)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}
