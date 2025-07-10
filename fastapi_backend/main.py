from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import yfinance as yf
import pandas as pd
import numpy as np
from scipy.optimize import minimize
import requests
import logging
import os
import dotenv

from yfinance import Ticker

dotenv.load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY is not set in the environment variables")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("optimizer.log"),
        logging.StreamHandler()
    ]
)

app = FastAPI()



class PortfolioConstraints(BaseModel):
    min_asset_weight: float = 0.05
    max_asset_weight: float = 0.75

class PortfolioInput(BaseModel):
    assets: List[str]
    window_days: int = 126
    constraints: PortfolioConstraints

class HistoricalData(BaseModel):
    symbol: str
    start: str
    end: str
    step: str

class FindRequest(BaseModel):
    name: str



def get_historical_returns(assets: List[str], window_days: int) -> pd.DataFrame:
    df = yf.download(assets, period=f"{window_days}d")["Close"]
    if df.isnull().all().any():
        raise ValueError("Some assets may not have enough data.")
    return df.pct_change().dropna()

def annualize(return_, std_):
    ann_return = return_ * 252
    ann_std = std_ * np.sqrt(252)
    ann_sharpe = ann_return / max(ann_std, 1e-8)
    return ann_return, ann_std, ann_sharpe

def optimize_weights(returns: pd.DataFrame, constraints_obj: PortfolioConstraints) -> np.ndarray:
    cov_matrix = returns.cov()
    mean_returns = returns.mean()
    n_assets = len(returns.columns)

    def negative_sharpe_ratio(weights):
        port_return = np.dot(weights, mean_returns) * 252
        port_volatility = np.sqrt(weights.T @ cov_matrix @ weights) * np.sqrt(252)
        return -port_return / max(port_volatility, 1e-8)

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
        return np.ones(n_assets) / n_assets

    return result.x



@app.post("/optimize")
async def optimize_portfolio(portfolio: PortfolioInput):
    try:
        returns = get_historical_returns(portfolio.assets, portfolio.window_days)

        if returns.empty:
            raise ValueError("No return data available.")

        weights = optimize_weights(returns, portfolio.constraints)

        daily_return = np.dot(weights, returns.mean())
        daily_risk = np.sqrt(weights.T @ returns.cov() @ weights)
        ann_return, ann_risk, ann_sharpe = annualize(daily_return, daily_risk)

        return {
            "weights": {asset: round(w, 4) for asset, w in zip(portfolio.assets, weights)},
            "daily_return": round(daily_return, 6),
            "daily_risk": round(daily_risk, 6),
            "daily_sharpe_ratio": round(daily_return / max(daily_risk, 1e-8), 4),
            "annual_return": round(ann_return, 6),
            "annual_risk": round(ann_risk, 6),
            "annual_sharpe_ratio": round(ann_sharpe, 4),
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
        date = datetime.now().strftime("%Y-%m-%d")
        url = f"https://api.marketaux.com/v1/news/all?published_after={date}T00:00&api_token={API_KEY}"
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        return response.json()["data"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


