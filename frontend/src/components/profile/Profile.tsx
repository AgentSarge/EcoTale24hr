import { useState, useRef } from 'react';
import { Container } from '../layout/Container';
import { useProfileStore } from '../../stores/profileStore';
import { useRecyclingStore } from '../../stores/recyclingStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RecyclingTable } from '../dashboard/RecyclingTable';

export const Profile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { profile, isLoading, error, updateProfile, uploadAvatar } = useProfileStore();
  const { recyclingData } = useRecyclingStore();
  const [formData, setFormData] = useState({
    username: profile?.username || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const getAchievementBadges = () => {
    const badges = [];
    const totalRecycled = profile?.total_recycled_kg || 0;

    if (totalRecycled >= 1000) badges.push('🏆 Master Recycler');
    if (totalRecycled >= 500) badges.push('🌟 Pro Recycler');
    if (totalRecycled >= 100) badges.push('🌱 Green Warrior');
    if (badges.length === 0) badges.push('🌍 Eco Starter');

    return badges;
  };

  if (error) {
    return (
      <Container>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error loading profile
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <button
                onClick={handleAvatarClick}
                className="relative group"
                aria-label="Change avatar"
              >
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}`}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">Change</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                  />
                  <div className="flex space-x-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.username}
                    </h1>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {getAchievementBadges().map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Recycled
            </h3>
            <p className="mt-2 text-3xl font-bold text-primary-600 dark:text-primary-400">
              {profile?.total_recycled_kg.toFixed(1)} kg
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              CO2 Saved
            </h3>
            <p className="mt-2 text-3xl font-bold text-primary-600 dark:text-primary-400">
              {profile?.total_co2_saved_kg.toFixed(1)} kg
            </p>
          </div>
        </div>

        {/* Recycling History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recycling History
            </h2>
          </div>
          <RecyclingTable
            data={recyclingData}
            onExport={() => {
              // Implementation for exporting user's recycling data
              const headers = ['Date', 'Material Type', 'Weight (kg)', 'CO2 Saved (kg)'];
              const csvData = [
                headers.join(','),
                ...recyclingData.map(row => [
                  new Date(row.created_at).toLocaleDateString(),
                  row.material_type,
                  row.weight_kg.toFixed(2),
                  row.co2_saved_kg.toFixed(2)
                ].join(','))
              ].join('\n');

              const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', 'my-recycling-history.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        </div>
      </div>
    </Container>
  );
}; 