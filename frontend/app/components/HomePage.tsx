'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion'; 
import { useEffect } from 'react';

const Login = ({ onSwitch }: { onSwitch: () => void }) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const expressBackendUrl = 'https://asset-optimizer-1.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${expressBackendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('jwtToken', data.token);
      router.push('/Start');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      onSubmit={handleSubmit}
    >
      <h2 className="text-white text-2xl mb-4 text-center">Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-white text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        required
      />
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded shadow disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <p className="text-center text-gray-400 mt-4">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-red-600 hover:underline"
        >
          Register
        </button>
      </p>
    </motion.form>
  );
};

const Register = ({ onSwitch }: { onSwitch: () => void }) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const expressBackendUrl = 'https://asset-optimizer-1.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${expressBackendUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      onSubmit={handleSubmit}
    >
      <h2 className="text-white text-2xl mb-4 text-center">Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-white text-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-white text-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={passwordConfirm}
        onChange={e => setPasswordConfirm(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-white text-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        required
      />
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded shadow disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
      <p className="text-center text-gray-400 mt-4">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-red-600 hover:underline"
        >
          Login
        </button>
      </p>
    </motion.form>
  );
};

const HomePage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const fastapiurl = 'https://asset-optimizer.onrender.com';

  useEffect(() => {
    localStorage.removeItem('jwtToken'); // Clear token on page load so user has to log in again for security reasons 
    const ping = async () => {
      try {
        const response = await fetch(`${fastapiurl}/`);
        if (!response.ok) {
          throw new Error('Failed to ping FastAPI server');
        }
      } catch (error) {
        console.error('Error pinging FastAPI server:', error);
      }
    };
    ping();
  }, []);

  return (
    <div className='flex flex-col min-h-screen bg-black px-4 overflow-x-hidden'>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 4 }}
        onClick={() => router.push('/')}
        className="w-30 mt-16 px-8 py-3 text-red-500 rounded-lg hover:scale-105"
      >
        Return
      </motion.button>

      <div className="flex flex-col items-center justify-center ">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className='text-5xl font-extrabold text-white text-center mb-4 underline-offset-10 underline decoration-red-500'
        >
          About
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className='text-xl font-medium text-white mb-4 max-w-3xl text-center mt-4'
        >
          SharpeOpt is a multipurpose full stack app that serves the purpose of optimizing a given portfolio using Sharpe Ratio optimization. SharpeOpt provides other features such as viewing historical data of stocks, and finding the latest news related to the stock market.
          SharpeOpt is written using NextJS, TypeScript and TailWindCSS on the frontend with ExpressJS, TypeScript on the backend with Python FastAPI
          is used to act as a micro-service for mathematical calculations and minimization. MongoDB is used to store user data and historical stock data. To further understand SharpeOpt, visit its codebase.
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }} className="flex justify-center mt-4 mb-16">
        {isLogin ? (
          <Login onSwitch={() => setIsLogin(false)} />
        ) : (
          <Register onSwitch={() => setIsLogin(true)} />
        )}
      </motion.div>
    </div>
  );
};

export default HomePage;