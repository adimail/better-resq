package weather

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getCurrentWeather(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"location":         map[string]float64{"lat": 0, "lng": 0},
		"temperature_c":    28.5,
		"condition":        "Clear",
		"wind_kph":         12,
		"humidity_percent": 65,
		"updated_at":       "2024-01-01T00:00:00Z",
	})
}
