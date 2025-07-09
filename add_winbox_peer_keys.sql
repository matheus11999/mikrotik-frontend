-- Add winbox peer keys columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS winbox_peer_private_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS winbox_peer_preshared_key TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.winbox_peer_private_key IS 'Private key of the user''s WireGuard peer for Winbox access';
COMMENT ON COLUMN users.winbox_peer_preshared_key IS 'Preshared key of the user''s WireGuard peer for Winbox access';