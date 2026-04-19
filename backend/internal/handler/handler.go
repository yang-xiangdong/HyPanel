package handler

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hypanel/backend/internal/auth"
	"github.com/hypanel/backend/internal/config"
	"github.com/hypanel/backend/internal/hysteria"
	"github.com/hypanel/backend/internal/middleware"
	"github.com/hypanel/backend/internal/store"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Handler struct {
	db           *gorm.DB
	tokenManager *auth.TokenManager
	hysteria     *hysteria.Client
	config       config.Config
}

type adminLoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type createCodeRequest struct {
	Scope string `json:"scope" binding:"required"`
}

type registerRequest struct {
	Code string `json:"code" binding:"required"`
}

type userLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type hysteriaAuthRequest struct {
	Addr string `json:"addr"`
	Auth string `json:"auth"`
	TX   int64  `json:"tx"`
}

type updateUserRequest struct {
	Status         *string `json:"status"`
	TotalTrafficGB *int64  `json:"totalTrafficGB"`
}

func New(db *gorm.DB, tokenManager *auth.TokenManager, hysteriaClient *hysteria.Client, cfg config.Config) *Handler {
	return &Handler{db: db, tokenManager: tokenManager, hysteria: hysteriaClient, config: cfg}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	authLimiter := middleware.NewRateLimiter(10, time.Minute)

	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", h.health)
		v1.POST("/admin/login", authLimiter.Middleware(), h.adminLogin)
		v1.POST("/auth/register", authLimiter.Middleware(), h.registerUser)
		v1.POST("/auth/login", authLimiter.Middleware(), h.userLogin)
		v1.POST("/hysteria/auth", h.hysteriaAuth)
		v1.GET("/subscriptions/:token", h.subscription)
	}

	admin := v1.Group("/admin")
	admin.Use(middleware.RequireRole(h.tokenManager, "admin"))
	{
		admin.POST("/codes", h.createVerificationCode)
		admin.GET("/dashboard", h.adminDashboard)
		admin.POST("/users/:username/reset-password", h.adminResetUserPassword)
		admin.PATCH("/users/:username", h.adminUpdateUser)
	}

	user := v1.Group("")
	user.Use(middleware.RequireRole(h.tokenManager, "user"))
	{
		user.GET("/me", h.me)
	}
}

func (h *Handler) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) adminLogin(c *gin.Context) {
	var req adminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var admin store.Admin
	if err := h.db.Where("email = ?", req.Email).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := h.tokenManager.Generate(admin.ID.String(), "admin")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func (h *Handler) createVerificationCode(c *gin.Context) {
	var req createCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	codeValue, err := randomDigits(6)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate code"})
		return
	}

	code := store.VerificationCode{
		Code:      codeValue,
		Scope:     req.Scope,
		ExpiresAt: time.Now().Add(time.Hour),
	}

	if err := h.db.Create(&code).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save code"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"code":       code.Code,
		"scope":      code.Scope,
		"expiresAt":  code.ExpiresAt,
		"description": "verification code is valid for 1 hour",
	})
}

func (h *Handler) adminDashboard(c *gin.Context) {
	var users []store.User
	if err := h.db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load users"})
		return
	}

	// Still use Hysteria for online count (real-time data).
	trafficStats, _ := h.hysteria.GetTrafficStats()
	onlineByUser := make(map[string]int, len(trafficStats))
	for _, item := range trafficStats {
		onlineByUser[item.Username] = item.OnlineCount
	}

	type dashboardUser struct {
		Username           string `json:"username"`
		Status             string `json:"status"`
		TotalTrafficGB     int64  `json:"totalTrafficGB"`
		UsedTrafficBytes   int64  `json:"usedTrafficBytes"`
		RemainingTrafficGB int64  `json:"remainingTrafficGB"`
		OnlineCount        int    `json:"onlineCount"`
	}

	userRows := make([]dashboardUser, 0, len(users))
	for _, user := range users {
		remainingTrafficGB := user.TotalTrafficGB - bytesToGB(user.UsedTrafficBytes)
		if remainingTrafficGB < 0 {
			remainingTrafficGB = 0
		}

		userRows = append(userRows, dashboardUser{
			Username:           user.Username,
			Status:             user.Status,
			TotalTrafficGB:     user.TotalTrafficGB,
			UsedTrafficBytes:   user.UsedTrafficBytes,
			RemainingTrafficGB: remainingTrafficGB,
			OnlineCount:        onlineByUser[user.Username],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users": userRows,
	})
}

