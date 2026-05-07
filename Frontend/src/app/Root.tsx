import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './context/AppContext';
import { queryClient } from './lib/queryClient';

export function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Outlet />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', fontSize: '14px' },
          }}
          richColors
        />
      </AppProvider>
    </QueryClientProvider>
  );
}

