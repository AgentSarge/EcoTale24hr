import { monitoring } from './monitoring';
import { supabase } from './supabase';

interface BackupConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionPeriod: number; // days
  encryptionEnabled: boolean;
}

interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'full' | 'incremental';
}

export class BackupManager {
  private static instance: BackupManager;
  private config: BackupConfig = {
    frequency: 'daily',
    retentionPeriod: 30,
    encryptionEnabled: true
  };

  private constructor() {}

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  public async initiateBackup(type: 'full' | 'incremental' = 'incremental'): Promise<void> {
    const backupId = crypto.randomUUID();
    
    try {
      // Log backup initiation
      await this.logBackupEvent(backupId, 'started', type);

      // Create backup metadata
      const { error: metadataError } = await supabase
        .from('backup_metadata')
        .insert({
          id: backupId,
          type,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        });

      if (metadataError) throw metadataError;

      // Trigger Supabase backup
      const { error: backupError } = await supabase.rpc('create_backup', {
        backup_id: backupId,
        backup_type: type,
      });

      if (backupError) throw backupError;

      // Update backup status
      await this.updateBackupStatus(backupId, 'completed');
      
      monitoring.setTag('backup_completed', backupId);
    } catch (error) {
      await this.updateBackupStatus(backupId, 'failed');
      monitoring.captureException(error as Error, {
        context: 'BackupManager.initiateBackup',
        backupId
      });
      throw error;
    }
  }

  public async restoreFromBackup(backupId: string): Promise<void> {
    try {
      // Verify backup exists and is valid
      const { data: backup, error: backupError } = await supabase
        .from('backup_metadata')
        .select('*')
        .eq('id', backupId)
        .single();

      if (backupError || !backup) throw new Error('Backup not found');
      if (backup.status !== 'completed') throw new Error('Backup is not in completed state');

      // Log restoration attempt
      await this.logBackupEvent(backupId, 'restore_started');

      // Trigger Supabase restoration
      const { error: restoreError } = await supabase.rpc('restore_backup', {
        backup_id: backupId,
      });

      if (restoreError) throw restoreError;

      monitoring.setTag('backup_restored', backupId);
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'BackupManager.restoreFromBackup',
        backupId
      });
      throw error;
    }
  }

  public async getBackupsList(): Promise<BackupMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('backup_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as BackupMetadata[];
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'BackupManager.getBackupsList'
      });
      throw error;
    }
  }

  public async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('verify_backup_integrity', {
        backup_id: backupId,
      });

      return !error;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'BackupManager.verifyBackupIntegrity',
        backupId
      });
      return false;
    }
  }

  private async updateBackupStatus(
    backupId: string,
    status: 'completed' | 'failed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('backup_metadata')
        .update({
          status,
          completed_at: new Date().toISOString(),
        })
        .eq('id', backupId);

      if (error) throw error;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'BackupManager.updateBackupStatus',
        backupId
      });
    }
  }

  private async logBackupEvent(
    backupId: string,
    event: string,
    type?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('backup_events')
        .insert({
          backup_id: backupId,
          event,
          type,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'BackupManager.logBackupEvent',
        backupId
      });
    }
  }

  public async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

      const { error } = await supabase.rpc('cleanup_old_backups', {
        cutoff_date: cutoffDate.toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'BackupManager.cleanupOldBackups'
      });
      throw error;
    }
  }
}

export const backupManager = BackupManager.getInstance(); 