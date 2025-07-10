"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const PortfolioModel_1 = __importDefault(require("./models/PortfolioModel"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let newsCache = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 10; // ive left this at 10 minutes, i think this seems ok but i can change this later? 
const url = process.env.MONGO_URL || " ";
app.post('/optimize', async (req, res) => {
    const { assets, risk, constraints, window } = req.body;
    console.log('Received from frontend:', req.body);
    if (!assets || risk === undefined || !constraints || window === undefined) {
        res.status(400).json({ error: 'Invalid portfolio data' });
    }
    try {
        const Fastapiurl = 'http://localhost:8000/optimize';
        const response = await axios_1.default.post(Fastapiurl, {
            assets,
            risk,
            constraints,
            window
        });
        res.status(200).json(response.data);
        console.log('Response from FastAPI:', response.data);
    }
    catch (error) {
        console.error('Axios/FastAPI error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/find', async (req, res) => {
    const { name } = req.body;
    console.log(' Received from frontend:', req.body);
    if (!name) {
        res.status(400).json({ error: 'Invalid name' });
    }
    try {
        const url = 'http://localhost:8000/find';
        const fastapiPayload = { name };
        console.log('Sending to FastAPI:', fastapiPayload);
        const response = await axios_1.default.post(url, fastapiPayload);
        console.log('FastAPI response:', response.data);
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error(' Axios error message:', error.message);
        console.error(' Axios error data:', error.response?.data);
        console.error('Axios status code:', error.response?.status);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/portfolio/list', async (req, res) => {
    try {
        const portfolios = await PortfolioModel_1.default.find({});
        res.status(200).json(portfolios);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/news', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * 10;
    const end = page * 10;
    try {
        if (!newsCache || Date.now() - lastFetched > CACHE_TTL) {
            const response = await axios_1.default.get('http://localhost:8000/news');
            newsCache = response.data;
            lastFetched = Date.now();
        }
        const newsdata = newsCache.slice(start, end);
        res.status(200).json({
            page,
            total: newsCache.length,
            results: newsdata,
            lastUpdated: new Date(lastFetched).toISOString()
        });
    }
    catch (error) {
        console.error('Axios error message:', error.message);
        console.error('Axios error data:', error.response?.data);
        console.error('Axios status code:', error.response?.status);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/historical', async (req, res) => {
    const { symbol, start, end, step } = req.body;
    if (!symbol || !start || !end || !step) {
        res.status(400).json({ error: 'Invalid request data' });
        return;
    }
    try {
        const url = `http://localhost:8000/historical`;
        const response = await axios_1.default.post(url, { symbol, start, end, step }, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (response.data) {
            res.status(200).json(response.data);
        }
        else {
            res.status(404).json({ error: 'Historical data not found' });
        }
    }
    catch (error) {
        console.log('Error fetching historical data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/market_snapshot', async (req, res) => {
    try {
        const url = 'http://localhost:8000/market_snapshot';
        const response = await axios_1.default.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (response.data) {
            res.status(200).json(response.data);
        }
        else {
            res.status(404).json({ error: 'Market snapshot not found' });
        }
    }
    catch (error) {
        console.error('Error fetching market snapshot:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/portfolio/:id', (req, res) => {
    const portfolioId = req.params.id;
    PortfolioModel_1.default.findById(portfolioId)
        .then((portfolio) => {
        if (!portfolio) {
            res.status(404).json({ error: 'Not found' });
        }
        else {
            res.status(200).json(portfolio);
            console.log('Portfolio fetched');
        }
    });
});
mongoose_1.default
    .connect(url)
    .then(() => {
    app.listen(5000, () => {
        console.log('server is running on port 5000 (the backend has done)');
    });
})
    .catch((err) => {
    console.error('Error connecting to MongoDB: ', err);
});
