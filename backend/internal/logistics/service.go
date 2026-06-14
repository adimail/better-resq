package logistics

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/db"
	"resq.app/backend/internal/shared/redis"
	"resq.app/backend/pkg/rfc7807"
)

type CampReq struct {
	Name     string `json:"name"`
	Type     string `json:"camp_type"`
	Location struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
}

type CampStatusReq struct {
	Status string `json:"stock_status"`
}

func GetCampsService(c *gin.Context) {
	rows, err := db.Pool.Query(c, "SELECT id, name, camp_type, stock_status, ST_X(location::geometry), ST_Y(location::geometry) FROM resource_camps")
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to retrieve resource camps")
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, n, t, s string
		var lng, lat float64
		rows.Scan(&id, &n, &t, &s, &lng, &lat)
		out = append(out, map[string]any{"id": id, "name": n, "camp_type": t, "stock_status": s, "location": map[string]float64{"lat": lat, "lng": lng}})
	}
	if out == nil {
		out = []map[string]any{}
	}
	c.JSON(http.StatusOK, out)
}

func GetCampByIDService(c *gin.Context) {
	var id, n, t, s string
	var lng, lat float64

	err := db.Pool.QueryRow(c, "SELECT id, name, camp_type, stock_status, ST_X(location::geometry), ST_Y(location::geometry) FROM resource_camps WHERE id = $1", c.Param("id")).Scan(&id, &n, &t, &s, &lng, &lat)
	if err != nil {
		rfc7807.Error(c, http.StatusNotFound, "Not Found", "Resource camp not found")
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id":           id,
		"name":         n,
		"camp_type":    t,
		"stock_status": s,
		"location":     map[string]float64{"lat": lat, "lng": lng},
	})
}

func CreateCampService(c *gin.Context) {
	var req CampReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed camp payload")
		return
	}

	var newId string
	err := db.Pool.QueryRow(c, "INSERT INTO resource_camps (manager_id, name, camp_type, location) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)) RETURNING id", c.GetString("user_id"), req.Name, req.Type, req.Location.Lng, req.Location.Lat).Scan(&newId)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to create resource camp")
		return
	}

	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{
		"event":   "CAMP_CREATED",
		"camp_id": newId,
		"name":    req.Name,
		"type":    req.Type,
	})

	c.Status(http.StatusCreated)
}

func UpdateCampStatusService(c *gin.Context) {
	var req CampStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed stock status payload")
		return
	}
	_, err := db.Pool.Exec(c, "UPDATE resource_camps SET stock_status = $1 WHERE id = $2", req.Status, c.Param("id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to update camp stock status")
		return
	}
	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "CAMP_STOCK_UPDATED", "camp_id": c.Param("id")})
	c.Status(http.StatusOK)
}

func UpdateCampService(c *gin.Context) {
	role := c.GetString("role")
	if role != "AUTHORITY" {
		rfc7807.Error(c, http.StatusForbidden, "Forbidden", "Only authorities can modify camps")
		return
	}
	var req CampReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rfc7807.Error(c, http.StatusBadRequest, "Invalid Request", "Malformed camp payload")
		return
	}
	_, err := db.Pool.Exec(c, "UPDATE resource_camps SET name = $1, camp_type = $2, location = ST_SetSRID(ST_MakePoint($3, $4), 4326) WHERE id = $5", req.Name, req.Type, req.Location.Lng, req.Location.Lat, c.Param("id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to update camp")
		return
	}
	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "CAMP_UPDATED", "camp_id": c.Param("id")})
	c.Status(http.StatusOK)
}

func DeleteCampService(c *gin.Context) {
	role := c.GetString("role")
	if role != "AUTHORITY" {
		rfc7807.Error(c, http.StatusForbidden, "Forbidden", "Only authorities can delete camps")
		return
	}
	_, err := db.Pool.Exec(c, "DELETE FROM resource_camps WHERE id = $1", c.Param("id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to delete camp")
		return
	}
	redis.PublishEvent(c, "resq:stream:events", map[string]interface{}{"event": "CAMP_DELETED", "camp_id": c.Param("id")})
	c.Status(http.StatusOK)
}

