import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginForm } from '../features/auth/components/LoginForm';
import { DashboardView } from '../features/dashboard/components/DashboardView';
import { FarmerList } from '../features/farmers/components/FarmerList';
import { CustomerList } from '../features/customers/components/CustomerList';
import { MilkCollectionForm } from '../features/milk-collection/components/MilkCollectionForm';
import { MilkCollectionHistory } from '../features/milk-collection/components/MilkCollectionHistory';
import { MilkSalesForm } from '../features/milk-sales/components/MilkSalesForm';
import { MilkSalesHistory } from '../features/milk-sales/components/MilkSalesHistory';
import { CollectionRateList } from '../features/collection-rates/components/CollectionRateList';
import { SellingRateList } from '../features/selling-rates/components/SellingRateList';
import { FarmerBillingView } from '../features/weekly-billing/components/FarmerBillingView';
import { CustomerBillingView } from '../features/weekly-billing/components/CustomerBillingView';
import { ShiftSettingsForm } from '../features/settings/components/ShiftSettingsForm';
import { UserManagementList } from '../features/users/components/UserManagementList';
import { useAuth } from '../features/auth/hooks/useAuth';
import { CardSkeleton } from '../components/skeletons/CardSkeleton';
import { isSupabaseConfigured } from '../lib/supabase';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4">
        <CardSkeleton className="w-full max-w-md" />
      </div>
    );
  }

  // If Supabase keys not set yet, allow viewing dashboard with config banner
  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4">
        <CardSkeleton className="w-full max-w-md" />
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (profile && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Only Route Guard (for /login)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4">
        <CardSkeleton className="w-full max-w-md" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginForm />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      {
        path: 'farmers',
        element: <FarmerList />,
      },
      {
        path: 'customers',
        element: <CustomerList />,
      },
      {
        path: 'collection',
        element: <MilkCollectionForm />,
      },
      {
        path: 'collection/history',
        element: <MilkCollectionHistory />,
      },
      {
        path: 'sales',
        element: <MilkSalesForm />,
      },
      {
        path: 'sales/history',
        element: <MilkSalesHistory />,
      },
      {
        path: 'billing/farmers',
        element: <FarmerBillingView />,
      },
      {
        path: 'billing/customers',
        element: <CustomerBillingView />,
      },
      // Admin Only Routes
      {
        path: 'rates/collection',
        element: (
          <AdminRoute>
            <CollectionRateList />
          </AdminRoute>
        ),
      },
      {
        path: 'rates/selling',
        element: (
          <AdminRoute>
            <SellingRateList />
          </AdminRoute>
        ),
      },
      {
        path: 'settings/shifts',
        element: (
          <AdminRoute>
            <ShiftSettingsForm />
          </AdminRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminRoute>
            <UserManagementList />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
