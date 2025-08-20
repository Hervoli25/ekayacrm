'use client';

import { useState, useEffect } from 'react';
import { getCRMApiHeaders } from '@/lib/crm-config';

interface CRMStats {
  todayBookings: number;
  weekRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  averageRating: number;
  activeWaitlist: number;
}

interface Booking {
  id: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  licensePlate: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  rating?: number;
  feedback?: string;
}

export function useCRMStats() {
  const [stats, setStats] = useState<CRMStats>({
    todayBookings: 0,
    weekRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    activeWaitlist: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/dashboard/stats', {
        headers: getCRMApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching CRM stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}

export function useCRMSearch() {
  const [results, setResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/crm/bookings/search?q=${encodeURIComponent(query)}`, {
        headers: getCRMApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.bookings || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching bookings:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}

export function useCRMBooking(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/bookings/${id}`, {
        headers: getCRMApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.statusText}`);
      }

      const data = await response.json();
      setBooking(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch booking');
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBooking(bookingId);
    }
  }, [bookingId]);

  return { booking, loading, error, refetch: () => bookingId && fetchBooking(bookingId) };
}

export function useCRMCapacity() {
  const [capacity, setCapacity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/capacity/today', {
        headers: getCRMApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch capacity: ${response.statusText}`);
      }

      const data = await response.json();
      setCapacity(data.slots || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch capacity');
      console.error('Error fetching capacity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacity();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCapacity, 30000);
    return () => clearInterval(interval);
  }, []);

  return { capacity, loading, error, refetch: fetchCapacity };
}