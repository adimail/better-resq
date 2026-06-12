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
