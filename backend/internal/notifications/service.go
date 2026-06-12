package notifications

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"resq.app/backend/internal/shared/db"
	"resq.app/backend/pkg/rfc7807"
)

func getNotifications(c *gin.Context) {
	uid := c.GetString("user_id")
	rows, err := db.Pool.Query(c, "SELECT id, title, message, severity, read_at, created_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", uid)
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to retrieve notifications")
		return
	}
	defer rows.Close()

	var out []map[string]any
	for rows.Next() {
		var id, title, msg, sev string
		var readAt *time.Time
		var createdAt time.Time
		
		if err := rows.Scan(&id, &title, &msg, &sev, &readAt, &createdAt); err != nil {
			continue
		}
		
		out = append(out, map[string]any{
			"id":         id,
			"title":      title,
			"message":    msg,
			"severity":   sev,
			"read_at":    readAt,
			"created_at": createdAt,
		})
	}
	if out == nil {
		out = []map[string]any{}
	}
	c.JSON(http.StatusOK, gin.H{"data": out, "next_cursor": nil})
}

func markRead(c *gin.Context) {
	_, err := db.Pool.Exec(c, "UPDATE user_notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2", c.Param("id"), c.GetString("user_id"))
	if err != nil {
		rfc7807.Error(c, http.StatusInternalServerError, "Database Error", "Failed to update notification")
		return
	}
	c.Status(http.StatusOK)
}