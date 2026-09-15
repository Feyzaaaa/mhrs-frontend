import axiosInstance from './axiosInstance';

export const authService = {
  login: async (credentials) => {
    const payload = {
      email: credentials.username || credentials.email,
      password: credentials.password
    };
    // '/auth/login' YERİNE '/users/login' YAPIYORUZ
    const response = await axiosInstance.post('/users/login', payload); 
    return response.data;
  },
  
  register: async (userData) => {
    // '/auth/register' YERİNE '/users/register' YAPIYORUZ
    const response = await axiosInstance.post('/users/register', userData);
    return response.data;
  },
};