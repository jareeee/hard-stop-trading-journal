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

const normalizeToken = (token: string) => token.startsWith('Bearer ') ? token.slice(7) : token;

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  const normalized = normalizeToken(token);
  const parts = normalized.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

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
  },

  clearToken: () => {
    localStorage.removeItem('token');
  },

  hasValidSessionToken: (): boolean => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return false;

    const payload = decodeJwtPayload(storedToken);
    if (!payload || !payload.exp) return false;

    return Date.now() < payload.exp * 1000;
  }
};
