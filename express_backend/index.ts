import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PortfolioModel from './models/PortfolioModel';
import axios from 'axios';
import { parse } from 'path';
import Portfolio from './models/PortfolioModel'; 

const app = express();

dotenv.config(); 
app.use(cors());
app.use(express.json());

let newsCache : any = null;
let lastFetched : number = 0;
const CACHE_TTL : number = 1000 * 60 * 10; 

const url : string = process.env.MONGO_URL  || " ";

app.post('/optimize', async (req: Request, res: Response): Promise<void> => {
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
        
        const response = await axios.post(FastAPIUrl, payload);
        
        console.log('Response from FastAPI:', response.data);
        res.status(200).json(response.data);
    }
    catch (error: any) {
        console.error('Axios/FastAPI error:', error.response?.data || error.message);
        
        
        if (error.response?.data) {
            res.status(error.response.status || 500).json({ 
                error: error.response.data.detail || 'FastAPI Error',
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.post('/find', async (req: Request, res: Response): Promise<void> => {
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

        const response = await axios.post(fastAPIUrl, fastapiPayload);

        console.log('FastAPI response:', response.data); 

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Axios error message:', error.message);
        console.error('Axios error data:', error.response?.data);
        console.error('Axios status code:', error.response?.status);
        
        if (error.response?.data) {
            res.status(error.response.status || 500).json({ 
                error: error.response.data.detail || 'Symbol lookup failed',
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/portfolio/list', async (req, res) => {
    try {
        const portfolios = await PortfolioModel.find({}); 
        res.status(200).json(portfolios);
    } catch (error) {
        console.error('Database error fetching portfolios:', error);
        res.status(500).json({ error : 'Internal Server Error' });
    }
}); 

app.get('/news', async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25; 
    const start = (page - 1) * limit;
    const end = page * limit;

    try {
        
        if(!newsCache || Date.now() - lastFetched > CACHE_TTL) {
            console.log('Cache expired or empty, fetching fresh news from FastAPI...');
            const response = await axios.get('http://localhost:8000/news');
            newsCache = response.data;
            lastFetched = Date.now();
            console.log(`Fetched ${newsCache.length} articles from FastAPI`);
        } else {
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
    } catch (error: any) {
        console.error('News fetch error:', error.message);
        console.error('Axios error data:', error.response?.data);
        console.error('Axios status code:', error.response?.status);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/historical', async (req: Request, res: Response): Promise<void> => {
    const { symbol, start, end, step } = req.body;

    if (!symbol || !start || !end || !step) {
        res.status(400).json({ error: 'symbol, start, end, and step are all required' });
        return;
    }

    try {
        const fastAPIUrl = `http://localhost:8000/historical`;

        const payload = { symbol, start, end, step };
        console.log('Fetching historical data for:', payload);
        
        const response = await axios.post(
            fastAPIUrl,
            payload,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        if (response.data) {
            console.log(`Retrieved ${response.data.length} historical data points for ${symbol}`);
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ error: 'Historical data not found' });
        }
    } catch (error: any) {
        console.error('Error fetching historical data:', error.message);
        console.error('FastAPI error:', error.response?.data);
        
        if (error.response?.data) {
            res.status(error.response.status || 500).json({ 
                error: error.response.data.detail || 'Historical data fetch failed',
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/market_snapshot', async (req: Request, res: Response): Promise<void> => {
    try {
        const fastAPIUrl = 'http://localhost:8000/market_snapshot';
        const response = await axios.get(fastAPIUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' } 
        });

        if (response.data) {
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ error: 'Market snapshot not found' });
        }
    }
    catch (error: any) {
        console.error('Error fetching market snapshot:', error.message);
        console.error('FastAPI error:', error.response?.data);
        
        if (error.response?.data) {
            res.status(error.response.status || 500).json({ 
                error: error.response.data.detail || 'Market snapshot fetch failed',
                details: error.response.data
            });
        } else {
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
        const portfolio = await PortfolioModel.findById(portfolioId);
        
        if (!portfolio) {
            res.status(404).json({ error: 'Portfolio not found'});
        } else {
            res.status(200).json(portfolio);
            console.log('Portfolio fetched successfully');
        }
    } catch (error: any) {
        console.error('Database error fetching portfolio:', error);
        
        
        if (error.name === 'CastError') {
            res.status(400).json({ error: 'Invalid portfolio ID format' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}); 


app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.post('/save', async (req: Request, res: Response) => {
    const portfolioData = req.body;

    if (!portfolioData) {
        res.status(400).json({ error: 'Portfolio data is required' });
        return;
    }

    try {
        const newPortfolio = new Portfolio(portfolioData);
        await newPortfolio.save();
        res.status(201).json(newPortfolio);
    } catch (error: any) {
        console.error('Error saving portfolio:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/portfolios', async (req: Request, res: Response) => {
    try {
        const portfolios = await PortfolioModel.find();
        res.status(200).json(portfolios);
    } catch (error: any) {
        console.error('Error fetching portfolios:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

mongoose
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