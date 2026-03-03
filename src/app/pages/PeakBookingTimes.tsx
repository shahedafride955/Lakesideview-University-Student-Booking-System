import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
  hour: string;
  bookings: number;
}

interface RoomChartData {
  name: string;
  bookings: number;
}

// Helper functions for resource types
const norm = (v?: string) => String(v || '').trim().toLowerCase();
const isStudyRoom = (t?: string) => ['study_room', 'study-room', 'study room'].includes(norm(t));
const isConferenceRoom = (t?: string) => ['conference_room', 'conference-room', 'conference room'].includes(norm(t));
const isComputerLab = (t?: string) => ['computer_lab', 'computer-lab', 'computer lab', 'lab'].includes(norm(t));

export function PeakBookingTimes() {
  const [peakData, setPeakData] = useState<ChartData[]>([]);
  const [studyData, setStudyData] = useState<RoomChartData[]>([]);
  const [conferenceData, setConferenceData] = useState<RoomChartData[]>([]);
  const [labData, setLabData] = useState<RoomChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select('start_time, resources(type, name)');

        if (error) {
          throw error;
        }

        if (data) {
          // Initialize hours from 8 AM to 12 AM (midnight)
          const startHour = 8;
          const endHour = 24;
          const initHourlyData = () => Array.from({ length: endHour - startHour }, (_, i) => ({
            hour: `${String(i + startHour).padStart(2, '0')}:00`,
            bookings: 0,
          }));

          const total = initHourlyData();
          const studyRoomCounts: { [key: string]: number } = {};
          const confRoomCounts: { [key: string]: number } = {};
          const labRoomCounts: { [key: string]: number } = {};

          data.forEach((booking: { start_time: string; resources: { type: string | null; name: string | null } | null }) => {
            const hour = new Date(booking.start_time).getUTCHours();
            const type = booking.resources?.type;
            const name = booking.resources?.name;

            // Filter for 8 AM to 12 AM
            if (hour >= startHour && hour < endHour) {
              const index = hour - startHour;
              if (total[index]) {
                total[index].bookings += 1;
              }

              if (!name) return;

              if (isStudyRoom(type)) {
                studyRoomCounts[name] = (studyRoomCounts[name] || 0) + 1;
              } else if (isConferenceRoom(type)) {
                confRoomCounts[name] = (confRoomCounts[name] || 0) + 1;
              } else if (isComputerLab(type)) {
                labRoomCounts[name] = (labRoomCounts[name] || 0) + 1;
              }
            }
          });

          const toRoomChartData = (counts: { [key: string]: number }) => {
            return Object.entries(counts)
              .map(([name, bookings]) => ({ name, bookings }))
              .sort((a, b) => b.bookings - a.bookings);
          };

          setPeakData(total);
          setStudyData(toRoomChartData(studyRoomCounts));
          setConferenceData(toRoomChartData(confRoomCounts));
          setLabData(toRoomChartData(labRoomCounts));
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching booking data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
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
          Analyze booking frequency across different times and types.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Hour</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={peakData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="hour" stroke="#6B7280" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -25 }} interval={0} fontSize={12} angle={-45} textAnchor="end" />
              <YAxis allowDecimals={false} stroke="#6B7280" label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="bookings" fill="#3B82F6" name="Number of Bookings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Rooms */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Rooms</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={studyData}
                margin={{ top: 5, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} label={{ value: 'Room Name', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#6B7280" fontSize={12} label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conference Rooms */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conference Rooms</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={conferenceData}
                margin={{ top: 5, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} label={{ value: 'Room Name', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#6B7280" fontSize={12} label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="bookings" fill="#10B981" name="Bookings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Computer Labs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Computer Labs</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={labData}
                margin={{ top: 5, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} label={{ value: 'Lab Name', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#6B7280" fontSize={12} label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="bookings" fill="#F59E0B" name="Bookings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}