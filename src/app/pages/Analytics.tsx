import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Calendar, Users, Loader2 } from 'lucide-react';
import { useResources, ResourceType } from '@/hooks/useResources';
import { useBookings } from '@/hooks/useBookings';
import { useHistoricalData } from '@/hooks/useHistoricalData';

export function Analytics() {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType | 'all'>('all');
  const { resources, loading: loadingResources } = useResources();
  const { bookings, loading: loadingBookings } = useBookings();
  const { data: historicalData, loading: loadingHistory } = useHistoricalData();

  if (loadingResources || loadingBookings || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics from real data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentBookings = bookings.filter(b => b.startTime >= sevenDaysAgo);

  // 1. Avg Weekly Utilization (based on historical data vs capacity)
  // Calculate total utilized person-hours in the last 7 days
  const totalUtilizedHours = recentBookings.reduce((sum, b) => {
    const duration = (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
    
    const resource = resources.find(r => r.id === b.resourceId);
    // Normalize type to handle Study_room vs study-room
    const type = resource?.type?.toLowerCase().replace(/_/g, '-').trim() || '';
    const isExclusive = ['study-room', 'meeting-room', 'equipment', 'study room', 'meeting room', 'conference-room', 'conference room'].includes(type);

    // For exclusive resources, a booking utilizes the full capacity
    if (resource && isExclusive) {
      return sum + (duration * resource.capacity);
    }
    
    return sum + duration;
  }, 0);

  // Estimate total capacity hours (Total Capacity * 14 operating hours * 7 days)
  const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
  const totalAvailableHours = totalCapacity * 14 * 7; // Assuming 14 hour days (8am-10pm)

  const avgWeeklyUtilization = totalAvailableHours > 0 
    ? ((totalUtilizedHours / totalAvailableHours) * 100).toFixed(1)
    : '0';

  // 2. Avg Session Duration
  const totalDurationHours = recentBookings.reduce((sum, b) => {
    const start = b.startTime.getTime();
    const end = b.endTime.getTime();
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);
  
  const avgSessionDuration = recentBookings.length > 0 
    ? (totalDurationHours / recentBookings.length).toFixed(1) 
    : '0';

  // 3. Active Students (unique users in recent bookings)
  const activeStudents = new Set(recentBookings.map(b => b.userId)).size;

  // Calculate average occupancy by day of week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = daysOfWeek.map(day => {
    const dayData = historicalData.filter(d => d.date === day);
    const avgOccupancy = dayData.length > 0 
      ? dayData.reduce((sum, d) => sum + d.occupancy, 0) / dayData.length 
      : 0;
    return {
      day,
      occupancy: Math.round(avgOccupancy),
    };
  });

  // Calculate hourly patterns
  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8; // 8 AM to 10 PM
    const hourData = historicalData.filter(d => d.hour === hour);
    const avgOccupancy = hourData.length > 0
      ? hourData.reduce((sum, d) => sum + d.occupancy, 0) / hourData.length
      : 0;
    return {
      hour: hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
      occupancy: Math.round(avgOccupancy),
    };
  });

  // Resource type distribution
  const typeDistribution: Record<string, number> = {
    'study_room': 0,
    'conference_room': 0,
    'computer_lab': 0
  };

  resources.forEach(r => {
    if (Object.prototype.hasOwnProperty.call(typeDistribution, r.type)) {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    }
  });

  const pieData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  // Most utilized resources
  const resourceHours: Record<string, number> = {};
  
  recentBookings.forEach(b => {
    const duration = (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
    resourceHours[b.resourceId] = (resourceHours[b.resourceId] || 0) + duration;
  });

  const utilizationData = resources
    .map(r => {
      const hours = resourceHours[r.id] || 0;
      // Calculate percentage based on 14-hour days over 7 days (98 hours total capacity)
      const utilization = Math.round((hours / (14 * 7)) * 100);
      return {
        name: r.name,
        utilization: Math.min(100, utilization)
      };
    })
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">
          Historical usage trends and capacity planning data
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgWeeklyUtilization}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Avg. Weekly Utilization</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgSessionDuration}h</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Avg. Session Duration</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{recentBookings.length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Bookings This Week</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Active Students</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Patterns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Usage Patterns</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Bar dataKey="occupancy" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Peak usage occurs mid-week (Tuesday-Thursday).
          </p>
        </div>

        {/* Hourly Patterns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage Patterns</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="hour" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="occupancy" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Two peak periods: 10-11 AM and 2-6 PM. Lowest usage before 9 AM and after 8 PM.
          </p>
        </div>

        {/* Resource Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Distribution of available resource types across campus facilities.
          </p>
        </div>

        {/* Top Utilized Resources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Utilized Resources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" />
              <YAxis dataKey="name" type="category" stroke="#6B7280" width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Bar dataKey="utilization" fill="#F59E0B" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Current utilization rates for the most popular resources on campus.
          </p>
        </div>
      </div>

      {/* Insights Panel 
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📊 Best Times to Visit</h4>
            <p className="text-sm text-gray-600">
              For guaranteed availability, plan your visits between 8-9 AM or after 7 PM on weekdays.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🎯 Popular Locations</h4>
            <p className="text-sm text-gray-600">
              Library West study rooms are in high demand. Consider alternatives in Library East or Tech Center.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">⏰ Peak Hours</h4>
            <p className="text-sm text-gray-600">
              Expect wait times during 2-6 PM. Book in advance or arrive early to secure your spot.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📅 Weekend Availability</h4>
            <p className="text-sm text-gray-600">
              Weekends offer 50% more availability. Perfect for longer study sessions without interruption.
            </p>
          </div>
        </div>
        
      </div>
       */}
    </div>
  );
}