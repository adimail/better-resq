package emergency

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"resq.app/backend/internal/shared/db"
	"resq.app/backend/internal/shared/redis"
	"resq.app/backend/pkg/geo"
	"resq.app/backend/pkg/rfc7807"
)

type SOSReq struct {
	Location struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
	Battery int    `json:"battery_level"`
	Message string `json:"message"`
}

type SOSStatusReq struct {
	Status string `json:"status"`
}

type BroadcastReq struct {
	Message string        `json:"message"`
	Sev     int           `json:"severity"`
	Poly    [][][]float64 `json:"target_polygon"`
}

func CreateSOSService(c *gin.Context) {
	var req SOSReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed payload or missing required location fields")
		return
	}

	uid := c.GetString("user_id")
	var citizenId *string

	if uid != "" {
		citizenId = &uid
		var existingId string
		err := db.Pool.QueryRow(c, "SELECT id FROM sos_signals WHERE citizen_id = $1 AND status IN ('active', 'acknowledged') LIMIT 1", uid).Scan(&existingId)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"id": existingId})
			return
		}
	}

	var newId string
	err := db.Pool.QueryRow(c, "INSERT INTO sos_signals (citizen_id, location, battery_level, message) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5) RETURNING id", citizenId, req.Location.Lng, req.Location.Lat, req.Battery, req.Message).Scan(&newId)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to trigger SOS signal")
		return
	}

	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "SOS_CREATED", "id": newId, "user": uid})
	c.JSON(http.StatusCreated, gin.H{"id": newId})
}

func GetSOSService(c *gin.Context) {
	status := c.Query("status")
	if status == "" {
		status = "active"
	}
	rows, err := db.Pool.Query(c, "SELECT id, citizen_id, ST_X(location::geometry), ST_Y(location::geometry), COALESCE(battery_level, 0), COALESCE(message, ''), status, responder_id, created_at FROM sos_signals WHERE status = $1 ORDER BY created_at DESC", status)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to retrieve SOS signals")
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, msg, st string
		var cid, rid *string
		var lng, lat float64
		var bat int
		var createdAt time.Time
		rows.Scan(&id, &cid, &lng, &lat, &bat, &msg, &st, &rid, &createdAt)
		out = append(out, map[string]any{
			"id":            id,
			"citizen_id":    cid,
			"location":      map[string]float64{"lat": lat, "lng": lng},
			"battery_level": bat,
			"message":       msg,
			"status":        st,
			"responder_id":  rid,
			"created_at":    createdAt,
		})
	}
	if out == nil {
		out = []map[string]any{}
	}
	c.JSON(http.StatusOK, gin.H{"data": out, "next_cursor": nil})
}

func GetSOSHistoryService(c *gin.Context) {
	uid := c.GetString("user_id")
	rows, err := db.Pool.Query(c, "SELECT id, citizen_id, ST_X(location::geometry), ST_Y(location::geometry), COALESCE(battery_level, 0), COALESCE(message, ''), status, responder_id, created_at FROM sos_signals WHERE citizen_id = $1 ORDER BY created_at DESC", uid)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to retrieve SOS history")
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, msg, st string
		var cid, rid *string
		var lng, lat float64
		var bat int
		var createdAt time.Time
		rows.Scan(&id, &cid, &lng, &lat, &bat, &msg, &st, &rid, &createdAt)

		out = append(out, map[string]any{
			"id":            id,
			"citizen_id":    cid,
			"location":      map[string]float64{"lat": lat, "lng": lng},
			"battery_level": bat,
			"message":       msg,
			"status":        st,
			"responder_id":  rid,
			"created_at":    createdAt,
		})
	}
	if out == nil {
		out = []map[string]any{}
	}
	c.JSON(http.StatusOK, gin.H{"data": out, "next_cursor": nil})
}

func GetSOSByIDService(c *gin.Context) {
	var id, st string
	err := db.Pool.QueryRow(c, "SELECT id, status FROM sos_signals WHERE id = $1", c.Param("id")).Scan(&id, &st)
	if err != nil {
		rfc7807.Error(c, http.StatusNotFound, "Not Found", "SOS signal not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": id, "status": st})
}

func UpdateSOSStatusService(c *gin.Context) {
	var req SOSStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed status payload")
		return
	}

	uid := c.GetString("user_id")
	role := c.GetString("role")
	sosID := c.Param("id")

	if role != "AUTHORITY" && role != "RESPONDER" {
		var citizenID string
		err := db.Pool.QueryRow(c, "SELECT citizen_id FROM sos_signals WHERE id = $1", sosID).Scan(&citizenID)
		if err != nil || citizenID != uid {
			rfc7807.Error(c, http.StatusForbidden, "Forbidden", "You can only resolve your own SOS signals")
			return
		}
	}

	_, err := db.Pool.Exec(c, "UPDATE sos_signals SET status = $1, responder_id = $2 WHERE id = $3", req.Status, uid, sosID)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to update SOS status")
		return
	}

	db.Pool.Exec(c, "INSERT INTO user_notifications (user_id, title, message, severity) SELECT citizen_id, 'SOS Update', 'Your SOS status is now: ' || $1, 'info' FROM sos_signals WHERE id = $2 AND citizen_id IS NOT NULL", req.Status, sosID)

	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "SOS_UPDATED", "id": sosID, "status": req.Status})
	c.Status(http.StatusOK)
}

func CreateBroadcastService(c *gin.Context) {
	var req BroadcastReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed broadcast payload")
		return
	}
	wkt := geo.BuildPolygonWKT(req.Poly)
	_, err := db.Pool.Exec(c, "INSERT INTO geo_broadcasts (authority_id, message, severity, target_area) VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))", c.GetString("user_id"), req.Message, req.Sev, wkt)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to send emergency broadcast")
		return
	}

	db.Pool.Exec(c, "INSERT INTO user_notifications (user_id, title, message, severity) SELECT id, 'Emergency Broadcast', $1, 'danger' FROM users WHERE last_known_location IS NOT NULL AND ST_Intersects(last_known_location, ST_GeomFromText($2, 4326))", req.Message, wkt)

	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{
		"event":    "BROADCAST_SENT",
		"id":       uuid.New().String(),
		"title":    "Emergency Broadcast",
		"message":  req.Message,
		"severity": "danger",
	})
	c.Status(http.StatusAccepted)
}

func GetSafeRouteService(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"distance_meters":   4500,
		"estimated_minutes": 15,
		"geometry":          "gqreF~j|wM_@??",
		"route_compromised": false,
		"turn_by_turn":      []string{},
	})
}

