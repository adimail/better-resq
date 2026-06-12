package notifications

import (
	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/middleware"
)

func RegisterRoutes(r *gin.RouterGroup) {
	auth := middleware.Auth()
	r.GET("/notifications", auth, getNotifications)
	r.PATCH("/notifications/:id/read", auth, markRead)
}
