import { useApp } from '../context/AppContext';

export function useAdmin() {
  const { users, meters, readings, bills, tariffs, updateUserRole, updateUserStatus, updateTariff, addTariff, deleteTariff } = useApp();
  return {
    users,
    meters,
    readings,
    bills,
    tariffs,
    updateUserRole,
    updateUserStatus,
    updateTariff,
    addTariff,
    deleteTariff,
  };
}

