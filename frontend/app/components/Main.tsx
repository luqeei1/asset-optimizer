'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import NavBar from './NavBar';
import { 
  FiArrowLeft, 
  FiSearch, 
  FiX, 
  FiAlertCircle, 
  FiSettings, 
  FiRefreshCw,
  FiCheck,
  FiRotateCcw
} from 'react-icons/fi';
import { FaChartLine, FaHistory, FaPercentage, FaStepBackward, FaStepForward } from 'react-icons/fa';
import { CiSaveDown1 } from 'react-icons/ci';
import { s } from 'motion/react-client';

interface Portfolio {
  assets: string[];
  window_days: number;
  constraints: {
    min_asset_weight: number;
    max_asset_weight: number;
    risk_free_rate?: number;
  };
} 

interface OptimizeResponse {
  weights: { [key: string]: number };
  daily_return: number;
  daily_risk: number;
  daily_sharpe_ratio: number;
  annual_return: number;
  annual_risk: number;
  annual_sharpe_ratio: number;
  risk_free_rate_used: number;
}

interface Constraints {
  min_asset_weight: number;
  max_asset_weight: number;
  risk_free_rate?: number;
}

interface OptimizeRequest {
  assets: string[];
  window_days: number;
  constraints: Constraints;
}

const Main = () => {
  const [input, setInput] = useState('');
  const [assets, setAssets] = useState<string[]>([]);
  const [windowDays, setWindowDays] = useState(252); 
  const [foundSymbol, setFoundSymbol] = useState<string | null>(null);
  const [minAssetWeight, setMinAssetWeight] = useState(0.05); 
  const [maxAssetWeight, setMaxAssetWeight] = useState(0.75); 
  const [riskFreeRate, setRiskFreeRate] = useState<number | undefined>(undefined);
  const [displayResult, setDisplayResult] = useState<OptimizeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousPortfolios, setPreviousPortfolios] = useState<Portfolio[]>([]);
  const [showPrevious, setShowPrevious] = useState(false);
  const [nextPortfolioIndex, setNextPortfolioIndex] = useState(0);
  const [previousPortfolioIndex, setPreviousPortfolioIndex] = useState(0);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    assets: [],
    window_days: 252,
    constraints: {
      min_asset_weight: 0.05,
      max_asset_weight: 0.75,
      risk_free_rate: undefined
    }
  });

  const router = useRouter();

  const fetchPreviousPortfolios = async () => {
    try {

      const token = localStorage.getItem('jwtToken');
      const response = await fetch('http://localhost:5000/portfolios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch previous portfolios');
      }
      const data = await response.json();
      setPreviousPortfolios(data);
      console.log(`Fetched ${data.length} previous portfolios`);
    } catch (error) {
      console.error('Error fetching previous portfolios:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch previous portfolios');
    }
  };

  const FindAsset = async (companyName: string) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch symbol');
      }

      const symbolResponse = await response.json();

      if (symbolResponse?.symbol && symbolResponse.symbol !== 'Not found') {
        const symbol = symbolResponse.symbol;
        if (!assets.includes(symbol)) {
          setAssets((prev) => [...prev, symbol]);
          setFoundSymbol(symbol);
          setInput(''); 
        } else {
          setFoundSymbol(`${symbol} (already in portfolio)`);
        }
      } else {
        setFoundSymbol('Not found');
      }
    } catch (error) {
      console.error('Error finding asset:', error);
      setFoundSymbol('Not found');
      setError(error instanceof Error ? error.message : 'Failed to find symbol');
    }
  };

  const savetoMongoDB = async () => {
    if (assets.length < 2) {
      setError('Please add at least 2 assets to save the portfolio');
      return;
    }

    const payload: Portfolio = {
      assets,
      window_days: windowDays,
      constraints: {
        min_asset_weight: minAssetWeight,
        max_asset_weight: maxAssetWeight,
        risk_free_rate: riskFreeRate
      }
    };

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.log('You must be logged in to save a portfolio');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save portfolio');
      }

      const data = await response.json();
      console.log('Portfolio saved:', data);
      setPortfolio(payload);
    } catch (error) {
      console.error('Error saving portfolio:', error);
      setError(error instanceof Error ? error.message : 'Failed to save portfolio');
    }

  }

  const optimizePortfolio = async () => {
    if (assets.length < 2) {
      setError('Please add at least 2 assets for optimization');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: OptimizeRequest = {
        assets,
        window_days: windowDays,
        constraints: {
          min_asset_weight: minAssetWeight,
          max_asset_weight: maxAssetWeight,
          risk_free_rate: riskFreeRate 
        }
      };

      const response = await fetch('http://localhost:5000/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: OptimizeResponse = await response.json();
      setDisplayResult(data);
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      setError(error instanceof Error ? error.message : 'Optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect( () => {
    fetchPreviousPortfolios();
    setNextPortfolioIndex(1);
    setPreviousPortfolioIndex(previousPortfolios.length - 1);
  }, []);

  const nextPortfolio = () => {
    setAssets(previousPortfolios[nextPortfolioIndex]?.assets || []);
    setWindowDays(previousPortfolios[nextPortfolioIndex]?.window_days || 252);
    setFoundSymbol(null);
    setMinAssetWeight(previousPortfolios[nextPortfolioIndex]?.constraints.min_asset_weight || 0.05);
    setMaxAssetWeight(previousPortfolios[nextPortfolioIndex]?.constraints.max_asset_weight || 0.75);
    setRiskFreeRate(previousPortfolios[nextPortfolioIndex]?.constraints.risk_free_rate || undefined);
    setDisplayResult(showPrevious ? null : displayResult);
    setError(null);
    setInput('');
    setNextPortfolioIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex < previousPortfolios.length ? nextIndex : 0; 
    });

  }
  const prevPortfolio = () => {
    setAssets(previousPortfolios[previousPortfolioIndex]?.assets || []);
    setWindowDays(previousPortfolios[previousPortfolioIndex]?.window_days || 252);
    setFoundSymbol(null);
    setMinAssetWeight(previousPortfolios[previousPortfolioIndex]?.constraints.min_asset_weight || 0.05);
    setMaxAssetWeight(previousPortfolios[previousPortfolioIndex]?.constraints.max_asset_weight || 0.75);
    setRiskFreeRate(previousPortfolios[previousPortfolioIndex]?.constraints.risk_free_rate || undefined);
    setDisplayResult(showPrevious ? null : displayResult);
    setError(null);
    setInput('');
    setPreviousPortfolioIndex((prev) => {
      const prevIndex = prev - 1;
      return prevIndex >= 0 ? prevIndex : previousPortfolios.length - 1; 
    });
  }


  const resetPortfolio = () => {
    setAssets([]);
    setWindowDays(252);
    setFoundSymbol(null);
    setMinAssetWeight(0.05);
    setMaxAssetWeight(0.75);
    setRiskFreeRate(undefined);
    setDisplayResult(null);
    setError(null);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <NavBar />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pt-10">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 md:mb-0"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Portfolio <span className="text-red-500">Optimizer</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Maximize Sharpe ratio with optimized asset allocation
            </p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
          >
            <FiArrowLeft className="h-5 w-5" />
            Return
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-400">
              <FiAlertCircle className="h-5 w-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Asset</h2>
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {assets.length} {assets.length === 1 ? 'asset' : 'assets'} added
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search company (e.g., Apple, Microsoft)"
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                      e.preventDefault();
                      FindAsset(input.trim());
                    }
                  }}
                />
                <button
                  onClick={() => input.trim() && FindAsset(input.trim())}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  aria-label="Search company"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
              </div>

              {foundSymbol && (
                <div
                  className={`mt-3 text-sm px-3 py-2 rounded ${
                    foundSymbol === 'Not found' || foundSymbol.includes('(already in portfolio)')
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-green-900/20 text-green-400'
                  }`}
                  role="alert"
                >
                  {foundSymbol === 'Not found' 
                    ? 'Symbol not found - please try another company name'
                    : foundSymbol.includes('(already in portfolio)')
                    ? foundSymbol
                    : (
                        <>
                          Found: <span className="font-mono font-bold">{foundSymbol}</span> - Added to portfolio
                        </>
                      )}
                </div>
              )}

              {assets.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">PORTFOLIO ASSETS</h3>
                  <div className="flex flex-wrap gap-2">
                    {assets.map((symbol, idx) => (
                      <div
                        key={idx}
                        className="flex items-center bg-gray-800 px-3 py-1.5 rounded-lg"
                      >
                        <span className="font-mono text-sm">{symbol}</span>
                        <button
                          onClick={() => setAssets(assets.filter((_, i) => i !== idx))}
                          className="ml-2 text-gray-400 hover:text-white"
                          aria-label={`Remove ${symbol}`}
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Parameters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-400">Window Days</label>
                  <input
                    type="number"
                    value={windowDays}
                    onChange={(e) => setWindowDays(Math.max(1, Number(e.target.value)))}
                    placeholder="252"
                    min="1"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">Historical data period (252 = ~1 year)</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-400">Risk-Free Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={riskFreeRate !== undefined ? (riskFreeRate * 100) : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRiskFreeRate(val === '' ? undefined : Number(val) / 100);
                    }}
                    placeholder="Auto-fetch 10Y Treasury"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">Leave empty to auto-fetch current rate</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-400">Min Asset Weight (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={minAssetWeight * 100}
                    onChange={(e) => setMinAssetWeight(Math.max(0, Math.min(1, Number(e.target.value) / 100)))}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">Minimum allocation per asset</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-400">Max Asset Weight (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={maxAssetWeight * 100}
                    onChange={(e) => setMaxAssetWeight(Math.max(0, Math.min(1, Number(e.target.value) / 100)))}
                    placeholder="75"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">Maximum allocation per asset</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Actions</h2>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    assets.length >= 2 && !isLoading
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={optimizePortfolio}
                  disabled={assets.length < 2 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <FaChartLine className="h-5 w-5" />
                      Optimize Portfolio
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetPortfolio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiRotateCcw className="h-5 w-5" />
                  Reset Portfolio
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {savetoMongoDB()}}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <CiSaveDown1 className="h-5 w-5" />
                  Save Portfolio
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    setShowPrevious(!showPrevious);
                    if (!showPrevious) {
                      setAssets(previousPortfolios[0]?.assets || []);
                      setWindowDays(previousPortfolios[0]?.window_days || 252);
                      setFoundSymbol(null);
                      setMinAssetWeight(previousPortfolios[0]?.constraints.min_asset_weight || 0.05);
                      setMaxAssetWeight(previousPortfolios[0]?.constraints.max_asset_weight || 0.75);
                      setRiskFreeRate(previousPortfolios[0]?.constraints.risk_free_rate || undefined);
                      setDisplayResult(showPrevious ? null : displayResult);
                      setError(null);
                      setInput('');
                    } 
                    else {
                      resetPortfolio(); 
                    }
                  } 
                }

                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FaHistory className="h-5 w-5" />
                  {showPrevious ? 'Hide Previous Portfolios' : 'Show Previous Portfolios'}
                </motion.button>

                {showPrevious  && (
                  <div className="mt-4 bg-gray-800 rounded-lg p-4 gap-x-4">
                    <div className="flex items-center justify-between">
                      <FaStepBackward 
                      onClick={prevPortfolio}
                      className="h-5 w-5 text-gray-400 hover:scale-130 duration-200 cursor-pointer" />
                      <span className="text-gray-100 text-m text-center flex-1">Previous Portfolios</span>
                      <FaStepForward
                       onClick={nextPortfolio}
                       className="h-5 w-5 text-gray-400 hover:scale-130 duration-200 cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>

              {assets.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">CONSTRAINTS SUMMARY</div>
                  <div className="text-sm space-y-1">
                    <div>Window: {windowDays} days</div>
                    <div>Weight: {(minAssetWeight * 100).toFixed(1)}% - {(maxAssetWeight * 100).toFixed(1)}%</div>
                    <div>Risk-free: {riskFreeRate !== undefined ? `${(riskFreeRate * 100).toFixed(2)}%` : 'Auto-fetch'}</div>
                  </div>
                </div>
              )}
            </div>

            {displayResult && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Optimization Results</h2>
                  <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded">
                    <FiCheck className="inline mr-1" /> Success
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">ASSET ALLOCATION</h3>
                    <div className="space-y-2">
                      {assets.map((asset, idx) => {
                        const weight = displayResult.weights[asset] || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                            <span className="font-mono text-sm">{asset}</span>
                            <span className="font-bold text-white">
                              {(weight * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-xs text-gray-400">ANNUAL RETURN</div>
                      <div className="font-bold text-green-400 text-lg">
                        {(displayResult.annual_return * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-xs text-gray-400">ANNUAL RISK</div>
                      <div className="font-bold text-red-400 text-lg">
                        {(displayResult.annual_risk * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-xs text-gray-400">SHARPE RATIO</div>
                      <div className="font-bold text-white text-lg">
                        {displayResult.annual_sharpe_ratio.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Risk-free rate: {(displayResult.risk_free_rate_used * 100).toFixed(2)}%</div>
                      <div>Daily return: {(displayResult.daily_return * 100).toFixed(3)}%</div>
                      <div>Daily Sharpe: {displayResult.daily_sharpe_ratio.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Main;