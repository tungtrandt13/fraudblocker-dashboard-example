const API_URL =
    process.env.NODE_ENV === 'development' ?
    'http://localhost:3000/api' :
    'https://backend.fraudblocker.com/api';

export default API_URL;