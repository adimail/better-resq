package identity

import (
	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/middleware"
)

func RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/auth/login", login)
	r.POST("/auth/register", register)
	r.POST("/auth/refresh", refresh)
	r.POST("/auth/logout", middleware.Auth(), logout)
	r.GET("/users/me", middleware.Auth(), getProfile)
	r.PATCH("/users/me/device", middleware.Auth(), updateDevice)
	r.GET("/users", middleware.Auth(), getUsers)
}

func login(c *gin.Context) {
	LoginService(c)
}

func register(c *gin.Context) {
	RegisterService(c)
}

func refresh(c *gin.Context) {
	RefreshService(c)
}

func logout(c *gin.Context) {
	LogoutService(c)
}

func getProfile(c *gin.Context) {
	GetProfileService(c)
}

func updateDevice(c *gin.Context) {
	UpdateDeviceService(c)
}

func getUsers(c *gin.Context) {
	GetUsersService(c)
}
