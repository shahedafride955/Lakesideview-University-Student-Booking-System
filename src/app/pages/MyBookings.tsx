import { Calendar, Clock, MapPin, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useBookings, Booking } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

export function MyBookings() {
  const { user } = useAuth();
  const { bookings, loading, cancelBooking } = useBookings(user?.id);

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        toast.success('Booking cancelled successfully');
      } else {
        toast.error(result.error || 'Failed to cancel booking');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    b => b.status === 'confirmed' && b.startTime > new Date()
  );
  
  const pastBookings = bookings.filter(
    b => b.status === 'confirmed' && b.endTime < new Date()
  );
  
  const activeBookings = bookings.filter(
    b => b.status === 'confirmed' && b.startTime <= new Date() && b.endTime >= new Date()
  );
  
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    const config = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock }
    };

    const style = config[status as keyof typeof config];
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const BookingCard = ({ booking, showCancel = true }: { booking: Booking, showCancel?: boolean }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{booking.resourceName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Check resource page for location</span>
          </div>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{format(booking.startTime, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>
            {format(booking.startTime, 'h:mm a')} - {format(booking.endTime, 'h:mm a')}
          </span>
        </div>
      </div>

      {showCancel && booking.status === 'confirmed' && booking.startTime > new Date() && (
        <button
          onClick={() => handleCancelBooking(booking.id)}
          className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel Booking
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">
          Manage your resource reservations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Now</p>
              <p className="text-3xl font-bold text-blue-600">{activeBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-green-600">{upcomingBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-3xl font-bold text-purple-600">{bookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} showCancel={false} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Bookings</h2>
        {upcomingBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No upcoming bookings</p>
            <p className="text-sm text-gray-500">Visit the dashboard to book a resource</p>
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Bookings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} showCancel={false} />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Bookings */}
      {cancelledBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancelled</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cancelledBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} showCancel={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}