'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';

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

  const router = useRouter();

  const fetchHistoricalData = async (asset: { symbol: string; start: string; end: string; step: string }) => {
    const data = {
      symbol: asset.symbol,
      start: asset.start,
      end: asset.end,
      step: asset.step,
    };
    
    try {
      const response = await fetch('http://localhost:5000/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
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
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchHistoricalData2 = async (asset: { symbol: string; start: string; end: string; step: string }) => {
    const data = {
      symbol: asset.symbol,
      start: asset.start,
      end: asset.end,
      step: asset.step,
    };
    try {
      const response = await fetch('http://localhost:5000/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
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
      console.error('Error fetching historical data:', error);
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
    responsive : true, 
    plugins : {
      legend: { position : 'top' as const },
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
    <div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => router.push('/')}
        className="bg-red-500 text-white p-2 rounded-md w-30 px-10 mt-4"
      >
        Return
      </motion.button>

      <div className="flex flex-col items-center justify-center mt-10 mb-10">
        <h1 className="text-4xl underline decoration-red-500 font-extrabold"> Historical data </h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-10 justify-between items-start w-full max-w-7xl px-4 mx-auto mt-10 mb-10">
        <div className="flex flex-col items-start justify-start w-full md:w-[400px]">
          <h2 className="text-xl font-bold underline decoration-red-500 mb-4">Add a stock to compare</h2>
          <div className="space-y-4 w-full">
            <div className="flex flex-row gap-4">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.currentTarget.value)}
                className="border border-gray-300 p-2 rounded-md w-full"
                type="text"
                placeholder="Enter symbol (e.g., AAPL)"
              />
              <input
                value={symbol2}
                onChange={(e) => setSymbol2(e.currentTarget.value)}
                className="border border-gray-300 p-2 rounded-md w-full"
                type="text"
                placeholder="Enter symbol 2 (e.g., MSFT)"
              />
            </div>
            <input
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
              className="border border-gray-300 p-2 rounded-md w-full"
              type="date"
              placeholder="Start date (YYYY-MM-DD)"
            />
            <input
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
              className="border border-gray-300 p-2 rounded-md w-full"
              type="date"
              placeholder="End date (YYYY-MM-DD)"
            />
            <input
              value={step}
              onChange={(e) => setStep(e.currentTarget.value)}
              className="border border-gray-300 p-2 rounded-md w-full"
              type="text"
              placeholder="Step (e.g., 1d, 1mo)"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={(e) => {
                e.preventDefault();
                if (!symbol || !symbol2 || !startDate || !endDate || !step) {
                  alert('Please fill in all fields');
                  return;
                }
                const newAsset = { symbol, start: startDate, end: endDate, step };
                const newAsset2 = { symbol: symbol2, start: startDate, end: endDate, step };
                setAssets((prev) => [...prev, newAsset, newAsset2]);
              }}
              className="bg-red-500 text-white p-2 rounded-md w-full"
            >
              Add stock to list to compare
            </motion.button>
          </div>
        </div>

        <div className="hidden md:flex flex-col justify-center px-6 max-w-sm text-white-700">
          <h2 className="text-2xl font-bold mb-3 underline decoration-red-500">About This Section</h2>
          <p className="mb-4">
            Here, you compare historical stock data of two symbols side by side. This is done via fetching
            daily open and close prices with flexible date ranges and intervals. Compare up to two stocks simultaneously, view detailed open and close price charts
            and switch between different graph types for better insights.
          </p>
        </div>

        <div className='flex flex-col items-start justify-start w-full md:w-[400px]'>
          <div className="flex flex-col items-start justify-start w-full md:w-[400px]">
            <h2 className="text-xl font-bold mb-4 underline decoration-red-500"> Chosen Assets</h2>
            <ul className="list-disc pl-4">
              {assets.map((asset, index) => (
                <li key={index}>
                  {asset.symbol} — {asset.start} to {asset.end} (step: {asset.step})
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-rows space-x-4 items-center justify-center mt-10 mb-10 ">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => {
                if (assets.length === 0) {
                  alert('Please add a stock to compare');
                  return;
                }
                fetchHistoricalData(assets[0]);
                fetchHistoricalData2(assets[1]);
              }}
              className="bg-red-500 text-white p-2 rounded-md mb-10"
            >
              Fetch Historical Data
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => {
                setSwitchGraph(!switchGraph);
              }}
              className="bg-red-500 text-white p-2 rounded-md mb-10"
            >
              Switch Graph
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center mt-10 mb-10">
        {historicalData.length > 0 && historicalData2.length > 0 && switchGraph === false && (
          <div className="w-full max-w-4xl mx-auto mt-10 p-4 border rounded shadow mb-10 w-[95%]">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {historicalData.length > 0 && historicalData2.length > 0 && switchGraph === false && (
          <div className="w-full max-w-4xl mx-auto mt-10 p-4 border rounded shadow mb-10 w-[95%]">
            <Line data={chartData2} options={chartOptions2} />
          </div>
        )}
      </div>

      {switchGraph === true && (
        <div className="w-full max-w-4xl mx-auto mt-10 p-4 border rounded shadow mb-10">
          <Line data={chartDataSwitch} options={chartOptionsSwitch} />
        </div>
      )}
    </div>
  );
};

export default Historical;
