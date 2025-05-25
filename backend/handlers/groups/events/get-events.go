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

/*──────────── GET /api/groups/events?group_id=…&limit=&offset= ───────────*/
func GetEvents(w http.ResponseWriter, r *http.Request) {
	gid := r.URL.Query().Get("group_id")
	if gid == "" {
		help.JsonError(w, "group_id required", http.StatusBadRequest, nil)
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	var viewerID string
	if u, _ := auth.GetUser(r); u != nil {
		viewerID = u.ID
	}

	rows, err := tp.DB.Query(`
	    SELECT
	        e.id, e.creator_id, e.title, e.description, e.start_time, e.created_at,
	        SUM(CASE WHEN r.response='going'     THEN 1 ELSE 0 END) AS going_cnt,
	        SUM(CASE WHEN r.response='not_going' THEN 1 ELSE 0 END) AS notgoing_cnt,
	        MAX(CASE WHEN r.user_id = ? THEN r.response ELSE NULL END) AS my_resp
	    FROM group_events e
	    LEFT JOIN event_responses r ON r.event_id = e.id
	    WHERE e.group_id = ?
	    GROUP BY e.id
	    ORDER BY e.created_at DESC
	    LIMIT ? OFFSET ?`, viewerID, gid, limit, offset)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var list []eventResp
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
		ev.Going = myResp.Valid && myResp.String == "going"
		list = append(list, ev)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
