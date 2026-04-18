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
	return db.AutoMigrate(&Admin{}, &VerificationCode{}, &User{}, &TrafficSnapshot{})
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

func NextUsername(db *gorm.DB) (string, error) {
	var count int64
	if err := db.Model(&User{}).Count(&count).Error; err != nil {
		return "", err
	}

	return fmt.Sprintf("user%d", count+1), nil
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
