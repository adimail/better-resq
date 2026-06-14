package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	RedisURL            string
	JWTSecret           string
	GinMode             string
	CloudinaryCloudName string
	CloudinaryApiKey    string
	CloudinaryApiSecret string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://resq:resq@localhost:5432/resq_dev?sslmode=disable"),
		RedisURL:            getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:           getEnv("JWT_SECRET", "default-secret"),
		GinMode:             getEnv("GIN_MODE", "debug"),
		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", "demo"),
		CloudinaryApiKey:    getEnv("CLOUDINARY_API_KEY", "key"),
		CloudinaryApiSecret: getEnv("CLOUDINARY_API_SECRET", "secret"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
