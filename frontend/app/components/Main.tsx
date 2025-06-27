'use client'
import { input } from 'motion/react-client'
import React from 'react'

const Main = () => {

    
    interface Constraints {
        maxWeightedRisk: number;
        minWeightedRisk: number;
        summedWeights: number;
    }

    interface Portfolio {
        assets: string[];
        risk: Number;
        constraints: Constraints;
        window: Number;
    };

    const FindAsset : any = async () => {


    }

  return (
    <div>
        <div className='flex flex-cols px-[15%] py-[5%]'>
            <div className='text-3xl text-red-500 font-bold italic'>
                Current Portfolio
            </div>

            <input
            type="string"
            onChange={(e) => FindAsset(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' }// && addAsset()}
            placeholder="Amount (£)"
            className="input"
            />

        </div>
      
    </div>
  )
}

export default Main
