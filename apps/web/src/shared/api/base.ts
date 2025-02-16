import axios from 'axios';

export const base = axios.create({ baseURL: import.meta.env.VITE_API_URL });
