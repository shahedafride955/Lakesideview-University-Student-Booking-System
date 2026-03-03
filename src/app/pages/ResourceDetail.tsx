import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Users, Calendar as CalendarIcon, TrendingUp, Loader2 } from 'lucide-react';
import { useResource } from '@/hooks/useResources';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useBookings } from '@/hooks/useBookings';
import { BookingModal } from '@/app/components/BookingModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/app/context/AuthContext';

export function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  const { resource, loading: loadingResource, refetch } = useResource(id || '');
  const { data: historicalData, loading: loadingHistory } = useHistoricalData(id);
  const { bookings, loading: loadingBookings } = useBookings(undefined, id);

  if (loadingResource || loadingBookings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading resource details...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Resource not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const occupancyPercentage = Math.round((resource.currentOccupancy / resource.capacity) * 100);

  const resourceHourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8;
    const hourData = historicalData.filter(d => d.hour === hour && d.resourceId === resource.id);
    const avgOccupancy = hourData.length > 0 
      ? hourData.reduce((sum, d) => sum + d.occupancy, 0) / hourData.length 
      : 0;
    return {
      hour: hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
      occupancy: Math.round(avgOccupancy),
      capacity: resource.capacity
    };
  });

  const handleBook = async () => {
    // Refresh the resource data to show updated occupancy immediately
    await refetch();
  };

  const statusColor = occupancyPercentage === 100 
    ? 'bg-red-500' 
    : occupancyPercentage >= 70 
    ? 'bg-yellow-500' 
    : 'bg-green-500';

  const statusText = occupancyPercentage === 100 
    ? 'Full' 
    : occupancyPercentage >= 70 
    ? 'Busy' 
    : 'Available';

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="relative h-80">
              <img
                src={resource.imageUrl}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`}></div>
                  <span className="font-medium text-gray-900">{statusText}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.name}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin className="w-5 h-5" />
                <span>{resource.building} · {resource.floor}</span>
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Current Occupancy
                  </span>
                  <span className="font-semibold text-gray-900">
                    {resource.currentOccupancy} / {resource.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${statusColor}`}
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {occupancyPercentage}% capacity · Updated in real-time
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {resource.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Usage Patterns */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Usage Pattern</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resourceHourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" stroke="#6B7280" label={{ value: 'Time of Day', position: 'insideBottom', offset: -10 }} />
                <YAxis stroke="#6B7280" label={{ value: 'Occupancy', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Bar dataKey="occupancy" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="capacity" fill="#E5E7EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4">
              Average occupancy by hour over the past week (blue) compared to capacity (gray).
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-3 flex items-center justify-center gap-2"
            >
              <CalendarIcon className="w-5 h-5" />
              Book This Resource
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              View Analytics
            </button>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Arrive 5-10 minutes before your booking</li>
              <li>• Check availability updates in real-time</li>
              <li>• Cancel bookings you won't use</li>
              <li>• Consider off-peak hours for longer sessions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          resource={resource}
          onClose={() => setShowBookingModal(false)}
          onBook={handleBook}
        />
      )}
    </div>
  );
}