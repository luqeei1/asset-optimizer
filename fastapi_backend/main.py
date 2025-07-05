from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import yfinance as yf
import numpy as np
from scipy.optimize import minimize
from typing import List, Optional
import requests
import time
from datetime import datetime
from yfinance import Ticker


app = FastAPI()


class HistoricalData(BaseModel):
    symbol: str
    start: str  
    end: str    
    step : str 

class CompanyName(BaseModel):
    name: str

class PortfolioConstraints(BaseModel):
    max_weighted_risk: float = 0.01 
    min_weighted_risk: float = 0     
    summed_weights: float = 1        

class PortfolioInput(BaseModel):
    assets: List[str]
    window_size: int = 1000          
    risk_value: float = 0           
    constraints: PortfolioConstraints

@app.post("/optimize")
def optimize_portfolio(
    portfolio: PortfolioInput,
    maximize_return: Optional[bool] = Query(False, description="Maximize return instead of Sharpe ratio")
):
   
    data = yf.download(portfolio.assets, period=f"{portfolio.window_size}d")["Close"]
    if data.empty:
        raise HTTPException(status_code=400, detail="Incorrect data provided")

    
    returns = data.pct_change().dropna()
    cov_matrix = returns.cov()
    mean_returns = returns.mean()

   
    def negative_sharpe(weights):
        port_return = np.dot(weights, mean_returns)
        port_risk = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return -port_return / port_risk if port_risk != 0 else 1e6

    def negative_return(weights):
        return -np.dot(weights, mean_returns)

    
    constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - portfolio.constraints.summed_weights},
    ]

   
    def max_risk_constraint(weights):
        marginal_risk = weights * (cov_matrix @ weights)
        total_risk = np.sqrt(weights.T @ cov_matrix @ weights)
        risk_contributions = marginal_risk / total_risk if total_risk != 0 else np.zeros_like(weights)
        return portfolio.constraints.max_weighted_risk - risk_contributions

    def min_risk_constraint(weights):
        marginal_risk = weights * (cov_matrix @ weights)
        total_risk = np.sqrt(weights.T @ cov_matrix @ weights)
        risk_contributions = marginal_risk / total_risk if total_risk != 0 else np.zeros_like(weights)
        return risk_contributions - portfolio.constraints.min_weighted_risk

    constraints.extend([
        {"type": "ineq", "fun": max_risk_constraint},
        {"type": "ineq", "fun": min_risk_constraint}
    ])

    
    bounds = tuple((0, 1) for _ in portfolio.assets)

   
    initial_weights = np.ones(len(portfolio.assets)) / len(portfolio.assets)

    
    result = minimize(
        negative_return if maximize_return else negative_sharpe,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
    )

    if not result.success:
        raise HTTPException(status_code=400, detail=f"Optimization failed: {result.message}")

   
    optimal_weights = result.x
    final_return = np.dot(optimal_weights, mean_returns)
    final_risk = np.sqrt(optimal_weights.T @ cov_matrix @ optimal_weights)
    sharpe_ratio = final_return / final_risk if final_risk != 0 else 0

    trading_days = 252 
    annualized_sharpe = sharpe_ratio * np.sqrt(trading_days)

    print(f"Optimal Weights: {optimal_weights}")
    print(f"Final Return: {final_return}")
    print(f"Final Risk: {final_risk}")
    print(f"Daily Sharpe Ratio: {sharpe_ratio}")
    print(f"Annualized Sharpe Ratio: {annualized_sharpe}")

   
    marginal_risk = optimal_weights * (cov_matrix @ optimal_weights)
    risk_contributions = marginal_risk / final_risk if final_risk != 0 else np.zeros_like(optimal_weights)

    return {
        "weights": optimal_weights.tolist(),
        "final_return": final_return,
        "final_risk": final_risk,
        "final_sharpe_score": annualized_sharpe,
    }

@app.post("/find")
def find_name(name: CompanyName):
    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={name.name}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    data = response.json()
    if data and data.get('quotes'):
        return data['quotes'][0]['symbol']
    raise HTTPException(status_code=404, detail="Stock not found")

def to_unix_timestamp(date_str: str) -> int:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return int(time.mktime(dt.timetuple()))

@app.post("/historical")
def get_historical_data(data: HistoricalData):
    ticker = Ticker(data.symbol)
    ticker_historical = ticker.history(start=data.start, end=data.end, interval=data.step)

    if ticker_historical.empty:
        raise HTTPException(status_code=404, detail="No historical data found for the given symbol and date range")

    ticker_historical.reset_index(inplace=True)
    print(ticker_historical)
    return ticker_historical.to_dict(orient="records")