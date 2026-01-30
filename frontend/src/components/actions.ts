'use server';

import api from '@/lib/api';
import { cookies } from 'next/headers';

export const completeProfileAction = async (data: any) => {
  const cookieStore = await cookies();
  
  try {
    const res = await api.post('/api/auth/complete-profile', data);

    let authToken = res.headers['auth-token'] || '';
    if (authToken) {
      cookieStore.set({
        name: 'auth-token',
        value: authToken,
      });
    }

    if (res.data.success) {
      return {
        success: true,
        token: authToken,
        firstLogin: res.data.firstLogin || false,
      };
    } else {
      return { 
        success: false,
        message: res.data.message || 'Profile submission failed.'
      };
    }
  } catch (error: any) {
    // Pass back the error message from the server
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Server error occurred.'
    };
  }
};