func (h *Handler) registerUser(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	passwordPlain, err := randomPassword(12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate password"})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(passwordPlain), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to secure password"})
		return
	}

	var user store.User
	err = h.db.Transaction(func(tx *gorm.DB) error {
		code, err := store.VerifyCode(tx, req.Code, "register")
		if err != nil {
			return err
		}
		if code == nil {
			return fmt.Errorf("invalid or expired code")
		}

		username, err := store.NextUsername(tx)
		if err != nil {
			return err
		}

		now := time.Now()
		user = store.User{
			Username:          username,
			PasswordHash:      string(passwordHash),
			ProxyAuthSecret:   passwordPlain,
			SubscriptionToken: uuid.NewString(),
			RegisteredAt:      now,
			TrafficResetAt:    time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()),
			TotalTrafficGB:    100,
		}

		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		code.IsUsed = true
		code.UsedAt = &now
		return tx.Save(code).Error
	})
	if err != nil {
		if err.Error() == "invalid or expired code" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"username":          user.Username,
		"password":          passwordPlain,
		"subscriptionUrl":   fmt.Sprintf("%s/%s", h.config.SubscriptionBaseURL, user.SubscriptionToken),
		"totalTrafficGB":    user.TotalTrafficGB,
		"remainingTrafficGB": user.TotalTrafficGB,
	})
}

func (h *Handler) userLogin(c *gin.Context) {
	var req userLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user store.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := h.tokenManager.Generate(user.ID.String(), "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue token"})
		return
	}

	remainingTrafficGB := user.TotalTrafficGB - bytesToGB(user.UsedTrafficBytes)
	if remainingTrafficGB < 0 {
		remainingTrafficGB = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"username":           user.Username,
			"subscriptionUrl":    fmt.Sprintf("%s/%s", h.config.SubscriptionBaseURL, user.SubscriptionToken),
			"totalTrafficGB":     user.TotalTrafficGB,
			"remainingTrafficGB": remainingTrafficGB,
			"usedTrafficBytes":   user.UsedTrafficBytes,
		},
	})
}

func (h *Handler) me(c *gin.Context) {
	subject, exists := c.Get("subject")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing subject"})
		return
	}

	var user store.User
	if err := h.db.Where("id = ?", subject).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	remainingTrafficGB := user.TotalTrafficGB - bytesToGB(user.UsedTrafficBytes)
	if remainingTrafficGB < 0 {
		remainingTrafficGB = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"username":           user.Username,
		"subscriptionUrl":    fmt.Sprintf("%s/%s", h.config.SubscriptionBaseURL, user.SubscriptionToken),
		"totalTrafficGB":     user.TotalTrafficGB,
		"remainingTrafficGB": remainingTrafficGB,
		"usedTrafficBytes":   user.UsedTrafficBytes,
	})
}

func (h *Handler) subscription(c *gin.Context) {
	token := c.Param("token")

	var user store.User
	if err := h.db.Where("subscription_token = ?", token).First(&user).Error; err != nil {
		c.String(http.StatusNotFound, "subscription not found")
		return
	}

	c.Header("Content-Type", "text/yaml; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%s.yaml", user.Username))
	c.String(http.StatusOK, h.renderSubscription(user))
}

func (h *Handler) hysteriaAuth(c *gin.Context) {
	var req hysteriaAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false})
		return
	}

	username, password, ok := strings.Cut(req.Auth, ":")
	if !ok || username == "" || password == "" {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	var user store.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	if user.ProxyAuthSecret != password {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	if bytesToGB(user.UsedTrafficBytes) >= user.TotalTrafficGB {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"id": user.Username,
	})
}

