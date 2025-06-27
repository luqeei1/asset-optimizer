'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion'; 
import { useEffect, useState} from 'react';

const HomePage = () => {

    const router = useRouter(); 
    

  return (
    
    <div className='flex flex-col min-h-screen bg-black px-4'>
        <motion.button
        initial={{ opacity:0 }}
        animate={{ opacity:1}}
        transition={{ duration: 1, delay: 4 }}
        onClick={() => router.push('/')}
        className=" w-30 mt-16 px-8 py-3  text-red rounded-lg shadow-lg hover:shadow-xl hover:scale-105 "
        >
        Return
        </motion.button>

    <motion.h1 initial={{ opacity: 0, x:-40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} 
    className='text-5xl font-extrabold text-white text-center mb-4 translate-y-40 translate-x-[-40%] underline-offset-10 underline decoration-red-500'
    >
        About
    </motion.h1>

    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}
    className='text-xl font-medium text-white translate-y-50 pr-100 translate-x-25 mb-8 '
    >
        SharpeOpt is a full stack app written by Akarsh Gopalam. It serves the purpose of optimizing a given portfolio of assets using the Sharpe Ratio. 
        The output of which are the weights, risk, and return of the optimized portfolio. In addition, the calculated Sharpe Ratio can be seen for those
        who wish to evaluate the performance of their investments. 

        SharpeOpt is written using NextJS, TypeScript and TailWindCSS on the frontend with ExpressJS, TypeScript on the backend. In addition, Python FastAPI
        is used to act as a micro-service for mathematical calculations and minimization. To further understand the product of SharpeOpt, visit its codebase found 
        Akarsh's GitHub. 
        
    </motion.p>

    

    <div className="flex items-center justify-center min-h-screen translate-y-[-20%] translate-x-[-5%]">
    <motion.button
        initial={{ opacity:0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2}}
        onClick={() => router.push('/Start')}
        className="w-30 mt-16 px-8 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 hover:shadow-xl hover:scale-105"
    >
        Enter
    </motion.button>
    </div>


    </div>
    
  )
}

export default HomePage; 
