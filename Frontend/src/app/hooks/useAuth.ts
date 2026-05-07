import { useApp } from '../context/AppContext';

export function useAuth() {
  const { currentUser, loadingAuth, login, logout } = useApp();
  return {
    user: currentUser,
    loadingAuth,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'ADMIN',
    login,
    logout,
  };
}

