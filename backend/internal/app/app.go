package app

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hypanel/backend/internal/auth"
	"github.com/hypanel/backend/internal/config"
	"github.com/hypanel/backend/internal/handler"
	"github.com/hypanel/backend/internal/hysteria"
	"github.com/hypanel/backend/internal/store"
)

type App struct {
	cfg    config.Config
	router *gin.Engine
}

func New() (*App, error) {
	cfg := config.Load()

	db, err := store.Open(cfg.DatabaseDSN())
	if err != nil {
		return nil, err
	}

	if err := store.AutoMigrate(db); err != nil {
		return nil, err
	}

	if err := store.SeedAdmin(db, cfg); err != nil {
		return nil, err
	}

	tokenManager := auth.NewTokenManager(cfg.JWTSecret)
	hysteriaClient := hysteria.NewClient(cfg.HysteriaAPIBaseURL, cfg.HysteriaAPIToken)
	apiHandler := handler.New(db, tokenManager, hysteriaClient, cfg)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	apiHandler.RegisterRoutes(router)

	return &App{
		cfg:    cfg,
		router: router,
	}, nil
}

func (a *App) Run() error {
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:              fmt.Sprintf(":%s", port),
		Handler:           a.router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return server.ListenAndServe()
}
