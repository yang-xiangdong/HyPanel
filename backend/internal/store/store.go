package store

import (
	"errors"
	"fmt"
	"time"

	"github.com/hypanel/backend/internal/config"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Open(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(&Admin{}, &VerificationCode{}); err != nil {
		return err
	}

	// Backward-compatible migration for existing deployments:
	// add traffic_reset_at as nullable, backfill, then enforce NOT NULL.
	if db.Migrator().HasTable(&User{}) && !db.Migrator().HasColumn(&User{}, "traffic_reset_at") {
		if err := db.Exec(`ALTER TABLE "users" ADD COLUMN "traffic_reset_at" timestamptz`).Error; err != nil {
			return err
		}

		if err := db.Exec(`
			UPDATE "users"
			SET "traffic_reset_at" = date_trunc('month', COALESCE("registered_at", NOW()))
			WHERE "traffic_reset_at" IS NULL
		`).Error; err != nil {
			return err
		}

		if err := db.Exec(`ALTER TABLE "users" ALTER COLUMN "traffic_reset_at" SET NOT NULL`).Error; err != nil {
			return err
		}
	}

	return db.AutoMigrate(&User{})
}

func SeedAdmin(db *gorm.DB, cfg config.Config) error {
	var count int64
	if err := db.Model(&Admin{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminBootstrapPass), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := Admin{
		Email:        cfg.AdminBootstrapEmail,
		PasswordHash: string(passwordHash),
	}

	return db.Create(&admin).Error
}

func NextUsername(tx *gorm.DB) (string, error) {
	var maxNum int64
	err := tx.Model(&User{}).
		Select("COALESCE(MAX(CAST(SUBSTRING(username FROM 'user(\\d+)') AS BIGINT)), 0)").
		Row().Scan(&maxNum)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("user%d", maxNum+1), nil
}

func VerifyCode(db *gorm.DB, code, scope string) (*VerificationCode, error) {
	var verificationCode VerificationCode
	err := db.Where("code = ? AND scope = ? AND is_used = ? AND expires_at > ?", code, scope, false, time.Now()).
		First(&verificationCode).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &verificationCode, nil
}
