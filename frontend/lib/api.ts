import axios from 'axios';

const api = axios.create({
  baseURL: typeof window === 'undefined' 
    ? (process.env.INTERNAL_API_URL || 'http://backend:8080/api') // Server-side (internal Docker network)
    : '/api', // Client-side (proxy through Nginx)
});

export default api;
