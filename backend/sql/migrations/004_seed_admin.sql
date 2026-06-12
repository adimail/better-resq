-- +goose Up
INSERT INTO users (id, phone_number, password_hash, full_name, role)
VALUES (
    gen_random_uuid(),
    '0000000000',
    '$2a$10$ZGARKrlqL9M6P5SJ/W2sGeDCdQc.3rk8o9TSTCc4Vd8RRFXuk6dlq ',
    'System Admin',
    'AUTHORITY'
)
ON CONFLICT (phone_number) DO NOTHING;

-- +goose Down
DELETE FROM users WHERE phone_number = '0000000000';

