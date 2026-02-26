import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export function useBookings(userId?: string, resourceId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel(`bookings-${userId || 'all'}-${resourceId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchBookings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, resourceId]);

  async function fetchBookings() {
    try {
      setLoading(true);

      let query = supabase
        .from('bookings')
        .select(
          `
          *,
          resources(name),
          users(name)
        `
        );

      if (userId) query = query.eq('user_id', userId);
      if (resourceId) query = query.eq('resource_id', resourceId);

      const { data, error: bookingsError } = await query;
      if (bookingsError) throw bookingsError;

      const mappedBookings: Booking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        resourceId: booking.resource_id,
        resourceName: booking.resources?.name || 'Unknown Resource',
        userId: booking.user_id,
        userName: booking.users?.name || 'Unknown User',
        startTime: new Date(booking.start_time),
        endTime: new Date(booking.end_time),
        // ✅ IMPORTANT FIX: normalize status so "Confirmed"/"CONFIRMED"/" confirmed " works
        status: String(booking.status || '').trim().toLowerCase() as 'confirmed' | 'pending' | 'cancelled'
      }));

      setBookings(mappedBookings);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }

  async function createBooking(
    resourceId: string,
    userId: string,
    startTime: Date,
    endTime: Date,
    attendees: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check resource availability
      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('capacity, type')
        .eq('id', resourceId)
        .single();

      if (resourceError || !resourceData) {
        return { success: false, error: 'Resource not found' };
      }

      // Check for overlapping bookings on same resource
      const { count: existingBookings, error: overlapError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('resource_id', resourceId)
        .eq('status', 'confirmed')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString());

      if (overlapError) throw overlapError;

      // MODIFIED: Check if USER has overlapping bookings on ANY OTHER resource
      const { count: userOverlaps, error: userOverlapError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .neq('resource_id', resourceId) // Allow multiple bookings for the same resource
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString());

      if (userOverlapError) throw userOverlapError;

      if ((userOverlaps || 0) > 0) {
        return { success: false, error: 'You already have a booking for a different resource during this time slot.' };
      }

      // Check if the new booking exceeds the total capacity
      if ((existingBookings || 0) + attendees > resourceData.capacity) {
        return {
          success: false,
          error: `Booking for ${attendees} person(s) would exceed resource capacity of ${resourceData.capacity}.`
        };
      }

      const { data: lastBooking } = await supabase
        .from('bookings')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      let lastNum = 0;
      if (lastBooking?.id) {
        const parsedNum = parseInt(String(lastBooking.id).split('-')[1], 10);
        if (!Number.isNaN(parsedNum)) {
          lastNum = parsedNum;
        }
      }

      // Create an array of new booking objects, one for each attendee
      const newBookings = Array.from({ length: attendees }, (_, i) => {
        const newId = `B-${String(lastNum + 1 + i).padStart(4, '0')}`;
        return {
          id: newId,
          resource_id: resourceId,
          user_id: userId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'confirmed'
        };
      });

      const { error: insertError } = await supabase.from('bookings').insert(newBookings);

      if (insertError) throw insertError;

      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('Error creating booking:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create booking'
      };
    }
  }

  async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to cancel booking'
      };
    }
  }

  return {
    bookings,
    loading,
    error,
    createBooking,
    cancelBooking,
    refetch: fetchBookings
  };
}