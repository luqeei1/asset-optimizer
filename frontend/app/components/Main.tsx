'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Response {
  weights: number[];
  final_risk: number;
  final_return: number;
  final_sharpe_score: number;
}

interface Constraints {
  maxWeightedRisk: number;
  minWeightedRisk: number;
  summedWeights: number;
}

interface Portfolio {
  assets: string[];
  risk: number;
  constraints: Constraints;
  window: number;
}

const Main = () => {
  const [input, setInput] = useState('');
  const [assets, setAssets] = useState<string[]>([]);
  const [window, setWindow] = useState(0);
  const [risk, setRisk] = useState(0);
  const [constraints, setConstraints] = useState<Constraints | null>(null);
  const [foundSymbol, setFoundSymbol] = useState<string | null>(null);
  const [maxWeightedRisk, setMaxWeightedRisk] = useState(0);
  const [minWeightedRisk, setMinWeightedRisk] = useState(0);
  const [summed, setSummed] = useState(0);
  const [displayresult, setDisplayResult] = useState<Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const FindAsset = async (companyName: string) => {
    try {
      const response = await fetch('http://localhost:5000/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const symbolResponse = await response.json();

      if (
        symbolResponse &&
        typeof symbolResponse.symbol === 'string' &&
        symbolResponse.symbol !== 'Not found'
      ) {
        const symbol = symbolResponse.symbol;
        if (!assets.includes(symbol)) {
          setAssets((prev) => [...prev, symbol]);
        }
        setFoundSymbol(symbol);
      } else {
        setFoundSymbol('Not found');
      }
    } catch (error) {
      console.error('Error finding asset:', error);
      setFoundSymbol('Not found');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Portfolio <span className="text-red-500">Optimizer</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Maximize returns with optimized asset allocation
            </p>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="col-span-2 space-y-6">
            
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
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
                  placeholder="Search company (e.g., Apple)"
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
                    foundSymbol === 'Not found'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-green-900/20 text-green-400'
                  }`}
                  role="alert"
                >
                  {foundSymbol === 'Not found' ? (
                    'Symbol not found - please try another company name'
                  ) : (
                    <>
                      Found: <span className="font-mono font-bold">{foundSymbol}</span>
                      {!assets.includes(foundSymbol) && ' - Added to portfolio'}
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
            </div>

            
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Parameters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Window Size',
                    value: window,
                    setter: setWindow,
                    description: 'Time period for analysis (days)',
                  },
                  {
                    label: 'Risk Value',
                    value: risk,
                    setter: setRisk,
                    description: 'Target risk level',
                  },
                  {
                    label: 'Max Weighted Risk',
                    value: maxWeightedRisk,
                    setter: setMaxWeightedRisk,
                    description: 'Upper risk boundary',
                  },
                  {
                    label: 'Min Weighted Risk',
                    value: minWeightedRisk,
                    setter: setMinWeightedRisk,
                    description: 'Lower risk boundary',
                  },
                  {
                    label: 'Summed Weights',
                    value: summed,
                    setter: setSummed,
                    description: 'Total allocation (should be 1)',
                  },
                ].map(({ label, value, setter, description }, i) => (
                  <div key={i} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">{label}</label>
                    <input
                      type="number"
                      step="any"
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white"
                  onClick={() =>
                    setConstraints({
                      maxWeightedRisk,
                      minWeightedRisk,
                      summedWeights: summed,
                    })
                  }
                >
                  Set Constraints
                </motion.button>
              </div>
            </div>
          </div>

          
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Actions</h2>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    assets.length > 0 && constraints
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (assets.length > 0 && constraints) {
                      setIsLoading(true);
                      const portfolio: Portfolio = { assets, risk, constraints, window };
                      fetch('http://localhost:5000/optimize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(portfolio),
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          // Transform backend weights object to array by asset order
                          const weightArray = assets.map((asset) => data.weights[asset] ?? 0);
                          const transformed: Response = {
                            weights: weightArray,
                            final_risk: data.annual_risk,
                            final_return: data.annual_return,
                            final_sharpe_score: data.annual_sharpe_ratio,
                          };
                          setDisplayResult(transformed);
                          setIsLoading(false);
                        })
                        .catch((err) => {
                          console.error('Error optimizing portfolio:', err);
                          setIsLoading(false);
                        });
                    } else {
                      alert('Please add assets and set all parameters first.');
                    }
                  }}
                  disabled={!(assets.length > 0 && constraints)}
                  aria-disabled={!(assets.length > 0 && constraints)}
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
                  onClick={() => {
                    setAssets([]);
                    setWindow(0);
                    setRisk(0);
                    setConstraints(null);
                    setFoundSymbol(null);
                    setMaxWeightedRisk(0);
                    setMinWeightedRisk(0);
                    setSummed(0);
                    setDisplayResult(null);
                  }}
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
            </div>

            {displayresult && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Optimization Results</h2>
                  <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded">
                    Success
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">ASSET ALLOCATION</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {assets.map((asset, idx) => (
                        <div key={idx} className="bg-gray-800 p-2 rounded">
                          <div className="text-xs text-gray-400">{asset}</div>
                          <div className="font-mono text-sm font-bold">
                            {displayresult.weights && displayresult.weights[idx] != null
                              ? (displayresult.weights[idx] * 100).toFixed(1) + '%'
                              : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-xs text-gray-400">Return</div>
                      <div className="font-bold text-green-400">
                        {typeof displayresult.final_return === 'number'
                          ? displayresult.final_return.toFixed(2)
                          : '-'}
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-xs text-gray-400">Risk</div>
                      <div className="font-bold text-red-400">
                        {typeof displayresult.final_risk === 'number'
                          ? displayresult.final_risk.toFixed(2)
                          : '-'}
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-xs text-gray-400">Sharpe</div>
                      <div className="font-bold text-white">
                        {typeof displayresult.final_sharpe_score === 'number'
                          ? displayresult.final_sharpe_score.toFixed(2)
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
