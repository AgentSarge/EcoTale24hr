import { supabase } from '../lib/supabase';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    auth: boolean;
    storage: boolean;
  };
  version: string;
  environment: string;
}

export const checkHealth = async (): Promise<HealthStatus> => {
  const services = {
    database: false,
    auth: false,
    storage: false,
  };

  try {
    // Check database
    const { data: dbCheck, error: dbError } = await supabase
      .from('health_checks')
      .select('id')
      .limit(1);
    services.database = !dbError && dbCheck !== null;

    // Check auth
    const { data: authCheck, error: authError } = await supabase.auth.getSession();
    services.auth = !authError && authCheck !== null;

    // Check storage
    const { data: storageCheck, error: storageError } = await supabase
      .storage
      .getBucket('avatars');
    services.storage = !storageError && storageCheck !== null;

    // Determine overall status
    const servicesUp = Object.values(services).filter(Boolean).length;
    const status = 
      servicesUp === 3 ? 'healthy' :
      servicesUp >= 2 ? 'degraded' :
      'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
    };
  }
}; 