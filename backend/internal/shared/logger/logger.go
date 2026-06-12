package logger

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"sync/atomic"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Env string

const (
	EnvDevelopment Env = "development"
	EnvStaging     Env = "staging"
	EnvProduction  Env = "production"
)

type Config struct {
	Env                   Env
	Level                 zapcore.Level
	ServiceName           string
	ServiceVersion        string
	AdditionalOutputPaths []string
}

var (
	instance atomic.Pointer[zap.Logger]
	mu       sync.Mutex
	initOnce sync.Once
	Log      *zap.Logger
)

func init() {
	nop := zap.NewNop()
	instance.Store(nop)
	Log = nop
}

func InitLogger(args ...any) error {
	var cfg Config

	switch len(args) {
	case 0:
		cfg = Config{Env: EnvDevelopment, Level: zapcore.InfoLevel}
	case 1:
		switch v := args[0].(type) {
		case bool:
			if v {
				cfg = Config{Env: EnvProduction, Level: zapcore.InfoLevel}
			} else {
				cfg = Config{Env: EnvDevelopment, Level: zapcore.InfoLevel}
			}
		case Config:
			cfg = v
		default:
			return fmt.Errorf("logger: InitLogger expects bool or Config, got %T", args[0])
		}
	default:
		return fmt.Errorf("logger: InitLogger expects 0 or 1 arguments, got %d", len(args))
	}

	return initLogger(cfg, false)
}

func ForceReinit(cfg Config) error {
	return initLogger(cfg, true)
}

func L() *zap.Logger        { return instance.Load() }
func S() *zap.SugaredLogger { return instance.Load().Sugar() }

func With(fields ...zap.Field) *zap.Logger {
	return instance.Load().With(fields...)
}

func Sync() error {
	err := instance.Load().Sync()
	if isIgnoredSyncError(err) {
		return nil
	}
	return err
}

func initLogger(cfg Config, force bool) error {
	mu.Lock()
	defer mu.Unlock()

	var initErr error
	run := func() {
		logger, err := build(cfg)
		if err != nil {
			initErr = fmt.Errorf("logger: build failed: %w", err)
			return
		}
		instance.Store(logger)
		Log = logger
		zap.ReplaceGlobals(logger)
	}

	if force {
		run()
	} else {
		initOnce.Do(run)
	}
	return initErr
}

func build(cfg Config) (*zap.Logger, error) {
	level := resolveLevel(cfg)
	enc := encoderConfig(cfg.Env)

	zapCfg := zap.Config{
		Level:             zap.NewAtomicLevelAt(level),
		Development:       cfg.Env == EnvDevelopment,
		DisableCaller:     false,
		DisableStacktrace: cfg.Env != EnvProduction,
		Sampling:          samplingPolicy(cfg.Env),
		Encoding:          encoding(cfg.Env),
		EncoderConfig:     enc,
		OutputPaths:       outputPaths(cfg),
		ErrorOutputPaths:  []string{"stderr"},
	}

	fields := staticFields(cfg)

	return zapCfg.Build(
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
		zap.Fields(fields...),
	)
}

func resolveLevel(cfg Config) zapcore.Level {
	if raw := os.Getenv("LOG_LEVEL"); raw != "" {
		var l zapcore.Level
		if err := l.UnmarshalText([]byte(raw)); err == nil {
			return l
		}
	}
	return cfg.Level
}

func encoding(env Env) string {
	if env == EnvProduction || env == EnvStaging {
		return "json"
	}
	return "console"
}

func encoderConfig(env Env) zapcore.EncoderConfig {
	enc := zapcore.EncoderConfig{
		TimeKey:        "ts",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	if env == EnvProduction || env == EnvStaging {
		enc.EncodeLevel = zapcore.LowercaseLevelEncoder
	} else {
		enc.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}
	return enc
}

func samplingPolicy(env Env) *zap.SamplingConfig {
	if env != EnvProduction {
		return nil
	}
	return &zap.SamplingConfig{
		Initial:    100,
		Thereafter: 100,
	}
}

func outputPaths(cfg Config) []string {
	return append([]string{"stdout"}, cfg.AdditionalOutputPaths...)
}

func staticFields(cfg Config) []zap.Field {
	var fields []zap.Field
	if cfg.ServiceName != "" {
		fields = append(fields, zap.String("service", cfg.ServiceName))
	}
	if cfg.ServiceVersion != "" {
		fields = append(fields, zap.String("version", cfg.ServiceVersion))
	}
	fields = append(fields, zap.String("env", string(cfg.Env)))
	return fields
}

func isIgnoredSyncError(err error) bool {
	if err == nil {
		return true
	}
	msg := err.Error()
	for _, known := range []string{"invalid argument", "inappropriate ioctl for device"} {
		if strings.Contains(msg, known) {
			return true
		}
	}
	return false
}
