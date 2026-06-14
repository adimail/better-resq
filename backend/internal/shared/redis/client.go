package redis

import (
	"context"

	goredis "github.com/redis/go-redis/v9"
)

var Client *goredis.Client

func Init(url string) {
	opts, err := goredis.ParseURL(url)
	if err != nil {
		panic(err)
	}
	Client = goredis.NewClient(opts)
}

func Close() error {
	if Client != nil {
		return Client.Close()
	}
	return nil
}

func PublishEvent(ctx context.Context, stream string, data map[string]interface{}) {
	Client.XAdd(ctx, &goredis.XAddArgs{
		Stream: stream,
		Values: data,
	})
}

type StreamMessage struct {
	ID     string
	Values map[string]interface{}
}

func GetRecentEvents(ctx context.Context, stream string, count int64) ([]StreamMessage, error) {
	msgs, err := Client.XRevRangeN(ctx, stream, "+", "-", count).Result()
	if err != nil {
		return nil, err
	}
	out := make([]StreamMessage, 0, len(msgs))
	for _, m := range msgs {
		out = append(out, StreamMessage{ID: m.ID, Values: m.Values})
	}
	return out, nil
}
