package rfc7807

import (
	"github.com/gin-gonic/gin"
)

type ProblemDetails struct {
	Type     string            `json:"type"`
	Status   int               `json:"status"`
	Title    string            `json:"title"`
	Detail   string            `json:"detail"`
	Instance string            `json:"instance,omitempty"`
	Errors   map[string]string `json:"errors,omitempty"`
}

func Error(c *gin.Context, status int, title, detail string) {
	c.AbortWithStatusJSON(status, ProblemDetails{
		Type:   "about:blank",
		Status: status,
		Title:  title,
		Detail: detail,
	})
}

func ValidationError(c *gin.Context, detail string, errors map[string]string) {
	c.AbortWithStatusJSON(422, ProblemDetails{
		Type:   "about:blank",
		Status: 422,
		Title:  "Validation Failed",
		Detail: detail,
		Errors: errors,
	})
}
