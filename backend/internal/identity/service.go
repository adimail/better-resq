package identity

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"resq.app/backend/internal/shared/config"
	"resq.app/backend/internal/shared/db"
	"resq.app/backend/pkg/rfc7807"
)

type TokenReq struct {
	Phone string `json:"phone_number"`
	Pass  string `json:"password"`
}

type RefreshReq struct {
	Token string `json:"refresh_token"`
}

type RegisterReq struct {
	Phone    string `json:"phone_number"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Email    string `json:"email,omitempty"`
}

type DeviceReq struct {
	FCM      string `json:"fcm_token"`
	Location struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
}

func generateTokens(ctx context.Context, uid, role string) (string, string) {
	cfg := config.Load()
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  uid,
		"role": role,
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
	})
	acc, _ := t.SignedString([]byte(cfg.JWTSecret))
	ref := uuid.New().String()
	db.Pool.Exec(ctx, "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", uid, ref, time.Now().Add(7*24*time.Hour))
	return acc, ref
}

func RegisterService(c *gin.Context) {
	var req RegisterReq
	if err := c.BindJSON(&req); err != nil {
		return
	}

	valErrors := make(map[string]string)
	if req.Phone == "" {
		valErrors["phone_number"] = "Phone number is required"
	}
	if req.Password == "" {
		valErrors["password"] = "Password is required"
	} else if len(req.Password) < 8 {
		valErrors["password"] = "Password must be at least 8 characters"
	}
	if req.FullName == "" {
		valErrors["full_name"] = "Full name is required"
	}

	if len(valErrors) > 0 {
		rfc7807.ValidationError(c, "Please correct the highlighted fields", valErrors)
		return
	}

	var exists bool
	db.Pool.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM users WHERE phone_number = $1)", req.Phone).Scan(&exists)
	if exists {
		rfc7807.Error(c, http.StatusConflict, "Registration Conflict", "This phone number is already registered in our system")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		rfc7807.Error(c, 500, "Server Error", "Failed to process security credentials")
		return
	}
	var id, role string
	err = db.Pool.QueryRow(c, "INSERT INTO users (phone_number, password_hash, full_name, email, role) VALUES ($1, $2, $3, NULLIF($4, ''), 'CITIZEN') RETURNING id, role",
		req.Phone, string(hash), req.FullName, req.Email).Scan(&id, &role)
	if err != nil {
		rfc7807.Error(c, 500, "Database Error", "Failed to create user account")
		return
	}
	acc, ref := generateTokens(c, id, role)
	c.JSON(http.StatusCreated, gin.H{
		"access_token":  acc,
		"refresh_token": ref,
		"expires_in":    900,
		"user": gin.H{
			"id":           id,
			"full_name":    req.FullName,
			"phone_number": req.Phone,
			"email":        req.Email,
			"role":         role,
		},
	})
}

func LoginService(c *gin.Context) {
	var req TokenReq
	if err := c.BindJSON(&req); err != nil {
		return
	}
	var id, role, hash string
	err := db.Pool.QueryRow(c, "SELECT id, role, password_hash FROM users WHERE phone_number = $1", req.Phone).Scan(&id, &role, &hash)
	if err != nil {
		rfc7807.Error(c, http.StatusUnauthorized, "Authentication Failed", "No account found with this phone number")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Pass)); err != nil {
		rfc7807.Error(c, http.StatusUnauthorized, "Authentication Failed", "Incorrect password provided")
		return
	}
	acc, ref := generateTokens(c, id, role)
	c.JSON(http.StatusOK, gin.H{"access_token": acc, "refresh_token": ref, "expires_in": 900})
}

func RefreshService(c *gin.Context) {
	var req RefreshReq
	if err := c.BindJSON(&req); err != nil {
		return
	}
	var uid string
	err := db.Pool.QueryRow(c, "UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1 AND is_revoked = FALSE RETURNING user_id", req.Token).Scan(&uid)
	if err != nil {
		rfc7807.Error(c, http.StatusUnauthorized, "Session Expired", "Your session has expired, please log in again")
		return
	}
	var role string
	db.Pool.QueryRow(c, "SELECT role FROM users WHERE id = $1", uid).Scan(&role)
	acc, ref := generateTokens(c, uid, role)
	c.JSON(http.StatusOK, gin.H{"access_token": acc, "refresh_token": ref, "expires_in": 900})
}

func LogoutService(c *gin.Context) {
	var req RefreshReq
	if err := c.BindJSON(&req); err != nil {
		return
	}
	db.Pool.Exec(c, "UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1", req.Token)
	c.Status(http.StatusNoContent)
}

func GetProfileService(c *gin.Context) {
	uid := c.GetString("user_id")
	var id, fullName, phone, email, role string
	var createdAt time.Time
	err := db.Pool.QueryRow(c, "SELECT id, full_name, phone_number, COALESCE(email, ''), role, created_at FROM users WHERE id = $1", uid).
		Scan(&id, &fullName, &phone, &email, &role, &createdAt)
	if err != nil {
		rfc7807.Error(c, http.StatusNotFound, "User Not Found", "The requested profile does not exist")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":           id,
		"full_name":    fullName,
		"phone_number": phone,
		"email":        email,
		"role":         role,
		"created_at":   createdAt,
	})
}

func UpdateDeviceService(c *gin.Context) {
	var req DeviceReq
	if err := c.BindJSON(&req); err != nil {
		return
	}
	uid := c.GetString("user_id")
	db.Pool.Exec(c, "UPDATE users SET fcm_device_token = $1, last_known_location = ST_SetSRID(ST_MakePoint($2, $3), 4326) WHERE id = $4", req.FCM, req.Location.Lng, req.Location.Lat, uid)
	c.Status(http.StatusNoContent)
}

func GetUsersService(c *gin.Context) {
	role := c.GetString("role")
	if role != "AUTHORITY" {
		rfc7807.Error(c, http.StatusForbidden, "Access Denied", "Only administrators can view the user directory")
		return
	}
	rows, _ := db.Pool.Query(c, "SELECT id, full_name, phone_number, COALESCE(email, ''), role, created_at FROM users ORDER BY created_at DESC")
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, fullName, phone, email, r string
		var createdAt time.Time
		rows.Scan(&id, &fullName, &phone, &email, &r, &createdAt)
		out = append(out, map[string]any{
			"id":           id,
			"full_name":    fullName,
			"phone_number": phone,
			"email":        email,
			"role":         r,
			"created_at":   createdAt,
		})
	}
	if out == nil {
		out = []map[string]any{}
	}
	c.JSON(http.StatusOK, out)
}
