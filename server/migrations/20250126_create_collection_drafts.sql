CREATE TYPE draft_status AS ENUM ('draft', 'uploading', 'deployed');

CREATE TABLE collection_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    blockchain TEXT NOT NULL,
    nft_standard TEXT,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    description TEXT,
    supply INTEGER NOT NULL,
    mint_price TEXT NOT NULL,
    royalty_bps INTEGER NOT NULL,
    collection_image_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status draft_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_drafts_user_id ON collection_drafts(user_id);
CREATE INDEX idx_collection_drafts_status ON collection_drafts(status);
CREATE INDEX idx_collection_drafts_created_at ON collection_drafts(created_at DESC);
