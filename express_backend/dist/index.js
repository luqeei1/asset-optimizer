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
const User_1 = __importDefault(require("./models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let newsCache = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 10;
const JWT_SECRET = process.env.JWT_SECRET;
const url = process.env.MONGO_URL || " ";
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password required' });
        return;
    }
    try {
        const existingUser = await User_1.default.findOne({ username });
        if (existingUser) {
            res.status(409).json({ error: 'Username already exists' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = new User_1.default({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password required' });
        return;
    }
    try {
        const user = await User_1.default.findOne({ username });
        if (!user) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        if (!JWT_SECRET) {
            res.status(500).json({ error: 'JWT secret not configured' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Access token is missing or invalid' });
        return;
    }
    if (!JWT_SECRET) {
        res.status(500).json({ error: 'JWT secret is not configured on the server.' });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).json({ error: 'Invalid access token' });
            return;
        }
        req.user = user;
        next();
    });
}
app.get('/portfolio', authenticateToken, async (req, res) => {
    res.json({ message: 'Welcome ' + req.user.username });
});
app.post('/optimize', async (req, res) => {
    const { assets, window_days, constraints } = req.body;
    console.log('Received from frontend:', req.body);
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
        res.status(400).json({ error: 'Assets array is required and cannot be empty' });
        return;
    }
    if (window_days === undefined || typeof window_days !== 'number') {
        res.status(400).json({ error: 'window_days is required and must be a number' });
        return;
    }
    if (!constraints) {
        res.status(400).json({ error: 'Constraints object is required' });
        return;
    }
    try {
        const FastAPIUrl = 'http://localhost:8000/optimize';
        const payload = {
            assets: assets,
            window_days: window_days,
            constraints: {
                min_asset_weight: constraints.min_asset_weight || 0.05,
                max_asset_weight: constraints.max_asset_weight || 0.75,
                risk_free_rate: constraints.risk_free_rate || null
            }
        };
        console.log('Sending to FastAPI:', payload);
        const response = await axios_1.default.post(FastAPIUrl, payload);
        console.log('Response from FastAPI:', response.data);
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error('Axios/FastAPI error:', error.response?.data || error.message);
        if (error.response?.data) {
            res.status(error.response.status || 500).json({
                error: error.response.data.detail || 'FastAPI Error',
                details: error.response.data
            });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.post('/find', async (req, res) => {
    const { name } = req.body;
    console.log('Received from frontend:', req.body);
    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Name is required and must be a string' });
        return;
    }
    try {
        const fastAPIUrl = 'http://localhost:8000/find';
        const fastapiPayload = { name };
        console.log('Sending to FastAPI:', fastapiPayload);
        const response = await axios_1.default.post(fastAPIUrl, fastapiPayload);
        console.log('FastAPI response:', response.data);
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error('Axios error message:', error.message);
        console.error('Axios error data:', error.response?.data);
        console.error('Axios status code:', error.response?.status);
        if (error.response?.data) {
            res.status(error.response.status || 500).json({
                error: error.response.data.detail || 'Symbol lookup failed',
                details: error.response.data
            });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.get('/portfolio/list', async (req, res) => {
    try {
        const portfolios = await PortfolioModel_1.default.find({});
        res.status(200).json(portfolios);
    }
    catch (error) {
        console.error('Database error fetching portfolios:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/news', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const start = (page - 1) * limit;
    const end = page * limit;
    try {
        if (!newsCache || Date.now() - lastFetched > CACHE_TTL) {
            console.log('Cache expired or empty, fetching fresh news from FastAPI...');
            const response = await axios_1.default.get('http://localhost:8000/news');
            newsCache = response.data;
            lastFetched = Date.now();
            console.log(`Fetched ${newsCache.length} articles from FastAPI`);
        }
        else {
            console.log('Using cached news data');
        }
        const newsdata = newsCache.slice(start, end);
        console.log(`Returning ${newsdata.length} articles for page ${page}`);
        res.status(200).json({
            page,
            limit,
            total: newsCache.length,
            totalPages: Math.ceil(newsCache.length / limit),
            results: newsdata,
            lastUpdated: new Date(lastFetched).toISOString(),
            cached: Date.now() - lastFetched < CACHE_TTL
        });
    }
    catch (error) {
        console.error('News fetch error:', error.message);
        console.error('Axios error data:', error.response?.data);
        console.error('Axios status code:', error.response?.status);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/historical', async (req, res) => {
    const { symbol, start, end, step } = req.body;
    if (!symbol || !start || !end || !step) {
        res.status(400).json({ error: 'symbol, start, end, and step are all required' });
        return;
    }
    try {
        const fastAPIUrl = `http://localhost:8000/historical`;
        const payload = { symbol, start, end, step };
        console.log('Fetching historical data for:', payload);
        const response = await axios_1.default.post(fastAPIUrl, payload, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (response.data) {
            console.log(`Retrieved ${response.data.length} historical data points for ${symbol}`);
            res.status(200).json(response.data);
        }
        else {
            res.status(404).json({ error: 'Historical data not found' });
        }
    }
    catch (error) {
        console.error('Error fetching historical data:', error.message);
        console.error('FastAPI error:', error.response?.data);
        if (error.response?.data) {
            res.status(error.response.status || 500).json({
                error: error.response.data.detail || 'Historical data fetch failed',
                details: error.response.data
            });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.get('/market_snapshot', async (req, res) => {
    try {
        const fastAPIUrl = 'http://localhost:8000/market_snapshot';
        const response = await axios_1.default.get(fastAPIUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (response.data) {
            res.status(200).json(response.data);
        }
        else {
            res.status(404).json({ error: 'Market snapshot not found' });
        }
    }
    catch (error) {
        console.error('Error fetching market snapshot:', error.message);
        console.error('FastAPI error:', error.response?.data);
        if (error.response?.data) {
            res.status(error.response.status || 500).json({
                error: error.response.data.detail || 'Market snapshot fetch failed',
                details: error.response.data
            });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.get('/portfolio/:id', async (req, res) => {
    const portfolioId = req.params.id;
    if (!portfolioId) {
        res.status(400).json({ error: 'Portfolio ID is required' });
        return;
    }
    try {
        const portfolio = await PortfolioModel_1.default.findById(portfolioId);
        if (!portfolio) {
            res.status(404).json({ error: 'Portfolio not found' });
        }
        else {
            res.status(200).json(portfolio);
            console.log('Portfolio fetched successfully');
        }
    }
    catch (error) {
        console.error('Database error fetching portfolio:', error);
        if (error.name === 'CastError') {
            res.status(400).json({ error: 'Invalid portfolio ID format' });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.post('/save', async (req, res) => {
    const portfolioData = req.body;
    if (!portfolioData) {
        res.status(400).json({ error: 'Portfolio data is required' });
        return;
    }
    try {
        const newPortfolio = new PortfolioModel_1.default(portfolioData);
        await newPortfolio.save();
        res.status(201).json(newPortfolio);
    }
    catch (error) {
        console.error('Error saving portfolio:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/portfolios', async (req, res) => {
    try {
        const portfolios = await PortfolioModel_1.default.find();
        res.status(200).json(portfolios);
    }
    catch (error) {
        console.error('Error fetching portfolios:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
mongoose_1.default
    .connect(url)
    .then(() => {
    app.listen(5000, () => {
        console.log('Server is running on port 5000');
        console.log('Connected to MongoDB successfully');
    });
})
    .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});
