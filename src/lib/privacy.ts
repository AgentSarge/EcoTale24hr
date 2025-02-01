import { monitoring } from './monitoring';
import { supabase } from './supabase';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  necessary: boolean;
}

interface DataRetentionPolicy {
  userProfile: number; // days
  activityLogs: number;
  analytics: number;
  backups: number;
}

export class PrivacyManager {
  private static instance: PrivacyManager;
  private readonly retentionPolicy: DataRetentionPolicy = {
    userProfile: 90, // 90 days after account deletion
    activityLogs: 30,
    analytics: 14,
    backups: 30,
  };

  private constructor() {}

  public static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  public async getUserConsent(userId: string): Promise<ConsentPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return data as ConsentPreferences;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PrivacyManager.getUserConsent',
      });
      return {
        analytics: false,
        marketing: false,
        thirdParty: false,
        necessary: true,
      };
    }
  }

  public async updateUserConsent(
    userId: string,
    preferences: Partial<ConsentPreferences>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_consent')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      monitoring.setTag('user_consent_updated', 'true');
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PrivacyManager.updateUserConsent',
      });
      throw error;
    }
  }

  public async requestDataDeletion(userId: string): Promise<void> {
    try {
      // Start deletion process
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          status: 'pending',
          requested_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Schedule data deletion according to retention policy
      await this.scheduleDataDeletion(userId);

      monitoring.setTag('data_deletion_requested', 'true');
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PrivacyManager.requestDataDeletion',
      });
      throw error;
    }
  }

  private async scheduleDataDeletion(userId: string): Promise<void> {
    try {
      // Schedule deletion of different data types according to retention policy
      const deletionTasks = [
        {
          table: 'user_profiles',
          days: this.retentionPolicy.userProfile,
        },
        {
          table: 'activity_logs',
          days: this.retentionPolicy.activityLogs,
        },
        {
          table: 'analytics_data',
          days: this.retentionPolicy.analytics,
        },
      ];

      for (const task of deletionTasks) {
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + task.days);

        await supabase.from('scheduled_deletions').insert({
          user_id: userId,
          table_name: task.table,
          scheduled_for: deletionDate.toISOString(),
          status: 'scheduled',
        });
      }
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PrivacyManager.scheduleDataDeletion',
      });
      throw error;
    }
  }

  public async exportUserData(userId: string): Promise<object> {
    try {
      // Collect all user data from various tables
      const [
        profileData,
        activityData,
        consentData,
        recyclingData,
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', userId),
        supabase.from('activity_logs').select('*').eq('user_id', userId),
        supabase.from('user_consent').select('*').eq('user_id', userId),
        supabase.from('recycling_records').select('*').eq('user_id', userId),
      ]);

      const userData = {
        profile: this.sanitizeData(profileData.data?.[0]),
        activities: this.sanitizeData(activityData.data),
        consent: consentData.data?.[0],
        recycling: this.sanitizeData(recyclingData.data),
        exportDate: new Date().toISOString(),
      };

      monitoring.setTag('data_export_completed', 'true');
      return userData;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PrivacyManager.exportUserData',
      });
      throw error;
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return null;

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'password_hash',
      'secret',
      'token',
      'api_key',
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          delete sanitized[field];
        }
      });
      return sanitized;
    }

    return data;
  }

  public async updateDataRetentionPolicy(
    newPolicy: Partial<DataRetentionPolicy>
  ): Promise<void> {
    try {
      // Update retention policy in database
      const { error } = await supabase
        .from('data_retention_policies')
        .update(newPolicy)
        .eq('id', 1);

      if (error) throw error;

      // Update local policy
      Object.assign(this.retentionPolicy, newPolicy);

      monitoring.setTag('retention_policy_updated', 'true');
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PrivacyManager.updateDataRetentionPolicy',
      });
      throw error;
    }
  }
}

export const privacyManager = PrivacyManager.getInstance(); 