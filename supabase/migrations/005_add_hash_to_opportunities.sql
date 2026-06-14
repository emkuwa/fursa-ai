-- Add hash column to opportunities for deduplication
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_hash ON opportunities(hash) WHERE hash IS NOT NULL;
