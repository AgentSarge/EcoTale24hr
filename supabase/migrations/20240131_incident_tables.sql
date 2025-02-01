-- Create enums for incident management
CREATE TYPE incident_type AS ENUM ('security', 'system', 'data', 'performance');
CREATE TYPE incident_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE incident_status AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');

-- Create incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    type incident_type NOT NULL,
    severity incident_severity NOT NULL,
    status incident_status NOT NULL DEFAULT 'investigating',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_components TEXT[] NOT NULL,
    affected_users TEXT[],
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    reported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incident updates table
CREATE TABLE incident_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    status incident_status NOT NULL,
    message TEXT NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incident notifications table
CREATE TABLE incident_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    recipients TEXT[] NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incident reports table
CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    report JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification configuration table
CREATE TABLE notification_config (
    id SERIAL PRIMARY KEY,
    emergency_contacts TEXT[] NOT NULL,
    notification_channels TEXT[] NOT NULL,
    severity_thresholds JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default notification configuration
INSERT INTO notification_config (emergency_contacts, notification_channels, severity_thresholds)
VALUES (
    ARRAY['admin@ecotale.app'],
    ARRAY['email', 'slack'],
    '{
        "critical": ["email", "slack", "sms"],
        "high": ["email", "slack"],
        "medium": ["email"],
        "low": ["email"]
    }'::jsonb
);

-- Create RLS policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;

-- Incidents policies
CREATE POLICY "Anyone can view incidents"
    ON incidents FOR SELECT
    USING (true);

CREATE POLICY "Only admins can create incidents"
    ON incidents FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Only admins can update incidents"
    ON incidents FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Incident updates policies
CREATE POLICY "Anyone can view incident updates"
    ON incident_updates FOR SELECT
    USING (true);

CREATE POLICY "Only admins can create incident updates"
    ON incident_updates FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Incident notifications policies
CREATE POLICY "Only admins can view notifications"
    ON incident_notifications FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Only admins can create notifications"
    ON incident_notifications FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Incident reports policies
CREATE POLICY "Only admins can view reports"
    ON incident_reports FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Only admins can create reports"
    ON incident_reports FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Notification config policies
CREATE POLICY "Only admins can view notification config"
    ON notification_config FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Only admins can update notification config"
    ON notification_config FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Create functions for incident management
CREATE OR REPLACE FUNCTION notify_incident()
RETURNS TRIGGER AS $$
BEGIN
    -- This function would integrate with your notification system
    -- For now, it just logs the incident
    INSERT INTO incident_notifications (
        incident_id,
        notification_type,
        recipients,
        sent_at
    )
    SELECT
        NEW.id,
        CASE
            WHEN NEW.severity = 'critical' THEN 'emergency'
            WHEN NEW.severity = 'high' THEN 'urgent'
            ELSE 'standard'
        END,
        (SELECT emergency_contacts FROM notification_config LIMIT 1),
        NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incident notifications
CREATE TRIGGER trigger_incident_notification
    AFTER INSERT ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION notify_incident();

-- Create function to calculate incident metrics
CREATE OR REPLACE FUNCTION calculate_incident_metrics(incident_id UUID)
RETURNS jsonb AS $$
DECLARE
    incident_data incidents%ROWTYPE;
    update_count INTEGER;
    time_to_resolution INTEGER;
BEGIN
    SELECT * INTO incident_data
    FROM incidents
    WHERE id = incident_id;

    SELECT COUNT(*) INTO update_count
    FROM incident_updates
    WHERE incident_id = incident_id;

    SELECT 
        EXTRACT(EPOCH FROM (resolved_at - reported_at))/60 INTO time_to_resolution
    FROM incidents
    WHERE id = incident_id AND resolved_at IS NOT NULL;

    RETURN jsonb_build_object(
        'time_to_resolution', time_to_resolution,
        'update_count', update_count,
        'severity', incident_data.severity,
        'type', incident_data.type
    );
END;
 