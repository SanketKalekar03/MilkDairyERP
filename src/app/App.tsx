import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './providers/AuthProvider';
import { ShiftProvider } from './providers/ShiftProvider';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ShiftProvider>
        <RouterProvider router={router} />
      </ShiftProvider>
    </AuthProvider>
  );
};

export default App;
