package incidents

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/config"
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
	cfg := config.Load()
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)

	dataToSign := "timestamp=" + timestamp + cfg.CloudinaryApiSecret
	hash := sha1.New()
	hash.Write([]byte(dataToSign))
	signature := hex.EncodeToString(hash.Sum(nil))

	uploadUrl := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cfg.CloudinaryCloudName)

	c.JSON(http.StatusCreated, gin.H{
		"upload_url": uploadUrl,
		"api_key":    cfg.CloudinaryApiKey,
		"timestamp":  timestamp,
		"signature":  signature,
	})
}

func CreateIncidentService(c *gin.Context) {
	var req IncidentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed incident payload")
		return
	}

	var newId string
	err := db.Pool.QueryRow(c, "INSERT INTO incident_reports (author_id, disaster_type, description, image_url, location, ai_confidence_score) VALUES ($1::uuid, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7) RETURNING id", c.GetString("user_id"), req.Type, req.Desc, req.Image, req.Location.Lng, req.Location.Lat, req.AI).Scan(&newId)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to submit incident report")
		return
	}

	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{
		"event":       "INCIDENT_CREATED",
		"incident_id": newId,
		"type":        req.Type,
		"lat":         req.Location.Lat,
		"lng":         req.Location.Lng,
	})

	c.Status(http.StatusCreated)
}

func GetIncidentsService(c *gin.Context) {
	rows, err := db.Pool.Query(c, `
		SELECT
			id, author_id, disaster_type, description, COALESCE(image_url, ''),
			ST_X(location::geometry), ST_Y(location::geometry),
			status, COALESCE(ai_confidence_score, 0), created_at
		FROM incident_reports
		WHERE status = 'pending'
		ORDER BY created_at DESC
	`)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to fetch incidents")
		return
	}
	defer rows.Close()

	out := []map[string]any{}
	for rows.Next() {
		var id, aid, dtype, desc, img, status string
		var lng, lat, ai float64
		var cat time.Time
		rows.Scan(&id, &aid, &dtype, &desc, &img, &lng, &lat, &status, &ai, &cat)
		out = append(out, map[string]any{
			"id":                  id,
			"author_id":           aid,
			"disaster_type":       dtype,
			"description":         desc,
			"image_url":           img,
			"location":            map[string]float64{"lat": lat, "lng": lng},
			"status":              status,
			"ai_confidence_score": ai,
			"created_at":          cat,
		})
	}
	c.JSON(http.StatusOK, out)
}

func GetMyIncidentsService(c *gin.Context) {
	uid := c.GetString("user_id")
	rows, err := db.Pool.Query(c, `
		SELECT
			id, author_id, disaster_type, description, COALESCE(image_url, ''),
			ST_X(location::geometry), ST_Y(location::geometry),
			status, COALESCE(ai_confidence_score, 0), created_at
		FROM incident_reports
		WHERE author_id = $1::uuid
		ORDER BY created_at DESC
	`, uid)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to fetch incidents")
		return
	}
	defer rows.Close()

	out := []map[string]any{}
	for rows.Next() {
		var id, aid, dtype, desc, img, status string
		var lng, lat, ai float64
		var cat time.Time
		rows.Scan(&id, &aid, &dtype, &desc, &img, &lng, &lat, &status, &ai, &cat)
		out = append(out, map[string]any{
			"id":                  id,
			"author_id":           aid,
			"disaster_type":       dtype,
			"description":         desc,
			"image_url":           img,
			"location":            map[string]float64{"lat": lat, "lng": lng},
			"status":              status,
			"ai_confidence_score": ai,
			"created_at":          cat,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": out})
}

func GetIncidentByIDService(c *gin.Context) {
	var id, aid, dtype, desc, img, status string
	var lng, lat, ai float64
	var cat time.Time

	err := db.Pool.QueryRow(c, `
		SELECT
			id, author_id, disaster_type, description, COALESCE(image_url, ''),
			ST_X(location::geometry), ST_Y(location::geometry),
			status, COALESCE(ai_confidence_score, 0), created_at
		FROM incident_reports
		WHERE id = $1
	`, c.Param("id")).Scan(&id, &aid, &dtype, &desc, &img, &lng, &lat, &status, &ai, &cat)
	if err != nil {
		rfc7807.Error(c, http.StatusNotFound, "Not Found", "Incident not found")
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id":                  id,
		"author_id":           aid,
		"disaster_type":       dtype,
		"description":         desc,
		"image_url":           img,
		"location":            map[string]float64{"lat": lat, "lng": lng},
		"status":              status,
		"ai_confidence_score": ai,
		"created_at":          cat,
	})
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

	if req.Status == "verified" || req.Status == "VERIFIED" {
		db.Pool.Exec(c, `
			INSERT INTO danger_zones (author_id, disaster_type, severity_level, boundary, expires_at)
			SELECT author_id, disaster_type, 4, ST_Buffer(location::geometry, 0.001)::geography, NOW() + INTERVAL '24 hours'
			FROM incident_reports WHERE id = $1
		`, c.Param("id"))

		var dtype string
		var lng, lat float64
		db.Pool.QueryRow(c, "SELECT disaster_type, ST_X(location::geometry), ST_Y(location::geometry) FROM incident_reports WHERE id = $1", c.Param("id")).Scan(&dtype, &lng, &lat)

		redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{
			"event":       "INCIDENT_VERIFIED",
			"incident_id": c.Param("id"),
			"type":        dtype,
			"lat":         lat,
			"lng":         lng,
		})
	}

	sev := "danger"
	if req.Status == "verified" || req.Status == "VERIFIED" {
		sev = "success"
	}
	db.Pool.Exec(c, "INSERT INTO user_notifications (user_id, title, message, severity) SELECT author_id, 'Report Update', 'Your report was ' || $1, $2 FROM incident_reports WHERE id = $3", req.Status, sev, c.Param("id"))

	c.Status(http.StatusOK)
}

