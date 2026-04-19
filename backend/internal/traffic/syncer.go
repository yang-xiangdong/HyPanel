package traffic

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/hypanel/backend/internal/hysteria"
	"github.com/hypanel/backend/internal/store"
	"gorm.io/gorm"
)

type Syncer struct {
	db       *gorm.DB
	hysteria *hysteria.Client
	interval time.Duration
	cancel   context.CancelFunc

	mu       sync.Mutex
	lastSeen map[string]int64 // username -> last known Hysteria totalBytes
}

func NewSyncer(db *gorm.DB, hysteriaClient *hysteria.Client, interval time.Duration) *Syncer {
	return &Syncer{
		db:       db,
		hysteria: hysteriaClient,
		interval: interval,
		lastSeen: make(map[string]int64),
	}
}

func (s *Syncer) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	go s.loop(ctx)
}

func (s *Syncer) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
}

func (s *Syncer) loop(ctx context.Context) {
	// First tick: only record baselines, don't accumulate.
	s.recordBaseline()

	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[traffic-syncer] stopped")
			return
		case <-ticker.C:
			s.sync()
		}
	}
}

// recordBaseline captures current Hysteria counters without adding deltas.
// This prevents double-counting on syncer (re)start.
func (s *Syncer) recordBaseline() {
	stats, err := s.hysteria.GetTrafficStats()
	if err != nil {
		log.Printf("[traffic-syncer] failed to get baseline stats: %v", err)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, item := range stats {
		s.lastSeen[item.Username] = item.TotalBytes
	}
}

func (s *Syncer) sync() {
	stats, err := s.hysteria.GetTrafficStats()
	if err != nil {
		log.Printf("[traffic-syncer] failed to get hysteria stats: %v", err)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, item := range stats {
		s.processUser(item)
	}
}

func (s *Syncer) processUser(item hysteria.UserTraffic) {
	current := item.TotalBytes
	last, known := s.lastSeen[item.Username]

	// Update baseline for next tick.
	s.lastSeen[item.Username] = current

	if !known {
		// New user appeared after baseline — record and wait for next tick.
		return
	}

	var delta int64
	if current < last {
		// Hysteria restarted (counter reset). Use current as delta.
		delta = current
	} else {
		delta = current - last
	}

	if delta <= 0 {
		return
	}

	var user store.User
	if err := s.db.Where("username = ?", item.Username).First(&user).Error; err != nil {
		return
	}

	// Check monthly reset: if TrafficResetAt is in a previous month, reset usage.
	now := time.Now()
	if shouldReset(user.TrafficResetAt, now) {
		s.db.Model(&user).Updates(map[string]any{
			"used_traffic_bytes": delta,
			"traffic_reset_at":   beginningOfMonth(now),
		})
		return
	}

	// Atomic increment — avoids overwriting concurrent admin changes.
	s.db.Model(&user).Update("used_traffic_bytes", gorm.Expr("used_traffic_bytes + ?", delta))
}

// shouldReset returns true if resetAt is in a previous month relative to now.
func shouldReset(resetAt, now time.Time) bool {
	return resetAt.Year() < now.Year() ||
		(resetAt.Year() == now.Year() && resetAt.Month() < now.Month())
}

// beginningOfMonth returns the first moment of the current month.
func beginningOfMonth(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
}
