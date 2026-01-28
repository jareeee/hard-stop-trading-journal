import api from '../api/axios';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface AuthResponse {
  status: {
    code: number;
    message: string;
  };
  data: User;
}

interface LoginPayload {
  user: {
    email: string;
    password: string;
  }
}

interface SignupPayload {
  user: {
     email: string;
     password: string;
     first_name: string;
     last_name: string;
  }
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<AuthResponse>('/login', payload);
    return response; 
  },

  signup: async (payload: SignupPayload) => {
    const response = await api.post<AuthResponse>('/signup', payload);
    return response;
  },
  
  logout: async () => {
    const response = await api.delete('/logout');
    localStorage.removeItem('token');
    return response;
  },

  getCurrentUser: async () => {
      const response = await api.get<{ status: any, data: User }>('/current_user');
      return response.data;
  }
};
