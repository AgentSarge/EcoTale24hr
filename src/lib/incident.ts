import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { monitoring } from './monitoring';

type IncidentType = 'security' | 'data' | 'performance' | 'system';

interface IncidentDetails {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  steps_to_reproduce?: string;
  resolution_steps?: string;
}

interface Incident {
  id: string;
  type: IncidentType;
  details: IncidentDetails;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

class IncidentService {
  private readonly tableName = 'incidents';

  async createIncident(type: IncidentType, details: IncidentDetails): Promise<string> {
    const incidentId = uuidv4();
    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from(this.tableName)
        .insert({
          id: incidentId,
          type,
          details,
          status: 'open',
          created_at: now,
          updated_at: now,
        });

      if (error) throw error;

      monitoring.setTag('incident_created', 'true');
      monitoring.setTag('incident_type', type);
      monitoring.setTag('incident_severity', details.severity);

      return incidentId;
    } catch (error) {
      monitoring.captureException(error as Error, {
        incidentType: type,
        severity: details.severity,
      });
      throw error;
    }
  }

  async getIncident(incidentId: string): Promise<Incident | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', incidentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      monitoring.captureException(error as Error, {
        incidentId,
      });
      return null;
    }
  }

  async updateIncident(
    incidentId: string,
    updates: Partial<IncidentDetails>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          details: updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      if (error) throw error;

      monitoring.setTag('incident_updated', 'true');
    } catch (error) {
      monitoring.captureException(error as Error, {
        incidentId,
      });
      throw error;
    }
  }

  async resolveIncident(
    incidentId: string,
    resolution: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from(this.tableName)
        .update({
          status: 'resolved',
          resolved_at: now,
          updated_at: now,
          'details.resolution': resolution,
        })
        .eq('id', incidentId);

      if (error) throw error;

      monitoring.setTag('incident_resolved', 'true');
    } catch (error) {
      monitoring.captureException(error as Error, {
        incidentId,
      });
      throw error;
    }
  }

  async listIncidents(
    status?: 'open' | 'in_progress' | 'resolved',
    type?: IncidentType
  ): Promise<Incident[]> {
    try {
      let query = supabase.from(this.tableName).select('*');

      if (status) {
        query = query.eq('status', status);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      monitoring.captureException(error as Error, {
        status: status || 'all',
        type: type || 'all',
      });
      return [];
    }
  }
}

export const incidentService = new IncidentService(); 