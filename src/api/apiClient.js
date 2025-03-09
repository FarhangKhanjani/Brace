import axios from 'axios';
import config from '../config';
import { supabase } from '../supabase';

// Create an axios instance
const apiClient = axios.create({
  baseURL: config.API_URL
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(async (config) => {
  // Get session from Supabase
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient; 