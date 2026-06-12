-- name: CreateSOS :one
INSERT INTO sos_signals (citizen_id, location, battery_level, message) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5) RETURNING id;

-- name: UpdateSOSStatus :exec
UPDATE sos_signals SET status = $2, responder_id = $3 WHERE id = $1;

-- name: ListSOS :many
SELECT id, citizen_id, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat, battery_level, message, status FROM sos_signals WHERE status = $1 ORDER BY created_at DESC LIMIT $2;

