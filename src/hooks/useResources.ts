import { useState, useEffect } from 'react';
import { supabase, DbResource, DbHistoricalUsage } from '@/lib/supabase';

export type ResourceType = 'study-room' | 'computer-lab' | 'conference-room';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  currentOccupancy: number;
  building: string;
  floor: string;
  features: string[];
  imageUrl: string;
}

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();

    // Subscribe to bookings changes to update occupancy in real-time
    const channel = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchResources()
      )
      .subscribe();

    // Refresh every minute to update time-based status (e.g. booking starts)
    const interval = setInterval(fetchResources, 60000);

    return () => {
      supabase.removeChannel(channel).catch(() => {});
      clearInterval(interval);
    };
  }, []);

  async function fetchResources() {
    try {
      setLoading(true);
      
      // Fetch resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true);

      if (resourcesError) throw resourcesError;

      // Fetch all active bookings once to avoid N+1 queries
      const now = new Date().toISOString();
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('resource_id')
        .eq('status', 'confirmed')
        .lte('start_time', now)
        .gt('end_time', now);

      // Calculate current occupancy from bookings only
      const resourcesWithOccupancy = (resourcesData || []).map((resource: DbResource) => {
          const bookingsCount = activeBookings?.filter(b => b.resource_id === resource.id).length || 0;
          let currentOccupancy = 0;

          const normalizedType = resource.type?.toLowerCase().trim() || '';
          const exclusiveTypes = ['study room', 'conference-room', 'conference room'];

          // If booked, mark as full for exclusive resources
          if (bookingsCount > 0 && exclusiveTypes.includes(normalizedType)) {
            currentOccupancy = resource.capacity;
          } else {
            currentOccupancy = bookingsCount;
          }

          // Parse features from string to array
          let features: string[] = [];
          try {
            const rawFeatures = resource.features as unknown;
            if (Array.isArray(rawFeatures)) {
              features = rawFeatures;
            } else if (typeof rawFeatures === 'string') {
              // Features are stored as "{Wifi, Whiteboard}" format
              features = rawFeatures
                .replace(/[{}]/g, '')
                .split(',')
                .map((f: string) => f.trim())
                .filter((f: string) => f.length > 0);
            }
          } catch {
            features = [];
          }

          return {
            id: resource.id,
            name: resource.name,
            type: resource.type as ResourceType,
            capacity: resource.capacity,
            currentOccupancy,
            building: resource.building,
            floor: resource.floor,
            features,
            imageUrl: resource.image_url
          };
        });

      setResources(resourcesWithOccupancy);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }

  return { resources, loading, error, refetch: fetchResources };
}

export function useResource(id: string) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResource();

    if (!id) return;

    // Subscribe to bookings changes for this resource
    const channel = supabase
      .channel(`resource-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `resource_id=eq.${id}`
        },
        () => fetchResource()
      )
      .subscribe();

    // Refresh every minute to update time-based status
    const interval = setInterval(fetchResource, 60000);

    return () => {
      supabase.removeChannel(channel).catch(() => {});
      clearInterval(interval);
    };
  }, [id]);

  async function fetchResource() {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (resourceError) throw resourceError;
      if (!resourceData) throw new Error('Resource not found');

      // Check for active bookings
      const now = new Date().toISOString();
      const { count: activeBookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('resource_id', id)
        .eq('status', 'confirmed')
        .lte('start_time', now)
        .gt('end_time', now);

      const bookingsCount = activeBookingsCount || 0;
      let currentOccupancy = 0;

      const normalizedType = resourceData.type?.toLowerCase().trim() || '';
      const exclusiveTypes = ['study-room', 'meeting-room', 'equipment', 'study room', 'meeting room', 'conference-room', 'conference room'];

      if (bookingsCount > 0 && exclusiveTypes.includes(normalizedType)) {
        currentOccupancy = resourceData.capacity;
      } else {
        currentOccupancy = bookingsCount;
      }

      // Parse features
      let features: string[] = [];
      try {
        const rawFeatures = resourceData.features as unknown;
        if (Array.isArray(rawFeatures)) {
          features = rawFeatures;
        } else if (typeof rawFeatures === 'string') {
          features = rawFeatures
            .replace(/[{}]/g, '')
            .split(',')
            .map((f: string) => f.trim())
            .filter((f: string) => f.length > 0);
        }
      } catch {
        features = [];
      }

      setResource({
        id: resourceData.id,
        name: resourceData.name,
        type: resourceData.type as ResourceType,
        capacity: resourceData.capacity,
        currentOccupancy,
        building: resourceData.building,
        floor: resourceData.floor,
        features,
        imageUrl: resourceData.image_url
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resource');
    } finally {
      setLoading(false);
    }
  }

  return { resource, loading, error, refetch: fetchResource };
}

export function useResourceSnapshot(snapshotTime: Date) {
  const [snapshot, setSnapshot] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!snapshotTime || isNaN(snapshotTime.getTime())) {
      setLoading(false);
      setSnapshot([]);
      return;
    }
    fetchSnapshotData();

    // Subscribe to bookings changes to update snapshot in real-time
    const channel = supabase
      .channel('snapshot-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchSnapshotData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [snapshotTime?.getTime()]);

  async function fetchSnapshotData() {
    try {
      setLoading(true);
      
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true);

      if (resourcesError) throw resourcesError;

      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('resource_id')
        .eq('status', 'confirmed')
        .lte('start_time', snapshotTime.toISOString())
        .gt('end_time', snapshotTime.toISOString());

      const resourcesWithOccupancy = (resourcesData || []).map((resource: DbResource) => {
          const bookingsCount = activeBookings?.filter(b => b.resource_id === resource.id).length || 0;

          let currentOccupancy = bookingsCount;
          const normalizedType = resource.type?.toLowerCase().trim() || '';
          const exclusiveTypes = ['study-room', 'meeting-room', 'equipment', 'study room', 'meeting room', 'conference-room', 'conference room'];

          if (bookingsCount > 0 && exclusiveTypes.includes(normalizedType)) {
            currentOccupancy = resource.capacity;
          }

          let features: string[] = [];
          try {
            const rawFeatures = resource.features as unknown;
            if (Array.isArray(rawFeatures)) {
              features = rawFeatures;
            } else if (typeof rawFeatures === 'string') {
              features = rawFeatures
                .replace(/[{}]/g, '')
                .split(',')
                .map((f: string) => f.trim())
                .filter((f: string) => f.length > 0);
            }
          } catch {
            features = [];
          }

          return {
            id: resource.id,
            name: resource.name,
            type: resource.type as ResourceType,
            capacity: resource.capacity,
            currentOccupancy,
            building: resource.building,
            floor: resource.floor,
            features,
            imageUrl: resource.image_url
          };
        });

      setSnapshot(resourcesWithOccupancy);
      setError(null);
    } catch (err) {
      console.error('Error fetching resource snapshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch snapshot');
    } finally {
      setLoading(false);
    }
  }

  return { snapshot, loading, error, refetch: fetchSnapshotData };
}
