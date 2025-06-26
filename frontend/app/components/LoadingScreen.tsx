'use client'

import React from 'react'
import { motion } from 'framer-motion' // fixed incorrect import path

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-5xl font-extrabold text-white text-center mb-4"
      >
        Welcome to SharpeOpt
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="text-xl font-medium text-red-500 text-center mb-8 italic"
      >
        A portfolio optimizer powered by the Sharpe Ratio
      </motion.p>

      <motion.a
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
        href="/Home"
        className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-200 translate-y-[70px] animate-bounce"
      >
        Click to View Page
      </motion.a>
    </div>
  )
}

export default LoadingScreen
