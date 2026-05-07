import { useApp } from '../context/AppContext';
import { useUserReadings } from './useUserData';

export function useReadings() {
  const { readings, addReading } = useApp();
  const userReadings = useUserReadings();
  return { readings, userReadings, addReading };
}

