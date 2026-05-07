import { useApp } from '../context/AppContext';

export function useAnalytics() {
  const { readings, bills, meters } = useApp();
  return { readings, bills, meters };
}

