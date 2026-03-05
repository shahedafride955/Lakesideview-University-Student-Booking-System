import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
  hour: string;
  occupancy: number;
}

interface DailyChartData {
  day: string;
  occupancy: number;
}

interface ResourceBookingData {
  name: string;
  bookings: number;
}

export function PeakBookingTimes() {
  const [peakData, setPeakData] = useState<ChartData[]>([]);
  const [dailyData, setDailyData] = useState<DailyChartData[]>([]);
  const [topResourcesData, setTopResourcesData] = useState<ResourceBookingData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let allData: { recorded_at: string; occupancy_count: number }[] = [];
        let from = 0;
        const step = 1000;
        let fetchMore = true;

        while (fetchMore) {
          const { data, error } = await supabase
            .from('historical_usage')
            .select('recorded_at, occupancy_count')
            .order('recorded_at', { ascending: true })
            .range(from, from + step - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < step) fetchMore = false;
            else from += step;
          } else {
            fetchMore = false;
          }
        }

        if (allData.length > 0) {
          // Initialize hours from 0 AM to 12 AM (midnight)
          const startHour = 0;
          const endHour = 24;
          const initHourlyData = () => Array.from({ length: endHour - startHour }, (_, i) => ({
            hour: `${String(i + startHour).padStart(2, '0')}:00`,
            occupancy: 0,
          }));

          const total = initHourlyData();
          const uniqueDays = new Set<string>();

          allData.forEach((record) => {
            const date = new Date(record.recorded_at);
            uniqueDays.add(date.toDateString());
            const hour = date.getHours();

            if (hour >= startHour && hour <= endHour) {
              const index = hour - startHour;
              if (total[index]) {
                total[index].occupancy += record.occupancy_count;
              }
            }
          });

          // Process Hourly Data
          const daysCount = uniqueDays.size || 1;
          const averagedData = total.map(d => ({ ...d, occupancy: Math.round(d.occupancy / daysCount) }));
          setPeakData(averagedData);
          setTotalRecords(allData.length);
        }

        // Fetch Bookings Data for Daily Graph
        let allBookings: { start_time: string; resources: { name: string } | null }[] = [];
        from = 0;
        fetchMore = true;

        while (fetchMore) {
          const { data, error } = await supabase
            .from('bookings')
            .select('start_time, resources(name)')
            .order('start_time', { ascending: true })
            .range(from, from + step - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allBookings = [...allBookings, ...data];
            if (data.length < step) fetchMore = false;
            else from += step;
          } else {
            fetchMore = false;
          }
        }

        if (allBookings.length > 0) {
          const uniqueBookingDays = new Set<string>();
          const dailyBookingTotals = new Array(7).fill(0);
          const resourceCounts: Record<string, number> = {};

          allBookings.forEach((booking) => {
            const date = new Date(booking.start_time);
            uniqueBookingDays.add(date.toDateString());
            dailyBookingTotals[date.getDay()]++;

            const resourceName = booking.resources?.name || 'Unknown Resource';
            resourceCounts[resourceName] = (resourceCounts[resourceName] || 0) + 1;
          });

          const dayCounts = new Array(7).fill(0);
          uniqueBookingDays.forEach(dateStr => {
            const dayIndex = new Date(dateStr).getDay();
            dayCounts[dayIndex]++;
          });

          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dailyChartData = daysOfWeek.map((day, index) => ({
            day,
            occupancy: dayCounts[index] > 0 ? Math.round(dailyBookingTotals[index] / dayCounts[index]) : 0
          }));

          // Reorder to start with Monday
          const orderedDailyData = [...dailyChartData.slice(1), dailyChartData[0]];
          setDailyData(orderedDailyData);

          const sortedResources = Object.entries(resourceCounts)
            .map(([name, count]) => ({ name, bookings: count }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

          setTopResourcesData(sortedResources);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching booking data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading peak booking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Peak Booking Insights</h1>
        <p className="text-gray-600">
          Analyze average occupancy across different times of the day.
          {totalRecords > 0 && <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded-full">Based on {totalRecords.toLocaleString()} records</span>}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Occupancy by Hour</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={peakData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="hour" stroke="#6B7280" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -45 }} interval={0} fontSize={12} angle={-45} textAnchor="end" />
              <YAxis allowDecimals={false} stroke="#6B7280" label={{ value: 'Avg. Occupancy', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="occupancy" stroke="#3B82F6" strokeWidth={2} name="Average Occupancy" dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Bookings by Day</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={dailyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#6B7280" label={{ value: 'Avg. Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="occupancy" fill="#10B981" name="Average Bookings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Most Booked Resources</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={topResourcesData}
              margin={{
                top: 5,
                right: 30,
                left: 40,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" fontSize={12} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="bookings" fill="#8B5CF6" name="Total Bookings" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}