import axios from 'axios';

// Set up the base URL for your backend
const API = axios.create({
    baseURL: 'https://project-31un.onrender.com',  // Ensure this points to your backend
});

// Send the JWT token in requests if authenticated
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token'); // Get token from localStorage (or however you store it)
    if (token) {
        req.headers.Authorization = `Bearer ${token}`; // Set token in the Authorization header
    }
    return req;
}, (error) => {
    return Promise.reject(error);
});

// Authentication API calls
export const register = (userData) => API.post('/auth/register', userData);
export const login = (userData) => API.post('/auth/login', userData);

// Favorite movies API calls
export const addFavoriteMovie = (movieId) => API.post('/favorites', { movieId });
export const getFavoriteMovies = () => API.get('/favorites');