func (h *Handler) adminResetUserPassword(c *gin.Context) {
	username := c.Param("username")

	var user store.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	newPassword, err := randomPassword(12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate password"})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to secure password"})
		return
	}

	user.PasswordHash = string(passwordHash)
	user.ProxyAuthSecret = newPassword
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"username":        user.Username,
		"password":        newPassword,
		"subscriptionUrl": fmt.Sprintf("%s/%s", h.config.SubscriptionBaseURL, user.SubscriptionToken),
	})
}

func (h *Handler) adminUpdateUser(c *gin.Context) {
	username := c.Param("username")

	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user store.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if req.Status != nil {
		switch *req.Status {
		case "active", "disabled":
			user.Status = *req.Status
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
			return
		}
	}

	if req.TotalTrafficGB != nil {
		if *req.TotalTrafficGB < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid traffic quota"})
			return
		}
		user.TotalTrafficGB = *req.TotalTrafficGB
	}

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	remainingTrafficGB := user.TotalTrafficGB - bytesToGB(user.UsedTrafficBytes)
	if remainingTrafficGB < 0 {
		remainingTrafficGB = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"username":           user.Username,
		"status":             user.Status,
		"totalTrafficGB":     user.TotalTrafficGB,
		"usedTrafficBytes":   user.UsedTrafficBytes,
		"remainingTrafficGB": remainingTrafficGB,
	})
}

func randomDigits(length int) (string, error) {
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		result[i] = byte('0' + n.Int64())
	}

	return string(result), nil
}

func randomPassword(length int) (string, error) {
	buffer := make([]byte, length)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	encoded := base64.RawURLEncoding.EncodeToString(buffer)
	if len(encoded) < length {
		return encoded, nil
	}

	return encoded[:length], nil
}

func bytesToGB(bytes int64) int64 {
	return bytes / 1024 / 1024 / 1024
}

