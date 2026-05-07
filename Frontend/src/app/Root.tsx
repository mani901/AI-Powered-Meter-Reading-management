import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';

export function Root() {
  return (
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
  );
}

