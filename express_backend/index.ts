import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PortfolioModel from './models/PortfolioModel';


const app = express();

dotenv.config(); 
app.use(cors());
app.use(express.json());


const url : string = process.env.MONGO_URL  || " ";

app.post('/optimize', async (req: Request, res: Response): Promise<void> => {
    const { assets, risk, constraints, window } = req.body;

    if (!assets || risk === undefined || !constraints || window === undefined) {
        res.status(400).json({ error: 'Invalid portfolio data' });
    }

    try {
        const newPortfolio = new PortfolioModel({
            assets,
            risk,
            constraints,
            window
        });
        
        await newPortfolio.save();
        res.status(201).json({ 
            message: 'Portfolio saved successfully',
            portfolio: newPortfolio
        });
    } catch (error) {
        console.error('Error saving portfolio:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/portfolio/list', async (req,res) => {
    try {
        const portfolios = await PortfolioModel.find({}); 
        res.status(200).json(portfolios);
    } catch (error) {
        res.status(500).json({ error : 'Internal Server Error' });
    }

}); 

app.get('/portfolio/:id', (req,res) => {
    const portfolioId = req.params.id;
    PortfolioModel.findById(portfolioId)
        .then((portfolio) => {
            if (!portfolio) {
                res.status(404).json({ error: 'Not found'});
            } else {
                res.status(200).json(portfolio);
                console.log('Portfolio fetched');
            }
        })

}); 






mongoose
    .connect(url)
    .then(() => {
        app.listen(5000, () => {
            console.log('server is running on port 5000'); 
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB: ', err);
    });