func (h *Handler) renderSubscription(user store.User) string {
	proxyName := fmt.Sprintf("HyPanel-%s", user.Username)
	password := fmt.Sprintf("%s:%s", user.Username, user.ProxyAuthSecret)

	return fmt.Sprintf(`mixed-port: 7890
redir-port: 7892
allow-lan: true
mode: rule
log-level: info
ipv6: false
unified-delay: true
tcp-concurrent: true
find-process-mode: strict
global-client-fingerprint: chrome

profile:
  store-selected: true
  store-fake-ip: true

external-controller: 127.0.0.1:9090
secret: "change-this-to-a-local-secret"

dns:
  enable: true
  ipv6: false
  use-hosts: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 223.6.6.6
    - 119.29.29.29
  nameserver:
    - 223.6.6.6
    - 119.29.29.29
  fallback:
    - https://api.babyqq.net/xxoo
    - https://cdn.babyqq.net/xxoo
    - https://www.babyqqq.com/dns-query
  fallback-filter:
    geoip: true
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32

proxies:
  - name: %s
    type: hysteria2
    server: %s
    port: %s
    password: "%s"
    sni: %s
    alpn:
      - %s
    obfs: %s
    obfs-password: "%s"
    skip-cert-verify: %s
    udp: true

proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - %s
      - DIRECT

  - name: AdBlock
    type: select
    proxies:
      - REJECT
      - DIRECT
      - PROXY

  - name: Domestic
    type: select
    proxies:
      - DIRECT
      - PROXY

rules:
  - DOMAIN-SUFFIX,chatgpt.com,PROXY
  - DOMAIN-SUFFIX,openai.com,PROXY
  - DOMAIN-SUFFIX,oaistatic.com,PROXY
  - DOMAIN-SUFFIX,oaiusercontent.com,PROXY
  - DOMAIN-SUFFIX,auth0.com,PROXY
  - DOMAIN-SUFFIX,google.com,PROXY
  - DOMAIN-SUFFIX,gstatic.com,PROXY
  - DOMAIN-SUFFIX,googleapis.com,PROXY
  - DOMAIN-SUFFIX,googlevideo.com,PROXY
  - DOMAIN-SUFFIX,youtube.com,PROXY
  - DOMAIN-SUFFIX,ytimg.com,PROXY
  - DOMAIN-SUFFIX,telegram.org,PROXY
  - DOMAIN-SUFFIX,t.me,PROXY
  - DOMAIN-SUFFIX,github.com,PROXY
  - DOMAIN-SUFFIX,githubusercontent.com,PROXY
  - DOMAIN-SUFFIX,githubassets.com,PROXY
  - DOMAIN-SUFFIX,anthropic.com,PROXY
  - DOMAIN-SUFFIX,claude.ai,PROXY
  - DOMAIN-SUFFIX,perplexity.ai,PROXY
  - DOMAIN-SUFFIX,notion.so,PROXY
  - DOMAIN-SUFFIX,notion.site,PROXY
  - DOMAIN-SUFFIX,cursor.sh,PROXY
  - DOMAIN-SUFFIX,cursor.com,PROXY
  - DOMAIN-SUFFIX,apple.com,Domestic
  - DOMAIN-SUFFIX,icloud.com,Domestic
  - DOMAIN-SUFFIX,microsoft.com,Domestic
  - DOMAIN-SUFFIX,live.com,Domestic
  - DOMAIN-SUFFIX,office.com,Domestic
  - DOMAIN-SUFFIX,windowsupdate.com,Domestic
  - DOMAIN-SUFFIX,doubleclick.net,AdBlock
  - DOMAIN-SUFFIX,googlesyndication.com,AdBlock
  - DOMAIN-SUFFIX,googleadservices.com,AdBlock
  - DOMAIN-SUFFIX,googletagmanager.com,AdBlock
  - DOMAIN-SUFFIX,googletagservices.com,AdBlock
  - DOMAIN-SUFFIX,adservice.google.com,AdBlock
  - DOMAIN-SUFFIX,ads-twitter.com,AdBlock
  - DOMAIN-SUFFIX,app-measurement.com,AdBlock
  - DOMAIN-SUFFIX,ad.m.iqiyi.com,AdBlock
  - DOMAIN-SUFFIX,cupid.iqiyi.com,AdBlock
  - DOMAIN-SUFFIX,msg.iqiyi.com,AdBlock
  - DOMAIN-SUFFIX,ad.api.3g.youku.com,AdBlock
  - DOMAIN-SUFFIX,ad.mobile.youku.com,AdBlock
  - DOMAIN-SUFFIX,hz.youku.com,AdBlock
  - DOMAIN-SUFFIX,da.mgtv.com,AdBlock
  - DOMAIN-SUFFIX,mobile.da.mgtv.com,AdBlock
  - DOMAIN-SUFFIX,adnet.sohu.com,AdBlock
  - DOMAIN-SUFFIX,aty.sohu.com,AdBlock
  - DOMAIN-SUFFIX,afp.pplive.com,AdBlock
  - DOMAIN-SUFFIX,stat.pptv.com,AdBlock
  - DOMAIN-SUFFIX,gcdn.2mdn.net,AdBlock
  - DOMAIN-SUFFIX,statcounter.com,AdBlock
  - DOMAIN-SUFFIX,51.la,AdBlock
  - DOMAIN,localhost,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,100.64.0.0/10,DIRECT
  - GEOIP,CN,Domestic
  - MATCH,PROXY
`, proxyName,
		yamlString(h.config.HysteriaServer),
		yamlString(h.config.HysteriaPort),
		yamlString(password),
		yamlString(h.config.HysteriaSNI),
		yamlString(h.config.HysteriaALPN),
		yamlString(h.config.HysteriaObfs),
		yamlString(h.config.HysteriaObfsPassword),
		strings.ToLower(h.config.HysteriaSkipCert),
		proxyName)
}

func yamlString(value string) string {
	return strings.ReplaceAll(value, "\n", "")
}
