package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"resq.app/backend/internal/shared/config"
	"resq.app/backend/pkg/rfc7807"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			rfc7807.Error(c, http.StatusUnauthorized, "Unauthorized", "Missing token")
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		cfg := config.Load()

		token, _ := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				c.Set("user_id", claims["sub"])
				c.Set("role", claims["role"])
				c.Next()
				return
			}
		}

		rfc7807.Error(c, http.StatusUnauthorized, "Unauthorized", "Invalid token")
		c.Abort()
	}
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.Next()
			return
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		cfg := config.Load()

		token, _ := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				c.Set("user_id", claims["sub"])
				c.Set("role", claims["role"])
			}
		}
		c.Next()
	}
}