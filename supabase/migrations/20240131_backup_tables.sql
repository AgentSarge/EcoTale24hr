-- Create enum for backup status
CREATE TYPE backup_status AS ENUM ('completed', 'failed', 'in_progress');
CREATE TYPE backup_type AS ENUM ('full', 'incremental');

-- Create backup_metadata table
CREATE TABLE backup_metadata (
    id UUID PRIMARY KEY,
    type backup_type NOT NULL,
    status backup_status NOT NULL DEFAULT 'in_progress',
    size_bytes BIGINT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    checksum TEXT,
    encryption_key_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create backup_events table
CREATE TABLE backup_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID REFERENCES backup_metadata(id),
    event TEXT NOT NULL,
    type TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to initiate backup
CREATE OR REPLACE FUNCTION create_backup(
    backup_id UUID,
    backup_type backup_type
) RETURNS void AS $$
BEGIN
    -- This is a placeholder for the actual backup logic
    -- In production, this would interface with Supabase's backup system
    -- or your chosen backup solution
    
    -- Update backup metadata
    UPDATE backup_metadata
    SET status = 'completed',
        completed_at = NOW(),
        size_bytes = 0, -- Replace with actual size
        checksum = 'placeholder' -- Replace with actual checksum
    WHERE id = backup_id;
    
    -- Log backup completion
    INSERT INTO backup_events (backup_id, event, type)
    VALUES (backup_id, 'backup_completed', backup_type::text);
END;
$$ LANGUAGE plpgsql;

-- Create function to restore from backup
CREATE OR REPLACE FUNCTION restore_backup(
    backup_id UUID
) RETURNS void AS $$
BEGIN
    -- This is a placeholder for the actual restore logic
    -- In production, this would interface with Supabase's restore system
    -- or your chosen backup solution
    
    -- Log restore attempt
    INSERT INTO backup_events (backup_id, event)
    VALUES (backup_id, 'restore_initiated');
    
    -- Verify backup exists and is valid
    IF NOT EXISTS (
        SELECT 1 FROM backup_metadata
        WHERE id = backup_id AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Invalid backup ID or backup not completed';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity(
    backup_id UUID
) RETURNS boolean AS $$
BEGIN
    -- This is a placeholder for actual integrity verification logic
    -- In production, this would perform checksum verification and
    -- other integrity checks
    
    RETURN EXISTS (
        SELECT 1 FROM backup_metadata
        WHERE id = backup_id AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old backups
CREATE OR REPLACE FUNCTION cleanup_old_backups(
    cutoff_date TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
    -- Log cleanup initiation
    INSERT INTO backup_events (event, details)
    VALUES (
        'cleanup_started',
        jsonb_build_object('cutoff_date', cutoff_date)
    );
    
    -- Delete old backups
    DELETE FROM backup_metadata
    WHERE created_at < cutoff_date
    AND status = 'completed';
    
    -- Log cleanup completion
    INSERT INTO backup_events (event, details)
    VALUES (
        'cleanup_completed',
        jsonb_build_object('cutoff_date', cutoff_date)
    );
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access backup metadata
CREATE POLICY "Admins can read backup metadata"
    ON backup_metadata FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins can insert backup metadata"
    ON backup_metadata FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins can update backup metadata"
    ON backup_metadata FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Only admins can access backup events
CREATE POLICY "Admins can read backup events"
    ON backup_events FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins can insert backup events"
    ON backup_events FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')); 