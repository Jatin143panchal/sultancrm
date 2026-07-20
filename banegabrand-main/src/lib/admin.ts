// src/lib/admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const createNewUser = async (userData: {
  email: string;
  password: string;
  display_name?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  employee_status?: string;
}) => {
  try {
    console.log('Creating user with data:', userData);

    // 1. Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        display_name: userData.display_name || userData.email.split('@')[0],
        phone: userData.phone || '',
        department: userData.department || '',
        job_title: userData.job_title || '',
        employee_status: userData.employee_status || 'active',
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('Auth user created:', authData.user.id);

    // 2. Create profile manually (with user_id)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: userData.email,
        display_name: userData.display_name || userData.email.split('@')[0],
        phone: userData.phone || '',
        department: userData.department || '',
        job_title: userData.job_title || '',
        employee_status: userData.employee_status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback: Delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    console.log('Profile created successfully');

    return {
      success: true,
      user: authData.user,
      message: 'User created successfully'
    };

  } catch (error: any) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user'
    };
  }
};