import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: []
  });

  const isAdmin = user?.role === 'admin' || user?.custom_role === 'admin';
  const userRole = roles.find(r => r.name === user?.custom_role);
  
  const permissions = user?.role === 'admin' ? {} : (userRole?.permissions || {});

  const can = (category, action) => {
    if (isAdmin) return true;
    return permissions[category]?.[action] === true;
  };

  return {
    user,
    isAdmin,
    permissions,
    can
  };
}