func GetEventHistoryService(c *gin.Context) {
	msgs, err := redis.GetRecentEvents(c, "resq:stream:events", 50)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Redis Error", "Failed to load history")
		return
	}

	out := make([]map[string]any, 0, len(msgs))
	for _, msg := range msgs {
		out = append(out, map[string]any{
			"id":        msg.ID,
			"payload":   msg.Values,
			"timestamp": msg.ID,
		})
	}
	c.JSON(http.StatusOK, out)
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

func GetDangerZoneByIDService(c *gin.Context) {
	var id, t, geojsonStr string
	var sev int
	var act bool
	var cat time.Time
	var exp *time.Time

	err := db.Pool.QueryRow(c, "SELECT id, disaster_type, severity_level, is_active, created_at, expires_at, ST_AsGeoJSON(boundary) FROM danger_zones WHERE id = $1", c.Param("id")).Scan(&id, &t, &sev, &act, &cat, &exp, &geojsonStr)
	if err != nil {
		rfc7807.Error(c, http.StatusNotFound, "Not Found", "Danger zone not found")
		return
	}

	var geojson struct {
		Coordinates [][][]float64 `json:"coordinates"`
	}
	json.Unmarshal([]byte(geojsonStr), &geojson)

	c.JSON(http.StatusOK, map[string]any{
		"id":               id,
		"disaster_type":    t,
		"severity_level":   sev,
		"is_active":        act,
		"created_at":       cat,
		"expires_at":       exp,
		"boundary_polygon": geojson.Coordinates,
	})
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

func UpdateDangerZoneService(c *gin.Context) {
	role := c.GetString("role")
	if role != "AUTHORITY" {
		rfc7807.Error(c, http.StatusForbidden, "Forbidden", "Only authorities can modify danger zones")
		return
	}
	var req DangerZoneReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed danger zone payload")
		return
	}
	wkt := geo.BuildPolygonWKT(req.Poly)
	_, err := db.Pool.Exec(c, "UPDATE danger_zones SET disaster_type = $1, severity_level = $2, boundary = ST_GeomFromText($3, 4326) WHERE id = $4", req.Type, req.Sev, wkt, c.Param("id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to update danger zone")
		return
	}
	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "DANGER_ZONE_UPDATED", "id": c.Param("id")})
	c.Status(http.StatusOK)
}

func DeleteDangerZoneService(c *gin.Context) {
	role := c.GetString("role")
	if role != "AUTHORITY" {
		rfc7807.Error(c, http.StatusForbidden, "Forbidden", "Only authorities can delete danger zones")
		return
	}
	_, err := db.Pool.Exec(c, "UPDATE danger_zones SET is_active = FALSE WHERE id = $1", c.Param("id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to delete danger zone")
		return
	}
	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "DANGER_ZONE_DELETED", "id": c.Param("id")})
	c.Status(http.StatusOK)
}
