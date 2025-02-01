import { useState } from 'react';
import { Container } from '../layout/Container';
import { useProfileStore } from '../../stores/profileStore';
import { Profile } from '../../lib/supabase';

type SortField = 'total_recycled_kg' | 'total_co2_saved_kg';
type SortOrder = 'asc' | 'desc';

export const Leaderboard = () => {
  const [sortField, setSortField] = useState<SortField>('total_recycled_kg');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const { profiles, isLoading, error } = useProfileStore();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedProfiles = [...(profiles || [])].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return multiplier * (a[sortField] - b[sortField]);
  });

  const filteredProfiles = sortedProfiles.filter(profile =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAchievementBadge = (profile: Profile) => {
    if (profile.total_recycled_kg >= 1000) return '🏆 Master Recycler';
    if (profile.total_recycled_kg >= 500) return '🌟 Pro Recycler';
    if (profile.total_recycled_kg >= 100) return '🌱 Green Warrior';
    return '🌍 Eco Starter';
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500'; // Gold
      case 1: return 'text-gray-400';   // Silver
      case 2: return 'text-amber-600';  // Bronze
      default: return 'text-gray-600';
    }
  };

  if (error) {
    return (
      <Container>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error loading leaderboard
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recycling Leaderboard
          </h1>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('total_recycled_kg')}
                  >
                    Total Recycled
                    {sortField === 'total_recycled_kg' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('total_co2_saved_kg')}
                  >
                    CO2 Saved
                    {sortField === 'total_co2_saved_kg' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Achievement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="animate-pulse flex justify-center">
                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile, index) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${getRankColor(index)}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`}
                            alt={profile.username}
                            className="h-8 w-8 rounded-full"
                          />
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {profile.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {profile.total_recycled_kg.toFixed(1)} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {profile.total_co2_saved_kg.toFixed(1)} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          {getAchievementBadge(profile)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
}; 