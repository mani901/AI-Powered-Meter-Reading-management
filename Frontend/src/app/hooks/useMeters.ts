import { useApp } from '../context/AppContext';
import { useUserMeters } from './useUserData';

export function useMeters() {
  const { meters, addMeter, updateMeter, deleteMeter } = useApp();
  const userMeters = useUserMeters();
  return { meters, userMeters, addMeter, updateMeter, deleteMeter };
}

