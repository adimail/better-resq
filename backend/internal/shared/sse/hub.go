package sse

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	goredis "github.com/redis/go-redis/v9"
	"resq.app/backend/internal/shared/redis"
)

type Hub struct {
	clients map[string][]chan string
	mu      sync.RWMutex
}

var GlobalHub = &Hub{
	clients: make(map[string][]chan string),
}

func (h *Hub) AddClient(uid string, ch chan string) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.clients[uid]) >= 3 {
		return errors.New("connection limit reached")
	}
	h.clients[uid] = append(h.clients[uid], ch)
	return nil
}

func (h *Hub) RemoveClient(uid string, ch chan string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	chs := h.clients[uid]
	for i, c := range chs {
		if c == ch {
			h.clients[uid] = append(chs[:i], chs[i+1:]...)
			break
		}
	}
}

func (h *Hub) Broadcast(payload string) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, chs := range h.clients {
		for _, ch := range chs {
			select {
			case ch <- payload:
			default:
			}
		}
	}
}

func StartWorker() {
	ctx := context.Background()
	redis.Client.XGroupCreateMkStream(ctx, "resq:stream:events", "sse_hub_group", "0").Result()

	go func() {
		for {
			res, err := redis.Client.XReadGroup(ctx, &goredis.XReadGroupArgs{
				Group:    "sse_hub_group",
				Consumer: "hub_1",
				Streams:  []string{"resq:stream:events", ">"},
				Block:    0,
			}).Result()
			if err == nil {
				for _, stream := range res {
					for _, msg := range stream.Messages {
						b, _ := json.Marshal(msg.Values)
						GlobalHub.Broadcast(string(b))
						redis.Client.XAck(ctx, "resq:stream:events", "sse_hub_group", msg.ID)
					}
				}
			}
			time.Sleep(100 * time.Millisecond)
		}
	}()
}

func Handler(c *gin.Context) {
	uid := c.GetString("user_id")
	if uid == "" {
		uid = "anon"
	}
	ch := make(chan string, 10)
	err := GlobalHub.AddClient(uid, ch)
	if err != nil {
		c.AbortWithStatus(http.StatusTooManyRequests)
		return
	}
	defer GlobalHub.RemoveClient(uid, ch)

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case msg := <-ch:
			c.Writer.Write([]byte("data: " + msg + "\n\n"))
			c.Writer.Flush()
		case <-ticker.C:
			c.Writer.Write([]byte("\n\n"))
			c.Writer.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}
