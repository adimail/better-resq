package incidents

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"resq.app/backend/internal/shared/db"
	"resq.app/backend/internal/shared/redis"
	"resq.app/backend/pkg/geo"
	"resq.app/backend/pkg/rfc7807"
)

type IncidentReq struct {
	Type     string `json:"disaster_type"`
	Location struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
	Desc  string  `json:"description"`
	Image string  `json:"image_key"`
	AI    float64 `json:"ai_confidence_score"`
}

type StatusReq struct {
	Status string `json:"status"`
}

type DangerZoneReq struct {
	Type string        `json:"disaster_type"`
	Sev  int           `json:"severity_level"`
	Poly [][][]float64 `json:"boundary_polygon"`
}

func GetPresignedURLService(c *gin.Context) {
	key := uuid.New().String()
	c.JSON(http.StatusCreated, gin.H{
		"upload_url": "https://s3.resq.app/upload/" + key,
		"file_key":   key,
	})
}

func CreateIncidentService(c *gin.Context) {
	var req IncidentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed incident payload")
		return
	}
	_, err := db.Pool.Exec(c, "INSERT INTO incident_reports (author_id, disaster_type, description, image_url, location, ai_confidence_score) VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7)", c.GetString("user_id"), req.Type, req.Desc, req.Image, req.Location.Lng, req.Location.Lat, req.AI)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to submit incident report")
		return
	}
	c.Status(http.StatusCreated)
}

func UpdateIncidentStatusService(c *gin.Context) {
	var req StatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed status payload")
		return
	}
	_, err := db.Pool.Exec(c, "UPDATE incident_reports SET status = $1 WHERE id = $2", req.Status, c.Param("id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to update incident status")
		return
	}

	sev := "danger"
	if req.Status == "verified" || req.Status == "VERIFIED" {
		sev = "success"
	}
	db.Pool.Exec(c, "INSERT INTO user_notifications (user_id, title, message, severity) SELECT author_id, 'Report Update', 'Your report was ' || $1, $2 FROM incident_reports WHERE id = $3", req.Status, sev, c.Param("id"))

	if req.Status == "verified" || req.Status == "VERIFIED" {
		redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{
			"event":       "INCIDENT_VERIFIED",
			"incident_id": c.Param("id"),
		})
	}

	c.Status(http.StatusOK)
}

func GetDangerZonesService(c *gin.Context) {
	rows, err := db.Pool.Query(c, "SELECT id, disaster_type, severity_level, is_active, ST_AsGeoJSON(boundary) FROM danger_zones WHERE is_active = TRUE")
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to retrieve danger zones")
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, t, geojsonStr string
		var sev int
		var act bool
		rows.Scan(&id, &t, &sev, &act, &geojsonStr)

		var geojson struct {
			Coordinates [][][]float64 `json:"coordinates"`
		}
		json.Unmarshal([]byte(geojsonStr), &geojson)

		out = append(out, map[string]any{"id": id, "disaster_type": t, "severity_level": sev, "is_active": act, "boundary_polygon": geojson.Coordinates})
	}
	if out == nil {
		out = []map[string]any{}
	}
	c.JSON(http.StatusOK, out)
}

func CreateDangerZoneService(c *gin.Context) {
	var req DangerZoneReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed danger zone payload")
		return
	}
	wkt := geo.BuildPolygonWKT(req.Poly)
	_, err := db.Pool.Exec(c, "INSERT INTO danger_zones (author_id, disaster_type, severity_level, boundary) VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))", c.GetString("user_id"), req.Type, req.Sev, wkt)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to create danger zone")
		return
	}
	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "DANGER_ZONE_ACTIVE", "type": req.Type})
	c.Status(http.StatusCreated)
}
