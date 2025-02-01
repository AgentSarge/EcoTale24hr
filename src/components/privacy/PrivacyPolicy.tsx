import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { privacyManager } from '@/lib/privacy';
import { monitoring } from '@/lib/monitoring';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  necessary: boolean;
}

export const PrivacyPolicy: React.FC = () => {
  const { user } = useAuth();
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences>({
    analytics: false,
    marketing: false,
    thirdParty: false,
    necessary: true,
  });
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserConsent();
    }
  }, [user?.id]);

  const loadUserConsent = async () => {
    try {
      const preferences = await privacyManager.getUserConsent(user!.id);
      setConsentPreferences(preferences);
    } catch (error) {
      monitoring.captureException(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (key: keyof ConsentPreferences) => {
    if (key === 'necessary') return; // Cannot change necessary consent

    try {
      const newPreferences = {
        ...consentPreferences,
        [key]: !consentPreferences[key],
      };

      await privacyManager.updateUserConsent(user!.id, {
        [key]: !consentPreferences[key],
      });

      setConsentPreferences(newPreferences);
    } catch (error) {
      monitoring.captureException(error as Error);
    }
  };

  const handleDataExport = async () => {
    setExportLoading(true);
    try {
      const userData = await privacyManager.exportUserData(user!.id);
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotale-data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      monitoring.captureException(error as Error);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleDataDeletion = async () => {
    if (window.confirm('Are you sure you want to request data deletion? This action cannot be undone.')) {
      try {
        await privacyManager.requestDataDeletion(user!.id);
        // Redirect to confirmation page or show success message
      } catch (error) {
        monitoring.captureException(error as Error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy & Data Management</h1>

      {/* Consent Management Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your Privacy Choices</h2>
        <div className="space-y-4">
          {Object.entries(consentPreferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium capitalize">{key}</h3>
                <p className="text-sm text-gray-600">
                  {key === 'necessary' 
                    ? 'Required for basic functionality'
                    : `Enable ${key} data collection and processing`}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleConsentChange(key as keyof ConsentPreferences)}
                  disabled={key === 'necessary'}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Data Management Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your Data</h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium">Export Your Data</h3>
            <p className="text-sm text-gray-600">
              Download a copy of your personal data
            </p>
          </button>
          <button
            onClick={handleDataDeletion}
            className="w-full p-4 text-left bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <h3 className="font-medium text-red-600">Request Data Deletion</h3>
            <p className="text-sm text-red-600">
              Request the deletion of your personal data
            </p>
          </button>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="prose max-w-none">
        <h2>Our Commitment to Your Privacy</h2>
        <p>
          EcoTale24hr is committed to protecting your privacy and ensuring you have control
          over your personal data. We process your data in accordance with the General Data
          Protection Regulation (GDPR) and other applicable privacy laws.
        </p>

        <h3>Data We Collect</h3>
        <ul>
          <li>Profile information you provide</li>
          <li>Recycling activity data</li>
          <li>Usage analytics (with your consent)</li>
          <li>Technical information necessary for the service</li>
        </ul>

        <h3>Your Rights</h3>
        <ul>
          <li>Right to access your data</li>
          <li>Right to rectification</li>
          <li>Right to erasure</li>
          <li>Right to data portability</li>
          <li>Right to withdraw consent</li>
        </ul>

        <h3>Data Retention</h3>
        <p>
          We retain your data for as long as necessary to provide our services and comply
          with legal obligations. You can request data deletion at any time.
        </p>
      </section>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Export Your Data</h3>
            <p className="mb-6">
              This will download all your personal data in JSON format. The process may take
              a few moments.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={exportLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDataExport}
                disabled={exportLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 