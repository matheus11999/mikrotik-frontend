-- Add winbox_peer_public_key column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS winbox_peer_public_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.winbox_peer_public_key IS 'Public key of the user''s WireGuard peer for Winbox access';