'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

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
  const [display_w, setDisplay_w] = useState(0);
  const [display_r, setDisplay_r] = useState(0);
  const router = useRouter();

  interface Response {
        weights : number[],
        final_risk: number,
        final_return : number,
        final_sharpe_score : number
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

      <motion.button
              initial={{ opacity:0 }}
              animate={{ opacity:1}}
              transition={{ duration: 1, delay: 4 }}
              onClick={() => router.push('/')}
              className=" w-30 mt-16 px-8 py-3  text-red rounded-lg shadow-lg hover:shadow-xl hover:scale-105 "
              >
              Return
      </motion.button>

      <div className='flex flex-col px-[15%] py-[5%]'>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className='text-3xl text-white font-bold italic underline decoration-red-500'
        >
          Current Portfolio
        </motion.div>
      </div>

      


      <div className='flex flex-col items-left justify-left mt-8 px-[15%] translate-y-[10%]'>  
        <h1 className='font-extrabold text-white underline decoration-red-500 text-xl'> Enter your portfolio information : </h1>
      </div> 

      <div className='flex flex-col px-[15%] py-2'>
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

      <div className='flex flex-row items-start gap-6 px-[15%] py-4 mt-8'> 
        <div className='flex flex-col'>
          <p className='text-white mb-2 font-bold underline decoration-red-500'>Window Size</p>
          <input
            type="number"
            step={"any"}
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
            placeholder="Enter window size" // in days
            className="input bg-white text-black rounded w-full text-center"
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                e.preventDefault();
                if (window > 0) {
                  setDisplay_w(window);
                  
                }
              }
            }}
          />
        </div>

        <div className='flex flex-col'>
          <p className='text-white mb-2 font-bold underline decoration-red-500'>Risk Value</p>
          <input
            type="number"
            step="any"
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            placeholder="Enter risk value"
            className="input bg-white text-black rounded w-full text-center"
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                e.preventDefault();
                if (risk > 0) {
                  setDisplay_r(risk);
                  
                }
              }
            }}
          />
          
        </div>

        <div className='flex flex-col '>
          <p className='text-white mb-2 font-bold underline decoration-red-500'>Max Weighted Risk</p>
          <input
            type="number"
            step="any"
            value={maxWeightedRisk}
            onChange={(e) => setMaxWeightedRisk(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (maxWeightedRisk > 0) {
                  setConstraints({
                    maxWeightedRisk: maxWeightedRisk,
                    minWeightedRisk: minWeightedRisk,
                    summedWeights: summed
                  });
                  
                }
              }
            }}
            placeholder="Enter max weighted risk"
            className="input bg-white text-black rounded w-full text-center"
          />
        </div>

        <div className='flex flex-col '>
          <p className='text-white mb-2 font-bold underline decoration-red-500'>Min Weighted Risk</p>
          <input
            type="number"
            step="any"
            value={minWeightedRisk}
            onChange={(e) => setMinWeightedRisk(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (minWeightedRisk > 0) {
                  setConstraints({
                    maxWeightedRisk: maxWeightedRisk,
                    minWeightedRisk: minWeightedRisk,
                    summedWeights: summed
                  });
                  
                }
              }
            }}
            placeholder="Enter min weighted risk"
            className="input bg-white text-black rounded w-full text-center"
          />
        </div>

        <div className='flex flex-col '>
          <p className='text-white mb-2 font-bold underline decoration-red-500'>Summed Weights</p>
          <input
            type="number"
            step="any"
            value={summed}
            onChange={(e) => setSummed(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (summed > 0) {
                  setConstraints({
                    maxWeightedRisk: maxWeightedRisk,
                    minWeightedRisk: minWeightedRisk,
                    summedWeights: summed
                  });
                 
                }
              }
            }}
            placeholder="Enter summed weights"
            className="input bg-white text-black rounded w-full text-center"
          />
        </div>
      </div>
            
      <div className='flex flex-col  items-center justify-center mt-8 px-[15%] translate-y-[10%]'>  
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        className='bg-red-500 text-white px-4 py-2 rounded mt-4 mx-[15%] w-[25%]'
       onClick={() => {
       if (assets.length > 0 && constraints) {
          const portfolio: Portfolio = {
            assets,
            risk,
            constraints,
            window
          };
          console.log('Portfolio:', portfolio);
          fetch('http://localhost:5000/optimize', {
            method : 'POST',
            headers : { 'Content-Type' : 'application/json' },
            body : JSON.stringify(portfolio)
          })
          .then(response => response.json())
          .then(data => {
            console.log('Optimized Portfolio:', data);
            setDisplayResult(data); 
          })
          .catch(error => {
            console.error('Error optimizing portfolio:', error);
          });
        } else {
          alert('Please fill in all fields and add at least one asset.');
        }
      }}
      >
        Optimize Portfolio
      </motion.button>
      </div>
      <div> 
      </div>
      <div className='flex flex-col items-center justify-center mt-8 px-[15%] translate-y-[10%]'>  
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          className='bg-red-500 text-white px-4 py-2 rounded mt-4 mx-[15%] w-[25%]'
          onClick={() => {
            setAssets([]);
            setWindow(0);
            setRisk(0);
            setConstraints(null);
            setFoundSymbol(null);
            setMaxWeightedRisk(0);
            setMinWeightedRisk(0);
            setSummed(0);
            setDisplay_w(0);
            setDisplay_r(0);
          }} >
          Reset Portfolio
        </motion.button>
      </div>
      <div className='flex flex-col items-center justify-center mt-8 px-[15%] translate-y-[-15%]'>
        {displayresult && (
          <div className='text-white mt-4'>
            <h2 className='font-semibold underline'>Optimized Portfolio Result:</h2>
            <p className='mt-2 text-left'>Weights: {displayresult.weights.join(", ")}. Final Risk: {displayresult.final_risk}. Final Return: {displayresult.final_return}. Final Sharpe Score: {displayresult.final_sharpe_score}</p>
          </div>
        )}
      </div>
      </div>
  )
}

export default Main
