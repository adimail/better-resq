-- +goose Up

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CITIZEN',
    fcm_device_token VARCHAR(255),
    last_known_location GEOGRAPHY(Point),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sos_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES users(id),
    location GEOGRAPHY(Point) NOT NULL,
    battery_level INT,
    message TEXT,
    status VARCHAR(20) DEFAULT 'active',
    responder_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id),
    disaster_type VARCHAR(50) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    location GEOGRAPHY(Point) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    ai_confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE danger_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id),
    disaster_type VARCHAR(50) NOT NULL,
    severity_level INT NOT NULL,
    boundary GEOGRAPHY(Polygon) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE resource_camps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    camp_type VARCHAR(50) NOT NULL,
    stock_status VARCHAR(50) DEFAULT 'fully_stocked',
    location GEOGRAPHY(Point) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE geo_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authority_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    severity INT NOT NULL,
    target_area GEOGRAPHY(Polygon) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS geo_broadcasts;
DROP TABLE IF EXISTS resource_camps;
DROP TABLE IF EXISTS danger_zones;
DROP TABLE IF EXISTS incident_reports;
DROP TABLE IF EXISTS sos_signals;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP EXTENSION IF EXISTS postgis CASCADE;
