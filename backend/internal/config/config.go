package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost               string
	DBPort               string
	DBName               string
	DBUser               string
	DBPassword           string
	JWTSecret            string
	AdminBootstrapEmail  string
	AdminBootstrapPass   string
	HysteriaAPIBaseURL   string
	HysteriaAPIToken     string
	SubscriptionBaseURL  string
	HysteriaServer       string
	HysteriaPort         string
	HysteriaSNI          string
	HysteriaALPN         string
	HysteriaObfs         string
	HysteriaObfsPassword string
	HysteriaSkipCert     string
	HysteriaAuthSecret   string
}

func Load() Config {
	return Config{
		DBHost:              envOrDefault("DB_HOST", "postgres"),
		DBPort:              envOrDefault("DB_PORT", "5432"),
		DBName:              envOrDefault("POSTGRES_DB", "hypanel"),
		DBUser:              envOrDefault("POSTGRES_USER", "hypanel"),
		DBPassword:          envOrDefault("POSTGRES_PASSWORD", "changeme"),
		JWTSecret:           envOrDefault("JWT_SECRET", "replace-me"),
		AdminBootstrapEmail: envOrDefault("ADMIN_BOOTSTRAP_EMAIL", "admin@example.com"),
		AdminBootstrapPass:  envOrDefault("ADMIN_BOOTSTRAP_PASSWORD", "ChangeThisNow123!"),
		HysteriaAPIBaseURL:  envOrDefault("HYSTERIA_API_BASE_URL", ""),
		HysteriaAPIToken:    envOrDefault("HYSTERIA_API_TOKEN", ""),
		SubscriptionBaseURL: envOrDefault("SUBSCRIPTION_BASE_URL", "http://localhost:8080/api/v1/subscriptions"),
		HysteriaServer:      envOrDefault("HYSTERIA_SERVER", "yxd.dpdns.org"),
		HysteriaPort:        envOrDefault("HYSTERIA_PORT", "443"),
		HysteriaSNI:         envOrDefault("HYSTERIA_SNI", "yxd.dpdns.org"),
		HysteriaALPN:        envOrDefault("HYSTERIA_ALPN", "h3"),
		HysteriaObfs:        envOrDefault("HYSTERIA_OBFS", "salamander"),
		HysteriaObfsPassword: envOrDefault("HYSTERIA_OBFS_PASSWORD", ""),
		HysteriaSkipCert:    envOrDefault("HYSTERIA_SKIP_CERT_VERIFY", "false"),
		HysteriaAuthSecret:  envOrDefault("HYSTERIA_AUTH_SECRET", ""),
	}
}

func (c Config) DatabaseDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		c.DBHost,
		c.DBPort,
		c.DBUser,
		c.DBPassword,
		c.DBName,
	)
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
