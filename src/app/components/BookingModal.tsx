import { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { Resource } from '@/hooks/useResources';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/app/context/AuthContext';

interface BookingModalProps {
  resource: Resource;
  onClose: () => void;
  onBook: () => void;
}

export function BookingModal({ resource, onClose, onBook }: BookingModalProps) {
  const { user } = useAuth();
  const { createBooking, loading } = useBookings();

  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(`${String(now.getHours()).padStart(2, '0')}:00`);
  const [endTime, setEndTime] = useState(`${String(now.getHours() + 1).padStart(2, '0')}:00`);
  const [attendees, setAttendees] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to book a resource.');
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time.');
      return;
    }

    const result = await createBooking(resource.id, user.id, startDateTime, endDateTime, attendees);

    if (result.success) {
      onBook();
      onClose();
    } else {
      setError(result.error || 'An unknown error occurred.');
    }
  };

  const handleAttendeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    if (value > resource.capacity) {
      value = resource.capacity;
    }
    setAttendees(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Book {resource.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
              <input
                type="number"
                id="attendees"
                value={attendees}
                onChange={handleAttendeesChange}
                min="1"
                max={resource.capacity}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Max capacity: {resource.capacity}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
              {loading ? 'Processing...' : `Book for ${attendees} ${attendees > 1 ? 'people' : 'person'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}