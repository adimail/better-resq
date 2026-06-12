package emergency

import (
	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/middleware"
)

func RegisterRoutes(r *gin.RouterGroup) {
	auth := middleware.Auth()
	optAuth := middleware.OptionalAuth()
	
	r.POST("/sos", optAuth, createSOS)
	r.GET("/sos", getSOS)
	r.GET("/sos/history", auth, getSOSHistory)
	r.GET("/sos/:id", getSOSByID)
	r.PATCH("/sos/:id/status", auth, updateSOSStatus)
	r.POST("/broadcasts", auth, createBroadcast)
	r.GET("/routes/safe", getSafeRoute)
}

func createSOS(c *gin.Context) {
	CreateSOSService(c)
}

func getSOS(c *gin.Context) {
	GetSOSService(c)
}

func getSOSHistory(c *gin.Context) {
	GetSOSHistoryService(c)
}

func getSOSByID(c *gin.Context) {
	GetSOSByIDService(c)
}

func updateSOSStatus(c *gin.Context) {
	UpdateSOSStatusService(c)
}

func createBroadcast(c *gin.Context) {
	CreateBroadcastService(c)
}

func getSafeRoute(c *gin.Context) {
	GetSafeRouteService(c)
}