package logistics

import (
	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/middleware"
)

func RegisterRoutes(r *gin.RouterGroup) {
	auth := middleware.Auth()
	r.GET("/camps", getCamps)
	r.GET("/camps/:id", getCampByID)
	r.POST("/camps", auth, createCamp)
	r.PATCH("/camps/:id", auth, updateCampStatus)
	r.PUT("/camps/:id", auth, updateCamp)
	r.DELETE("/camps/:id", auth, deleteCamp)
}

func getCamps(c *gin.Context) {
	GetCampsService(c)
}

func getCampByID(c *gin.Context) {
	GetCampByIDService(c)
}

func createCamp(c *gin.Context) {
	CreateCampService(c)
}

func updateCampStatus(c *gin.Context) {
	UpdateCampStatusService(c)
}

func updateCamp(c *gin.Context) {
	UpdateCampService(c)
}

func deleteCamp(c *gin.Context) {
	DeleteCampService(c)
}
