import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PortfolioModel from './models/PortfolioModel';
import axios from 'axios';
import { parse } from 'path';
import User from './models/User';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

declare global {
  namespace Express {
    interface Request {
      user?: any; // need for adding request.user
    }
  }
}


const PORT = process.env.PORT || 5000;


const app = express();

dotenv.config(); 
app.use(cors());
app.use(express.json());

let newsCache : any = null;
let lastFetched : number = 0;
const CACHE_TTL : number = 1000 * 60 * 20; // 20 minutes
const JWT_SECRET = process.env.JWT_SECRET; 
const FastAPI_URL = "https://asset-optimizer.onrender.com";

const url : string = process.env.MONGO_URL  || " ";

app.get('/protected-data', (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: "Missing token!" });
    return;
  }

  if (!JWT_SECRET) {
    res.status(500).json({ error: "JWT secret not configured" });
    return;
  }

  jwt.verify(token, JWT_SECRET as string, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid token!" });
      return;
    }
    res.json({ data: "Protected content!" });
  });
});


app.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    if (!JWT_SECRET) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }
    
    const token = jwt.sign({ username: user.username }, JWT_SECRET as string, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


function authenticateToken(req: Request, res: Response, next: any): void {
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

    jwt.verify(token, JWT_SECRET as string, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ error: 'Invalid access token' });
            return;
        }
        req.user = user;
        next();
    });
}

app.get('/portfolio', authenticateToken, async (req: Request, res: Response) => {
    res.json({message: 'Welcome ' + req.user.username });
})

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
        const FastAPIUrl = `${FastAPI_URL}/optimize`;


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
        const fastAPIUrl = `${FastAPI_URL}/find`;

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


app.get('/news', async (req: Request, res: Response): Promise<void> => {

    try {
        
        if(!newsCache || Date.now() - lastFetched > CACHE_TTL) {
            console.log('Cache expired or empty, fetching fresh news from FastAPI...');
            const response = await axios.get(`${FastAPI_URL}/news`);
            newsCache = response.data;
            lastFetched = Date.now();
            console.log(`Fetched ${newsCache.length} articles from FastAPI`);
        } else {
            console.log('Using cached news data');
        }
        
        const newsdata = newsCache
        console.log(`Returning ${newsdata.length} articles`);
        
        res.status(200).json({
            total: newsCache.length,
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
        const fastAPIUrl = `${FastAPI_URL}/historical`;

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
        const fastAPIUrl = `${FastAPI_URL}/market_snapshot`;
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

app.post('/save', authenticateToken, async (req: Request, res: Response) => {
    const portfolioData = req.body;

    if (!portfolioData) {
        res.status(400).json({ error: 'Portfolio data is required' });
        return;
    }

    try {
        const newPortfolio = new PortfolioModel({
            ...portfolioData,
            username: req.user.username  // safe now
        });
        await newPortfolio.save();
        res.status(201).json(newPortfolio);
    } catch (error: any) {
        console.error('Error saving portfolio:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/portfolios', authenticateToken, async (req: Request, res: Response) => {
    try {
        const portfolios = await PortfolioModel.find({ username: req.user.username });
        res.status(200).json(portfolios);
    } catch (error: any) {
        console.error('Error fetching portfolios:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); // somehow this magically started working after i commited lol 




mongoose
  .connect(url)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Connected to MongoDB successfully');
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
