import { createBrowserRouter } from 'react-router';
import { Layout } from '@/app/components/Layout';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { Dashboard } from '@/app/pages/Dashboard';
import { Analytics } from '@/app/pages/Analytics';
import { ResourceDetail } from '@/app/pages/ResourceDetail';
import { MyBookings } from '@/app/pages/MyBookings';
import { Login } from '@/app/pages/Login';
import { PeakBookingTimes } from '@/app/pages/PeakBookingTimes';

function Root() {
  return (
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
}

function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Analytics />
      </Layout>
    </ProtectedRoute>
  );
}

function ResourceDetailPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ResourceDetail />
      </Layout>
    </ProtectedRoute>
  );
}

function BookingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MyBookings />
      </Layout>
    </ProtectedRoute>
  );
}

function PeakTimesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <PeakBookingTimes />
      </Layout>
    </ProtectedRoute>
  );
}

function NotFound() {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Root,
  },
  {
    path: '/analytics',
    Component: AnalyticsPage,
  },
  {
    path: '/resource/:id',
    Component: ResourceDetailPage,
  },
  {
    path: '/bookings',
    Component: BookingsPage,
  },
  {
    path: '/peak-times',
    Component: PeakTimesPage,
  },
  {
    path: '*',
    Component: NotFound,
  },
]);