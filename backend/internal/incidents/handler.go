package incidents

import (
	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/middleware"
)

func RegisterRoutes(r *gin.RouterGroup) {
	auth := middleware.Auth()
	r.POST("/uploads/presigned-url", auth, getPresignedURL)
	r.POST("/incidents", auth, createIncident)
	r.PATCH("/incidents/:id/status", auth, updateIncidentStatus)
	r.GET("/danger-zones", getDangerZones)
	r.POST("/danger-zones", auth, createDangerZone)
}

func getPresignedURL(c *gin.Context) {
	GetPresignedURLService(c)
}

func createIncident(c *gin.Context) {
	CreateIncidentService(c)
}

func updateIncidentStatus(c *gin.Context) {
	UpdateIncidentStatusService(c)
}

func getDangerZones(c *gin.Context) {
	GetDangerZonesService(c)
}

func createDangerZone(c *gin.Context) {
	CreateDangerZoneService(c)
}
