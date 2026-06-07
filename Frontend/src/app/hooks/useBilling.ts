import { useApp } from '../context/AppContext';
import { useUserBills } from './useUserData';

export function useBilling() {
  const { bills, tariffs } = useApp();
  const userBills = useUserBills();
  return { bills, userBills, tariffs };
}

