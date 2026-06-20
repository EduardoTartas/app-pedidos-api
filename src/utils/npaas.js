// src/utils/npaas.js
import axios from 'axios';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const npaas = axios.create({
    baseURL: process.env.NPAAS_URL,
    timeout: 10000,
    headers: {
        'x-api-key': process.env.NPAAS_API_KEY,
        'Content-Type': 'application/json'
    }
});

npaas.interceptors.response.use(
    res => res,
    err => {
        logger.error(`[NPaaS] Error: ${err.response?.status} - ${JSON.stringify(err.response?.data) || err.message}`);
        return Promise.reject(err);
    }
);

export default npaas;
