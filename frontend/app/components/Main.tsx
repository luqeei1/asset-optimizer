'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import NavBar from './NavBar';

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
  const [riskFreeRate, setRiskFreeRate] = useState<number | undefined>(undefined); // backend auto fetches
  const [displayResult, setDisplayResult] = useState<OptimizeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

      if (symbolResponse && symbolResponse.symbol && symbolResponse.symbol !== 'Not found') {
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

      console.log('Sending optimization request:', payload);

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
      console.log('Optimization result:', data);
      setDisplayResult(data);
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      setError(error instanceof Error ? error.message : 'Optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
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
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
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
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reset Portfolio
                </motion.button>
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
                    Success
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