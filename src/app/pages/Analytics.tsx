import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Calendar, Users, Loader2, Filter } from 'lucide-react';
import { useResourceSnapshot } from '@/hooks/useResources';

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatDateForInput = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const formatTimeForInput = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return `${pad2(local.getHours())}:${pad2(local.getMinutes())}`;
};
const buildLocalDateTime = (dateStr: string, timeStr: string) => new Date(`${dateStr}T${timeStr}`);

const norm = (v?: string) => String(v || '').trim().toLowerCase();
const isStudyRoom = (t?: string) => ['study_room', 'study-room', 'study room'].includes(norm(t));
const isConferenceRoom = (t?: string) => ['conference_room', 'conference-room', 'conference room'].includes(norm(t));
const isComputerLab = (t?: string) => ['computer_lab', 'computer-lab', 'computer lab', 'lab'].includes(norm(t));

const getUtilizationPercentage = (occupancy: number, capacity: number) => {
  if (!capacity) return 0;
  return Math.round((occupancy / capacity) * 100);
};

export function Analytics() {
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [selectedTime, setSelectedTime] = useState(formatTimeForInput(new Date()));

  const snapshotTime = useMemo(() => {
    return buildLocalDateTime(selectedDate, selectedTime);
  }, [selectedDate, selectedTime]);

  // ✅ uses your resource snapshot logic
  const { snapshot, loading, error } = useResourceSnapshot(snapshotTime);

  const metrics = useMemo(() => {
    const totalCapacity = snapshot.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupancy = snapshot.reduce((sum, r) => sum + (r.currentOccupancy || 0), 0);
    const avgUtilization = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0';

    const activeResources = snapshot.filter((r) => (r.currentOccupancy || 0) > 0).length;

    return {
      avgUtilization,
      totalCapacity,
      totalOccupancy,
      activeResources
    };
  }, [snapshot]);

  const charts = useMemo(() => {
    const toChart = (r: any) => ({
      name: r.name,
      occupancy: r.currentOccupancy || 0,
      capacity: r.capacity || 0,
      utilization: getUtilizationPercentage(r.currentOccupancy || 0, r.capacity || 0)
    });

    return {
      studyRooms: snapshot.filter((r) => isStudyRoom(r.type)).map(toChart).sort((a, b) => a.name.localeCompare(b.name)),
      conferenceRooms: snapshot.filter((r) => isConferenceRoom(r.type)).map(toChart).sort((a, b) => a.name.localeCompare(b.name)),
      computerLabs: snapshot.filter((r) => isComputerLab(r.type)).map(toChart).sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [snapshot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">Error loading analytics: {error}</p>
      </div>
    );
  }

  const tooltipFormatter = (value: number, name: string, props: any) => {
    if (name !== 'utilization') return [value, name];
    const occ = props?.payload?.occupancy ?? 0;
    const cap = props?.payload?.capacity ?? 0;
    return [`${occ}/${cap} (${value}%)`, 'Occupancy'];
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
          <p className="text-gray-600">Occupancy snapshot for the selected time</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </div>

          <div className="flex gap-2">
            <input
              id="selectedDate"
              type="date"
              aria-label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              id="selectedTime"
              type="time"
              aria-label="Time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="text-xs text-gray-500 sm:ml-auto">
            <span className="hidden sm:inline">Snapshot at: </span>
            <span className="font-medium">{snapshotTime.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgUtilization}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Overall Utilization</p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.totalOccupancy} / {metrics.totalCapacity} capacity
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeResources}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Active Resources</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{snapshot.length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Total Resources</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Room Occupancy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.studyRooms} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis domain={[0, 100]} unit="%" stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }} formatter={tooltipFormatter} />
              <Bar dataKey="utilization" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conference Room Occupancy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.conferenceRooms} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis domain={[0, 100]} unit="%" stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }} formatter={tooltipFormatter} />
              <Bar dataKey="utilization" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Computer Lab Occupancy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.computerLabs} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis domain={[0, 100]} unit="%" stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }} formatter={tooltipFormatter} />
              <Bar dataKey="utilization" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}