-- name: GetUserByPhone :one
SELECT id, role, password_hash FROM users WHERE phone_number = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (phone_number, password_hash, role) VALUES ($1, $2, $3) RETURNING id, role;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id;

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1;

-- name: UpdateUserDevice :exec
UPDATE users SET fcm_device_token = $2, last_known_location = ST_SetSRID(ST_MakePoint($3, $4), 4326) WHERE id = $1;

