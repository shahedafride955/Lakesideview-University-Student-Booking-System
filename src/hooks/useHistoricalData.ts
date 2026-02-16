import { useState, useEffect } from 'react';
import { supabase, DbHistoricalUsage } from '@/lib/supabase';

export interface UsageData {
  date: string;
  hour: number;
  resourceId: string;
  occupancy: number;
}

export function useHistoricalData(resourceId?: string) {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [resourceId]);

  async function fetchHistoricalData() {
    try {
      setLoading(true);

      let query = supabase
        .from('historical_usage')
        .select('*')
        .order('recorded_at', { ascending: true });

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data: usageData, error: usageError } = await query;

      if (usageError) throw usageError;

      // Transform data to match the UsageData interface
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const mappedData: UsageData[] = (usageData || []).map((record: DbHistoricalUsage) => {
        const recordDate = new Date(record.recorded_at);
        return {
          date: daysOfWeek[recordDate.getDay()],
          hour: recordDate.getHours(),
          resourceId: record.resource_id,
          occupancy: record.occupancy_count
        };
      });

      setData(mappedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, refetch: fetchHistoricalData };
}

// Helper to get peak hours for a resource
export function getPeakHours(historicalData: UsageData[], resourceId: string): number[] {
  const resourceData = historicalData.filter(d => d.resourceId === resourceId);
  const hourlyAverage: { [hour: number]: { total: number; count: number } } = {};

  resourceData.forEach(d => {
    if (!hourlyAverage[d.hour]) {
      hourlyAverage[d.hour] = { total: 0, count: 0 };
    }
    hourlyAverage[d.hour].total += d.occupancy;
    hourlyAverage[d.hour].count += 1;
  });

  const averages = Object.entries(hourlyAverage).map(([hour, { total, count }]) => ({
    hour: Number(hour),
    average: total / count
  }));

  return averages
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map(item => item.hour);
}
