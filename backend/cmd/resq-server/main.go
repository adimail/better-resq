package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"resq.app/backend/internal/emergency"
	"resq.app/backend/internal/identity"
	"resq.app/backend/internal/incidents"
	"resq.app/backend/internal/logistics"
	"resq.app/backend/internal/notifications"
	"resq.app/backend/internal/shared/config"
	"resq.app/backend/internal/shared/db"
	"resq.app/backend/internal/shared/logger"
	"resq.app/backend/internal/shared/middleware"
	"resq.app/backend/internal/shared/redis"
	"resq.app/backend/internal/shared/sse"
	"resq.app/backend/internal/weather"
)

func main() {
	isProd := os.Getenv("GIN_MODE") == "release"
	logger.InitLogger(isProd)
	defer logger.Sync()

	cfg := config.Load()
	gin.SetMode(cfg.GinMode)

	db.Init(cfg.DatabaseURL)
	redis.Init(cfg.RedisURL)
	sse.StartWorker()

	router := gin.New()
	router.Use(middleware.RequestLogger(), gin.Recovery(), middleware.CORS())

	v1 := router.Group("/v1")
	{
		v1.GET("/stream/events", sse.Handler)
		identity.RegisterRoutes(v1)
		emergency.RegisterRoutes(v1)
		incidents.RegisterRoutes(v1)
		logistics.RegisterRoutes(v1)
		notifications.RegisterRoutes(v1)
		weather.RegisterRoutes(v1)
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: router,
	}

	go func() {
		logger.Log.Info("Starting server", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Log.Error("Server listener failed", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	logger.Log.Info("Shutting down server...", zap.String("signal", sig.String()))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Log.Error("Server forced to shutdown", zap.Error(err))
	}

	db.Close()
	logger.Log.Info("Database connection closed")

	if err := redis.Close(); err != nil {
		logger.Log.Error("Error closing Redis client", zap.Error(err))
	} else {
		logger.Log.Info("Redis client closed")
	}

	logger.Log.Info("Exit successful")
	os.Exit(0)
}
