'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';
import { Line } from 'react-chartjs-2';

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
  const [historicalData, setHistoricalData] = useState<StockData[]>([]);

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

  const chartData = {
    labels: historicalData.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Close Price',
        data: historicalData.map((entry) => entry.close),
        borderColor: 'rgba(220, 38, 38, 1)', 
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Open Price',
        data: historicalData.map((entry) => entry.open),
        borderColor: 'rgba(0, 0, 255, 1)', 
        backgroundColor: 'rgba(0, 0, 255, 0.2)',
        fill: true,
        tension: 0.3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Historical Prices of ${symbol.toUpperCase()}`},
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

  return (
    <div>
      <div className="flex flex-col items-center justify-center mt-10 mb-10">
        <h1 className="text-4xl underline decoration-red-500 font-extrabold"> Historical data </h1>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 w-[50%] translate-x-[50%]">
        <input
          onKeyDown={(e) => {
            if (e.key === 'Enter') setSymbol(e.currentTarget.value);
          }}
          className="border border-gray-300 p-2 rounded-md"
          type="text"
          placeholder="Enter symbol (e.g., AAPL)"
        />
        <input
          onChange={(e) => setStartDate(e.currentTarget.value)}
          className="border border-gray-300 p-2 rounded-md"
          type="date"
          placeholder="Start date (YYYY-MM-DD)"
        />
        <input
          onChange={(e) => setEndDate(e.currentTarget.value)}
          className="border border-gray-300 p-2 rounded-md"
          type="date"
          placeholder="End date (YYYY-MM-DD)"
        />
        <input
          onChange={(e) => setStep(e.currentTarget.value)}
          className="border border-gray-300 p-2 rounded-md"
          type="text"
          placeholder="Step (e.g., 1d, 1mo)"
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            if (!symbol || !startDate || !endDate || !step) {
              alert('Please fill in all fields');
              return;
            }
            e.preventDefault();
            const newAsset = { symbol, start: startDate, end: endDate, step };
            setAssets((prev) => [...prev, newAsset]);
          }}
          className="bg-red-500 text-white p-2 rounded-md"
        >
          Add stock to list to compare
        </motion.button>
      </div>

      <div className="flex flex-col items-center justify-center mt-10 mb-10">
        <h2 className="text-2xl font-bold">Comparison List</h2>
        <ul className="list-disc">
          {assets.map((asset, index) => (
            <li key={index}>
              {asset.symbol} - {asset.start} to {asset.end} (with a step of {asset.step})
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center justify-center mt-10 mb-10 translate-y-[50%]">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            assets.forEach((asset) => fetchHistoricalData(asset));
          }}
          className="bg-red-500 text-white p-2 rounded-md mb-10"
        >
          Fetch Historical Data
        </motion.button>
      </div>

      {historicalData.length > 0 && (
        <div className="w-full max-w-4xl mx-auto mt-10 p-4 border rounded shadow">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default Historical;
