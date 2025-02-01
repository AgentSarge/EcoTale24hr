import { monitoring } from './monitoring';
import { supabase } from './supabase';

interface IncidentDetails {
  type: 'security' | 'system' | 'data' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedComponents: string[];
  affectedUsers?: string[];
}

interface IncidentUpdate {
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  message: string;
  updatedBy: string;
}

export class IncidentManager {
  private static instance: IncidentManager;

  private constructor() {}

  public static getInstance(): IncidentManager {
    if (!IncidentManager.instance) {
      IncidentManager.instance = new IncidentManager();
    }
    return IncidentManager.instance;
  }

  public async reportIncident(details: IncidentDetails): Promise<string> {
    try {
      const incidentId = crypto.randomUUID();

      // Create incident record
      const { error } = await supabase
        .from('incidents')
        .insert({
          id: incidentId,
          ...details,
          status: 'investigating',
          reported_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Log to monitoring service
      monitoring.captureException(new Error(details.title), {
        context: 'IncidentManager.reportIncident',
        level: details.severity,
        tags: {
          incident_id: incidentId,
          incident_type: details.type,
        },
      });

      // Notify relevant parties based on severity
      await this.notifyIncident(incidentId, details);

      return incidentId;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.reportIncident',
      });
      throw error;
    }
  }

  private async notifyIncident(
    incidentId: string,
    details: IncidentDetails
  ): Promise<void> {
    try {
      const { data: config } = await supabase
        .from('notification_config')
        .select('*')
        .single();

      if (details.severity === 'critical' || details.severity === 'high') {
        // Send immediate notifications
        await this.sendNotifications(incidentId, details, config.emergency_contacts);
      }

      // Log notification
      await supabase.from('incident_notifications').insert({
        incident_id: incidentId,
        notification_type: 'initial',
        recipients: config.emergency_contacts,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.notifyIncident',
      });
    }
  }

  private async sendNotifications(
    incidentId: string,
    details: IncidentDetails,
    recipients: string[]
  ): Promise<void> {
    try {
      // Send to monitoring service
      monitoring.setTag('incident_notification_sent', incidentId);

      // In production, implement actual notification sending logic here
      // This could include email, SMS, Slack notifications, etc.
      console.log('Sending notifications for incident:', incidentId);
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.sendNotifications',
      });
    }
  }

  public async updateIncident(
    incidentId: string,
    update: IncidentUpdate
  ): Promise<void> {
    try {
      // Update incident status
      const { error: updateError } = await supabase
        .from('incidents')
        .update({
          status: update.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      if (updateError) throw updateError;

      // Log update
      const { error: logError } = await supabase
        .from('incident_updates')
        .insert({
          incident_id: incidentId,
          status: update.status,
          message: update.message,
          updated_by: update.updatedBy,
        });

      if (logError) throw logError;

      // If incident is resolved, perform post-incident tasks
      if (update.status === 'resolved') {
        await this.handleIncidentResolution(incidentId);
      }

      monitoring.setTag('incident_updated', incidentId);
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.updateIncident',
      });
      throw error;
    }
  }

  private async handleIncidentResolution(incidentId: string): Promise<void> {
    try {
      // Get incident details
      const { data: incident, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (error) throw error;

      // Generate incident report
      const report = await this.generateIncidentReport(incidentId);

      // Store report
      const { error: reportError } = await supabase
        .from('incident_reports')
        .insert({
          incident_id: incidentId,
          report,
          generated_at: new Date().toISOString(),
        });

      if (reportError) throw reportError;

      // Notify stakeholders of resolution
      await this.sendNotifications(
        incidentId,
        incident,
        incident.notification_recipients
      );

      monitoring.setTag('incident_resolved', incidentId);
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.handleIncidentResolution',
      });
    }
  }

  private async generateIncidentReport(incidentId: string): Promise<object> {
    try {
      // Gather all incident-related data
      const [
        incident,
        updates,
        notifications,
      ] = await Promise.all([
        supabase.from('incidents').select('*').eq('id', incidentId).single(),
        supabase.from('incident_updates').select('*').eq('incident_id', incidentId),
        supabase.from('incident_notifications').select('*').eq('incident_id', incidentId),
      ]);

      // Calculate incident metrics
      const timeToResolution = this.calculateTimeToResolution(
        incident.data.reported_at,
        incident.data.resolved_at
      );

      return {
        incident: incident.data,
        timeline: updates.data,
        notifications: notifications.data,
        metrics: {
          timeToResolution,
          updateCount: updates.data?.length || 0,
          notificationCount: notifications.data?.length || 0,
        },
        recommendations: this.generateRecommendations(incident.data),
      };
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.generateIncidentReport',
      });
      throw error;
    }
  }

  private calculateTimeToResolution(
    startDate: string,
    endDate: string
  ): number {
    return Math.floor(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 1000 / 60
    );
  }

  private generateRecommendations(incident: any): string[] {
    // Implement recommendation logic based on incident type and details
    const recommendations: string[] = [];

    if (incident.type === 'security') {
      recommendations.push(
        'Review security logs for suspicious activity',
        'Update security policies and procedures',
        'Conduct security training for affected teams'
      );
    } else if (incident.type === 'system') {
      recommendations.push(
        'Review system monitoring thresholds',
        'Update disaster recovery procedures',
        'Implement additional redundancy measures'
      );
    }

    return recommendations;
  }

  public async getActiveIncidents(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .not('status', 'eq', 'resolved')
        .order('reported_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.getActiveIncidents',
      });
      throw error;
    }
  }

  public async getIncidentTimeline(incidentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('incident_updates')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'IncidentManager.getIncidentTimeline',
      });
      throw error;
    }
  }
}

export const incidentManager = IncidentManager.getInstance(); 