from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import yfinance as yf
import pandas as pd
import numpy as np
from scipy.optimize import minimize
import requests
import logging
import os
import dotenv
from fastapi.middleware.cors import CORSMiddleware
from yfinance import Ticker

dotenv.load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY is not set in the environment variables")

EXPRESS_BACKEND_URL = os.getenv("EXPRESS_BACKEND_URL")
if not EXPRESS_BACKEND_URL:
    raise ValueError("EXPRESS_BACKEND_URL is not set in the environment variables")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("optimizer.log"),
        logging.StreamHandler()
    ]
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PortfolioConstraints(BaseModel):
    min_asset_weight: float = 0.05
    max_asset_weight: float = 0.75
    risk_free_rate: Optional[float] = 0.05

class PortfolioInput(BaseModel):
    assets: List[str]
    window_days: int = 252
    constraints: PortfolioConstraints

class HistoricalData(BaseModel):
    symbol: str
    start: str
    end: str
    step: str

class FindRequest(BaseModel):
    name: str


def get_risk_free_rate() -> float:
    """
    Fetch current 10-year Treasury rate as risk-free rate proxy.
    Falls back to default if fetch fails.
    """
    try:
        treasury = yf.Ticker("^TNX")
        hist = treasury.history(period="5d")
        if not hist.empty:
            return hist['Close'].iloc[-1] / 100.0 # should be like 4.5% or something but depends in the market 
    except Exception as e:
        logging.warning(f"Failed to fetch risk-free rate: {e}")
    
    # Fallback to default 5%
    return 0.05


def get_historical_returns(assets: List[str], window_days: int) -> pd.DataFrame:
    df = yf.download(assets, period=f"{window_days}d")["Close"]
    if df.isnull().all().any():
        raise ValueError("Some assets may not have enough data.")
    return df.pct_change().dropna()

def annualize(return_, std_, risk_free_rate: float = 0.0):
    ann_return = return_ * 252
    ann_std = std_ * np.sqrt(252)
    # Proper Sharpe ratio: (return - risk_free_rate) / volatility
    ann_sharpe = (ann_return - risk_free_rate) / max(ann_std, 1e-8)
    return ann_return, ann_std, ann_sharpe

def create_fallback_weights(n_assets: int, constraints_obj: PortfolioConstraints) -> np.ndarray:
    """
    Create fallback weights that respect min/max constraints.
    """
    equal_weight = 1.0 / n_assets
    
    
    if equal_weight < constraints_obj.min_asset_weight:
        
        weights = np.full(n_assets, constraints_obj.min_asset_weight)
        total = weights.sum()
        if total > 1.0:
            
            weights = weights / total
    elif equal_weight > constraints_obj.max_asset_weight:
       
        max_assets = int(1.0 / constraints_obj.max_asset_weight)
        weights = np.full(n_assets, constraints_obj.min_asset_weight)
        
        weights[:max_assets] = constraints_obj.max_asset_weight
       
        remaining_weight = 1.0 - (max_assets * constraints_obj.max_asset_weight)
        remaining_assets = n_assets - max_assets
        if remaining_assets > 0 and remaining_weight > 0:
            weights[max_assets:] = remaining_weight / remaining_assets
    else:
       
        weights = np.full(n_assets, equal_weight)
    
    
    return weights / weights.sum()

def optimize_weights(returns: pd.DataFrame, constraints_obj: PortfolioConstraints) -> np.ndarray:
    cov_matrix = returns.cov()
    mean_returns = returns.mean()
    n_assets = len(returns.columns)
    
    
    risk_free_rate = constraints_obj.risk_free_rate
    if risk_free_rate is None:
        risk_free_rate = get_risk_free_rate()
    
    
    daily_rf_rate = risk_free_rate / 252

    def negative_sharpe_ratio(weights):
        port_return = np.dot(weights, mean_returns)  
        port_volatility = np.sqrt(weights.T @ cov_matrix @ weights)  
        
        sharpe = (port_return - daily_rf_rate) / max(port_volatility, 1e-8)
        return -sharpe  

    bounds = [(constraints_obj.min_asset_weight, constraints_obj.max_asset_weight)] * n_assets
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]

    result = minimize(
        negative_sharpe_ratio,
        x0=np.ones(n_assets) / n_assets,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints,
        options={'maxiter': 1000, 'ftol': 1e-9}
    )

    if not result.success:
        logging.warning(f"Optimization failed: {result.message}")
        return create_fallback_weights(n_assets, constraints_obj)

    return result.x


@app.post("/optimize")
async def optimize_portfolio(portfolio: PortfolioInput):
    try:
        returns = get_historical_returns(portfolio.assets, portfolio.window_days)

        if returns.empty:
            raise ValueError("No return data available.")

        weights = optimize_weights(returns, portfolio.constraints)

        
        risk_free_rate = portfolio.constraints.risk_free_rate
        if risk_free_rate is None:
            risk_free_rate = get_risk_free_rate()

        daily_return = np.dot(weights, returns.mean())
        daily_risk = np.sqrt(weights.T @ returns.cov() @ weights)
        ann_return, ann_risk, ann_sharpe = annualize(daily_return, daily_risk, risk_free_rate)

       
        daily_rf_rate = risk_free_rate / 252
        daily_sharpe = (daily_return - daily_rf_rate) / max(daily_risk, 1e-8)

        print(f"Optimized Weights: {weights}")
        print(f"Daily Return: {daily_return}, Daily Risk: {daily_risk}, Daily Sharpe Ratio: {daily_sharpe}")
        print(f"Annual Return: {ann_return}, Annual Risk: {ann_risk}, Annual Sharpe Ratio: {ann_sharpe}")

        return {
            "weights": {asset: round(w, 4) for asset, w in zip(portfolio.assets, weights)},
            "daily_return": round(daily_return, 6),
            "daily_risk": round(daily_risk, 6),
            "daily_sharpe_ratio": round(daily_sharpe, 4),
            "annual_return": round(ann_return, 6),
            "annual_risk": round(ann_risk, 6),
            "annual_sharpe_ratio": round(ann_sharpe, 4),
            "risk_free_rate_used": round(risk_free_rate, 4),
        }

    except Exception as e:
        logging.error(f"Optimization error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/find")
async def find_symbol(request: FindRequest):  
    try:
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={request.name}"
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        data = response.json()
        return {"symbol": data['quotes'][0]['symbol']}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Symbol lookup failed: {str(e)}")

@app.post("/historical")
async def get_historical(data: HistoricalData):
    try:
        ticker = Ticker(data.symbol)
        hist = ticker.history(start=data.start, end=data.end, interval=data.step)
        return hist.reset_index().to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/news")
async def get_market_news():
    try:
        date_30_days_ago = (datetime.now() - pd.Timedelta(days=30)).strftime("%Y-%m-%d")
        all_articles = []

        for page in range(1, 6):
            url = f"https://api.marketaux.com/v1/news/all?published_after={date_30_days_ago}T00:00&language=en&industries=Financial,Financial+Services,Energy,Communication+Services,Consumer+Cyclical,Utilities,Industrials&page={page}&limit=25&api_token={API_KEY}"
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get('data', [])
                all_articles.extend(articles)
                
               
                if len(articles) == 0:
                    break
            else:
                break
        
        print(f"Total fetched articles: {len(all_articles)}")
        return all_articles
        
    except Exception as e:
        logging.error(f"News fetch error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/")
async def startup():
    return {"message": "Asset Optimizer API is running!"}