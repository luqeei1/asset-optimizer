'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';
import NavBar from './NavBar';
import { FiArrowLeft, FiBarChart2 } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type StockData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dividends: number;
  stockSplits: number;
};

const Historical = () => {
  const [assets, setAssets] = useState<{ symbol: string; start: string; end: string; step: string }[]>([]);
  const [symbol, setSymbol] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');   
  const [step, setStep] = useState<string>('');
  const [switchGraph, setSwitchGraph] = useState<boolean>(false);
  const [historicalData, setHistoricalData] = useState<StockData[]>([]);
  const [historicalData2, setHistoricalData2] = useState<StockData[]>([]);
  const [symbol2, setSymbol2] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  const router = useRouter();

  const expressBackendUrl = 'https://asset-optimizer-1.onrender.com';

  
  useEffect(() => {
    if (historicalData.length > 0 || historicalData2.length > 0) {
      setHistoricalData([]);
      setHistoricalData2([]);
    }
  }, [symbol, symbol2, startDate, endDate, step]);

  const fetchHistoricalData = async (asset: { symbol: string; start: string; end: string; step: string }) => {
    setIsLoading(true);
    setError(null);
    const data = {
      symbol: asset.symbol,
      start: asset.start,
      end: asset.end,
      step: asset.step,
    };
    
    try {
      try {
        const response = await fetch(`${expressBackendUrl}/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.symbol }),
        });

        const result = await response.json();
        
        data.symbol = result.symbol;
        console.log('Company symbol:', data.symbol);
      } catch (error) {
        setError('Invalid company name - please check your input');
        console.error('Error fetching company symbol:', error);
      }

      const response = await fetch(`${expressBackendUrl}/historical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const result = await response.json();
      const transformed: StockData[] = result.map((item: any) => ({
        date: item.Date,
        open: item.Open,
        high: item.High,
        low: item.Low,
        close: item.Close,
        volume: item.Volume,
        dividends: item.Dividends,
        stockSplits: item['Stock Splits'],
      }));
      setHistoricalData(transformed);
    } catch (error) {
      setError('Failed to load historical data - please try again');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalData2 = async (asset: { symbol: string; start: string; end: string; step: string }) => {
    setIsLoading(true);
    setError2(null);
    const data = {
      symbol: asset.symbol,
      start: asset.start,
      end: asset.end,
      step: asset.step,
    };
    
    try {
      try {
        const response = await fetch(`${expressBackendUrl}/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.symbol }),
        });

        

        const result = await response.json();
        

        data.symbol = result.symbol;
        console.log('Company symbol 2:', data.symbol);
      } catch (error) {
        setError2('Invalid company name - please check your input');
        return;
      }

      const response = await fetch(`${expressBackendUrl}/historical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const result = await response.json();
      const transformed: StockData[] = result.map((item: any) => ({
        date: item.Date,
        open: item.Open,
        high: item.High,
        low: item.Low,
        close: item.Close,
        volume: item.Volume,
        dividends: item.Dividends,
        stockSplits: item['Stock Splits'],
      }));
      setHistoricalData2(transformed);
    } catch (error) {
      setError2('Failed to load historical data - please try again');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: historicalData.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: `Close Price for ${symbol.toUpperCase()}`,
        data: historicalData.map((entry) => entry.close),
        borderColor: 'rgba(220, 38, 38, 1)', 
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: `Close Price for ${symbol2.toUpperCase()}`,
        data: historicalData2.map((entry) => entry.close),
        borderColor: 'rgba(0, 0, 255, 1)', 
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
        fill: true,
        tension: 0.3,
      }
    ],
  };

  const chartData2 = {
    labels: historicalData.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: `Open Price for ${symbol.toUpperCase()}`,
        data: historicalData.map((entry) => entry.open),
        borderColor: 'rgb(255, 0, 0)',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        fill: true,
        tension: 0.3,
      }, 
      {
        label: `Open Price for ${symbol2.toUpperCase()}`,
        data: historicalData2.map((entry) => entry.open),
        borderColor: 'rgb(0, 0, 255)',
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
        fill: true,
        tension: 0.3,
      }
    ],
  };

  const chartDataSwitch = {
    labels: historicalData.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: `Open Price for ${symbol.toUpperCase()}`,
        data: historicalData.map((entry) => entry.open),
        borderColor: 'rgba(0, 0, 255, 1)',
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
        fill: true,
        tension: 0.3,
      }, 
      {
        label: `Open Price for ${symbol2.toUpperCase()}`,
        data: historicalData2.map((entry) => entry.open),
        borderColor: 'rgb(255, 0, 0)',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label : `Close Price for ${symbol.toUpperCase()}`,
        data: historicalData.map((entry) => entry.close),
        borderColor: 'rgb(38, 220, 150)',
        backgroundColor: 'rgba(38, 90, 220, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label : `Close Price for ${symbol2.toUpperCase()}`,
        data: historicalData2.map((entry) => entry.close),
        borderColor: 'rgb(126, 38, 220)',
        backgroundColor: 'rgba(38, 90, 220, 0.2)',
        fill: true,
        tension: 0.3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Historical closing prices`},
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 10, maxRotation: 45, minRotation: 45 },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  const chartOptions2 = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Historical opening prices`},
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 10, maxRotation: 45, minRotation: 45 },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  const chartOptionsSwitch = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Historical prices` },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 10, maxRotation: 45, minRotation: 45 },
      },
      y: {
        beginAtZero: false,
      },
    },
  }

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
              Historical <span className="text-red-500">Data</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Compare stock performance over time
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Stocks</h2>
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {assets.length} {assets.length === 1 ? 'stock' : 'stocks'} selected
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={symbol}
                        onChange={(e) => {
                          setSymbol(e.target.value);
                          setError(null);
                        }}
                        placeholder="First symbol"
                        className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-500">{error}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={symbol2}
                        onChange={(e) => {
                          setSymbol2(e.target.value);
                          setError2(null);
                        }}
                        placeholder="Second symbol"
                        className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      {error2 && (
                        <p className="mt-1 text-sm text-red-500">{error2}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                    <input
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      type="date"
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                    <input
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      type="date"
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Time Interval</label>
                  <select
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg"
                  >
                    <option value="">Select interval</option>
                    <option value="1d">Daily</option>
                    <option value="1wk">Weekly</option>
                    <option value="1mo">Monthly</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    setError(null);
                    setError2(null);
                    if (!symbol || !symbol2 || !startDate || !endDate || !step) {
                      setError('Please fill in all fields');
                      return;
                    }
                    const newAsset = { symbol, start: startDate, end: endDate, step };
                    const newAsset2 = { symbol: symbol2, start: startDate, end: endDate, step };
                    setAssets([newAsset, newAsset2]);
                  }}
                  className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Add Stocks to Compare
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-4">About This Tool</h2>
              <p className="text-gray-400 mb-4">
                Compare historical performance between two stocks. View opening and closing prices over your selected time period.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p><span className="text-red-400">Tip:</span> Compare stocks in the same sector for meaningful insights.</p>
                <p><span className="text-red-400">Note:</span> Daily data works best for shorter time periods.</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Selected Stocks</h2>
              {assets.length > 0 ? (
                <div className="space-y-3">
                  {assets.map((asset, index) => (
                    <div key={index} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{asset.symbol.toUpperCase()}</span>
                        <span className="text-xs text-gray-400">
                          {asset.step === '1d' ? 'Daily' : asset.step === '1wk' ? 'Weekly' : 'Monthly'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {new Date(asset.start).toLocaleDateString()} - {new Date(asset.end).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No stocks selected yet</p>
              )}

              <div className="mt-6 space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (assets.length === 0) {
                      setError('Please add stocks to compare first');
                      return;
                    }
                    fetchHistoricalData(assets[0]);
                    fetchHistoricalData2(assets[1]);
                  }}
                  disabled={isLoading}
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isLoading ? 'bg-gray-700' : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  {isLoading ? 'Loading Data...' : 'Fetch Historical Data'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSwitchGraph(!switchGraph)}
                  disabled={historicalData.length === 0}
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    historicalData.length === 0 ? 'bg-gray-700' : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {switchGraph ? 'Show Separate' : 'Show Combined'}
                </motion.button>
              </div>
            </motion.div>

            {historicalData.length > 0 && historicalData2.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {!switchGraph ? (
                  <>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800" style={{ height: '500px' }}>
                      <Line data={chartData} options={chartOptions} />
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800" style={{ height: '500px' }}>
                      <Line data={chartData2} options={chartOptions2} />
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800" style={{ height: '500px' }}>
                    <Line data={chartDataSwitch} options={chartOptionsSwitch} />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center"
              >
                <div className="text-gray-500 mb-4">
                  <FiBarChart2 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Data to Display</h3>
                <p className="text-gray-400">
                  {assets.length > 0 
                    ? "Click 'Fetch Data' to load the charts" 
                    : "Add stocks to compare and fetch data"}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Historical;