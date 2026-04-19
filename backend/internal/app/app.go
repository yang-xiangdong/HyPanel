package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hypanel/backend/internal/auth"
	"github.com/hypanel/backend/internal/config"
	"github.com/hypanel/backend/internal/handler"
	"github.com/hypanel/backend/internal/hysteria"
	"github.com/hypanel/backend/internal/store"
	"github.com/hypanel/backend/internal/traffic"
)

type App struct {
	cfg    config.Config
	router *gin.Engine
	syncer *traffic.Syncer
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
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		MaxAge:           12 * time.Hour,
	}))

	apiHandler.RegisterRoutes(router)

	// Start background traffic syncer (every 5 minutes).
	syncer := traffic.NewSyncer(db, hysteriaClient, 5*time.Minute)
	syncer.Start()

	return &App{
		cfg:    cfg,
		router: router,
		syncer: syncer,
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

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down server...")

	a.syncer.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		return fmt.Errorf("server forced to shutdown: %w", err)
	}

	log.Println("server exited gracefully")
	return nil
}
