package store

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Admin struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type VerificationCode struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	Code       string    `gorm:"uniqueIndex;not null"`
	Scope      string    `gorm:"index;not null"`
	IsUsed     bool      `gorm:"not null;default:false"`
	ExpiresAt  time.Time `gorm:"index;not null"`
	UsedAt     *time.Time
	CreatedBy  *uuid.UUID `gorm:"type:uuid"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type User struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey"`
	Username          string    `gorm:"uniqueIndex;not null"`
	PasswordHash      string    `gorm:"not null"`
	ProxyAuthSecret   string    `gorm:"not null"`
	SubscriptionToken string    `gorm:"uniqueIndex;not null"`
	TotalTrafficGB    int64     `gorm:"not null;default:100"`
	UsedTrafficBytes  int64     `gorm:"not null;default:0"`
	Status            string    `gorm:"index;not null;default:'active'"`
	TrafficResetAt    time.Time `gorm:"not null"`
	RegisteredAt      time.Time `gorm:"not null"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func beforeCreateUUID(tx *gorm.DB) error {
	switch value := tx.Statement.Dest.(type) {
	case *Admin:
		if value.ID == uuid.Nil {
			value.ID = uuid.New()
		}
	case *VerificationCode:
		if value.ID == uuid.Nil {
			value.ID = uuid.New()
		}
	case *User:
		if value.ID == uuid.Nil {
			value.ID = uuid.New()
		}
	}

	return nil
}

func (a *Admin) BeforeCreate(tx *gorm.DB) error            { return beforeCreateUUID(tx) }
func (v *VerificationCode) BeforeCreate(tx *gorm.DB) error { return beforeCreateUUID(tx) }
func (u *User) BeforeCreate(tx *gorm.DB) error             { return beforeCreateUUID(tx) }
