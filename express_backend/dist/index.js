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
const url = process.env.MONGO_URL || " ";
app.post('/optimize', async (req, res) => {
    const { assets, risk, constraints, window } = req.body;
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
    }
    catch (error) {
        console.error('Axios/FastAPI error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/find', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: 'invalid name' });
    }
    try {
        const url = 'http://localhost:8000/find';
        const response = await axios_1.default.post(url, {
            name
        });
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error('Axios/FastAPI error:', error.response?.data || error.message);
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
        console.log('server is running on port 5000 (the backend has restarted)');
    });
})
    .catch((err) => {
    console.error('Error connecting to MongoDB: ', err);
});
