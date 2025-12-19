import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserRoleState {
  isDoctor: boolean;
  isPatient: boolean;
  isAdmin: boolean;
  loading: boolean;
  role: 'doctor' | 'patient' | 'admin' | null;
}

export const useUserRole = (): UserRoleState => {
  const { user } = useAuth();
  const [state, setState] = useState<UserRoleState>({
    isDoctor: false,
    isPatient: false,
    isAdmin: false,
    loading: true,
    role: null,
  });

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setState({
          isDoctor: false,
          isPatient: false,
          isAdmin: false,
          loading: false,
          role: null,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setState({
            isDoctor: false,
            isPatient: true, // Default to patient if no role found
            isAdmin: false,
            loading: false,
            role: 'patient',
          });
          return;
        }

        const role = data?.role as 'doctor' | 'patient' | 'admin';
        setState({
          isDoctor: role === 'doctor',
          isPatient: role === 'patient',
          isAdmin: role === 'admin',
          loading: false,
          role,
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        setState({
          isDoctor: false,
          isPatient: true,
          isAdmin: false,
          loading: false,
          role: 'patient',
        });
      }
    };

    fetchRole();
  }, [user]);

  return state;
};
