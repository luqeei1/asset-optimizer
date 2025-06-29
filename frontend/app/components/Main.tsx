'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'

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
  const [display_w, setDisplay_w] = useState(0);
  const [display_r, setDisplay_r] = useState(0);

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

  const FindAsset = async (companyName: string) => {
    try {
      const response = await fetch('http://localhost:5000/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const symbol = await response.json();

      if (typeof symbol === 'string' && symbol !== 'Not found') {
        if (!assets.includes(symbol)) {
          setAssets(prev => [...prev, symbol]);
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
    <div>
      <div className='flex flex-cols px-[15%] py-[5%]'>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className='text-3xl text-white font-bold italic underline decoration-red-500'
        >
          Current Portfolio
        </motion.div>
      </div>

      <div className='flex flex-cols px-[15%] py-2'>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter company name (e.g., Apple)"
          className="input bg-white text-black rounded w-[25%] text-center"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (input.trim()) {
                FindAsset(input.trim());
                setInput('');
              }
            }
          }}
        />
      </div>


      {foundSymbol && (
        <h1 className='text-white mt-2 px-[15%]'>
          Found Symbol: <span className='font-bold'>{foundSymbol}</span>
        </h1>
      )}

      {assets.length > 0 && (
        <div className='text-white px-[15%] mt-4'>
          <h2 className='font-semibold underline'>Assets in Portfolio:</h2>
          <ul className='list-disc list-inside'>
            {assets.map((symbol, idx) => (
              <li key={idx}>{symbol}</li>
            ))}
          </ul>
        </div>
      )}
    
    <div className='flex flex-cols px-[15%] py-2 translate-y-[30%]'> 
      <p> enter your window size </p>
      <input
        type="text"
        value={window}
        onChange={((e)=> setWindow(Number(e.target.value)) )}
        placeholder = "Enter window size"
        className="input bg-white text-black rounded w-[25%] text-center translate-x-[13%]"
        onKeyDown={(e) => {
          if(e.key == 'Enter') {
            e.preventDefault();
            if (window > 0 && Number(window) === window) {
              setDisplay_w(window);
              setWindow(0);
            }
          }
        }}
      /> 

      <div className='text-white px-[10%] mt-4'>
        <h2 className='font-semibold underline'>Current Window Size:</h2>
        <p>{display_w.toString()}</p>
      </div>

    </div>

    <div className='flex flex-cols px-[15%] py-2 translate-y-[30%]'> 
      <p> enter your risk value </p>
      <input
        type="text"
        value={risk}
        onChange={((e)=> setRisk(Number(e.target.value)) )}
        placeholder = "Enter risk value"
        className="input bg-white text-black rounded w-[25%] text-center translate-x-[20%]"
        onKeyDown={(e) => {
          if(e.key == 'Enter') {
            e.preventDefault();
            if (risk > 0 && Number(risk) === risk) {
              setDisplay_r(risk);
              setRisk(0);
            }
          }
        }}
      /> 

      <div className='text-white px-[10%] mt-4'>
        <h2 className='font-semibold underline'>Current Risk Value:</h2>
        <p>{display_r.toString()}</p>
      </div>

    <div>
      <div className='flex flex-cols px-[15%] py-2 translate-y-[30%]'> 
        <p> enter your max weighted risk </p>
        <input
          type="text"
          value={maxWeightedRisk}
          onChange={(e) => setMaxWeightedRisk(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (maxWeightedRisk > 0 && Number(maxWeightedRisk) === maxWeightedRisk) {
                setConstraints({
                  maxWeightedRisk: maxWeightedRisk,
                  minWeightedRisk: minWeightedRisk,
                  summedWeights: summed
                });
                
              }
            }
          }}
          placeholder = "Enter max weighted risk"
          className="input bg-white text-black rounded w-[25%] text-center translate-x-[5%]"
        />
      </div>

       <div className='flex flex-cols px-[15%] py-2 translate-y-[30%]'> 
        <p> enter your min weighted risk </p>
        <input
          type="text"
          value={minWeightedRisk}
          onChange={(e) => setMinWeightedRisk(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (minWeightedRisk > 0 && Number(minWeightedRisk) === minWeightedRisk) {
                setConstraints({
                  maxWeightedRisk: maxWeightedRisk,
                  minWeightedRisk: minWeightedRisk,
                  summedWeights: summed
                });
                
              }
            }
          }}
          placeholder = "Enter min weighted risk"
          className="input bg-white text-black rounded w-[25%] text-center translate-x-[5%]"
        />
      </div>

       <div className='flex flex-cols px-[15%] py-2 translate-y-[30%]'> 
        <p> enter your summed weighted risk </p>
        <input
          type="text"
          value={summed}
          onChange={(e) => setSummed(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (summed > 0 && Number(summed) === summed) {
                setConstraints({
                  maxWeightedRisk: maxWeightedRisk,
                  minWeightedRisk: minWeightedRisk,
                  summedWeights: summed
                });
              }
            }
          }}
          placeholder = "Enter summed weighted risk"
          className="input bg-white text-black rounded w-[25%] text-center translate-x-[5%]"
        />
      </div>
      
      <div className='text-white px-[10%] mt-4'>
        <h2 className='font-semibold underline'>Current Constraints:</h2>
        {constraints ? (
          <p>
            Max Weighted Risk: {constraints.maxWeightedRisk}, Min Weighted Risk: {constraints.minWeightedRisk}, Summed Weights: {constraints.summedWeights}
          </p>
        ) : (
          <p>No constraints set</p>
        )}
        </div> 

    </div>
      
    </div>


    <div className="text-white px-[15%] mt-4 translate-y-[70%]">
      <h2 className="font-semibold underline">Window Size:</h2>
      <input
      type="text"
      value={window}
      onChange={(e) => setWindow(Number(e.target.value))}
      placeholder="Enter window size"
      className="input bg-white text-black rounded w-[25%] text-center"
      onKeyDown={(e) => { 
        if (e.key === 'Enter') {
          e.preventDefault(); 
          if (window > 0 && Number(window) === window) {
            setDisplay_w(window);
          }
        }
      }}


    />

    <div className="text-white px-[10%] mt-4">
      <h2 className="font-semibold underline">Current Window Size:</h2>
      <p>{display_w.toString()}</p>

    </div>

    </div>


    </div>
  )
}

export default Main
