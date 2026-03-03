import { useState } from 'react';
import { Search, Filter, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ResourceCard } from '@/app/components/ResourceCard';
import { useResources } from '@/hooks/useResources';

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { resources, loading, error } = useResources();

  const filteredResources = resources.filter((resource) => {
    return resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.building.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate stats
  const availableResources = resources.filter(r => r.currentOccupancy < r.capacity).length;
  const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupancy = resources.reduce((sum, r) => sum + r.currentOccupancy, 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">Error loading resources: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Dashboard</h1>
        <p className="text-gray-600">
          Real-time availability across campus · Updated just now
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Now</p>
              <p className="text-3xl font-bold text-green-600">{availableResources}</p>
              <p className="text-sm text-gray-500 mt-1">of {resources.length} resources</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Utilization</p>
              <p className="text-3xl font-bold text-blue-600">{overallUtilization}%</p>
              <p className="text-sm text-gray-500 mt-1">{totalOccupancy} / {totalCapacity} capacity</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Filter className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/peak-times')}
          className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="h-full">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-sm text-gray-600 mb-1">Peak Booking Times</p>
                <p className="text-3xl font-bold text-purple-600">View Report</p>
                <p className="text-sm text-gray-500 mt-1">See hourly booking trends</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No resources found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}