from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
import yfinance as yf
import numpy as np
from scipy.optimize import minimize
import pandas as pd
from typing import List


app = FastAPI()

class Constraints(BaseModel):
    maxWeightedRisk: float
    minWeightedRisk: float
    summedWeights: float

class Portfolio(BaseModel):
    assets : List[str]
    risk : float
    constraints: Constraints
    window : int 


@app.post("/optimize")
def optimize_port(portfolio: Portfolio):
    data = yf.download(portfolio.assets, period=f"{portfolio.window}d", auto_adjust=False)["Adj Close"]

    if data.empty:
        raise HTTPException(status_code=400, detail="incorrect data provided")
    

    returns = data.pct_change().dropna()
    cov_matrix = returns.cov()
    mean_returns = returns.mean()

    def negative_sharpe(weights, mean_returns, cov_matrix):
        portfolio_return = np.dot(weights, mean_returns)
        portfolio_risk = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return -portfolio_return / portfolio_risk
                                 
    initial_weights = np.array([1/len(portfolio.assets)] * len(portfolio.assets))
    bounds = tuple((0,1) for i in range(len(portfolio.assets)))
    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - portfolio.constraints.summedWeights}

    result = minimize(negative_sharpe, initial_weights, method="SLSQP", args= (mean_returns, cov_matrix), bounds=bounds, constraints=constraints)
    if not result.success: # minimize function gives us an object back so im only taking the success part of the object
        raise HTTPException(status_code=400, detail="The optimization failed")
    
    optimal_weights = result.x #x is the optimal weights of the result object so just using that too

    final_risk = np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))
    final_return = np.dot(optimal_weights, mean_returns)
    final_sharpe = final_return / final_risk

    final = {
        "weights" : optimal_weights.tolist(),
        "final risk": final_risk,
        "final return" : final_return,
        "final sharpe score" : final_sharpe
    }

    return final





    
    

    
