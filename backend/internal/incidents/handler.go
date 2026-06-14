package incidents

import (
	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/middleware"
)

func RegisterRoutes(r *gin.RouterGroup) {
	auth := middleware.Auth()
	r.POST("/uploads/presigned-url", auth, getPresignedURL)
	r.POST("/incidents", auth, createIncident)
	r.GET("/incidents", auth, getIncidents)
	r.GET("/incidents/me", auth, getMyIncidents)
	r.GET("/incidents/:id", auth, getIncidentByID)
	r.PATCH("/incidents/:id/status", auth, updateIncidentStatus)
	r.GET("/danger-zones", getDangerZones)
	r.GET("/danger-zones/:id", getDangerZoneByID)
	r.POST("/danger-zones", auth, createDangerZone)
	r.PATCH("/danger-zones/:id", auth, updateDangerZone)
	r.DELETE("/danger-zones/:id", auth, deleteDangerZone)
	r.GET("/events/history", auth, getEventHistory)
}

func getPresignedURL(c *gin.Context) {
	GetPresignedURLService(c)
}

func createIncident(c *gin.Context) {
	CreateIncidentService(c)
}

func getIncidents(c *gin.Context) {
	GetIncidentsService(c)
}

func getMyIncidents(c *gin.Context) {
	GetMyIncidentsService(c)
}

func getIncidentByID(c *gin.Context) {
	GetIncidentByIDService(c)
}

func updateIncidentStatus(c *gin.Context) {
	UpdateIncidentStatusService(c)
}

func getDangerZones(c *gin.Context) {
	GetDangerZonesService(c)
}

func getDangerZoneByID(c *gin.Context) {
	GetDangerZoneByIDService(c)
}

func createDangerZone(c *gin.Context) {
	CreateDangerZoneService(c)
}

func updateDangerZone(c *gin.Context) {
	UpdateDangerZoneService(c)
}

func deleteDangerZone(c *gin.Context) {
	DeleteDangerZoneService(c)
}

func getEventHistory(c *gin.Context) {
	GetEventHistoryService(c)
}
