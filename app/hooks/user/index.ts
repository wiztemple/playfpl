import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useUserProfile = () => {
    return useQuery({
        queryKey: ['userProfile'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                throw new Error('Not authenticated');
            }
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
            if (error) throw error;
            return data;
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileData: { fpl_team_id: number; fpl_team_name: string }) => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                throw new Error('Not authenticated');
            }
            
            const { data, error } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('id', session.user.id)
                .select()
                .single();
                
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            toast.success('Profile updated successfully!');
            return data;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update profile');
            throw error;
        }
    });
};

// Update other hooks similarly