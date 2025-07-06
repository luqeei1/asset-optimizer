'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Article {
  uuid: string
  title: string
  description: string
  url: string
}

const News = () => {
  const [articles, setArticles] = useState<Article[]>([])

  const fetchNews = async (page: number) => {
    try {
      const response = await fetch('http://localhost:5000/news?page=' + page, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Could not fetch news')
      }

      const data = await response.json()
      console.log('News:', data)
      setArticles(data.results || [])
    } catch (error: any) {
      console.error('Error fetching news:', error)
    }
  }

  useEffect(() => {
    fetchNews(1)
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-start justify-start p-8 px-4"
      >
        <h1 className="text-white text-4xl underline decoration-red-500 font-extrabold pt-4">
          News
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-col items-start justify-start px-4"
      >
        <p className="text-white pt-4">
          Find the latest news articles and updates. Learn more about your
          investments and market trends and ensure you stay informed about <br />
          the latest developments in the financial world and make smart
          investing decisions!
        </p>
      </motion.div>

      <div className="flex flex-col items-center justify-center p-8 px-4">
        <p className="text-white text-3xl font-bold pt-10 underline decoration-red-500">
          Latest Articles
        </p>
        <p className="text-white text-lg pt-2">
          Click on the article to read more
        </p>

        <div className="flex flex-col items-center justify-center pt-4 gap-4">
          {articles.length === 0 ? (
            <p className="text-gray-400">No articles found.</p>
          ) : (
            articles.map((article, i) => (
              <motion.div
                key={article.uuid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-2xl"
              >
                <h2 className="text-white text-xl font-semibold">
                  {article.title}
                </h2>
                <p className="text-gray-400 mt-2">
                  {article.description?.slice(0, 200) || 'No description.'}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 mt-4 inline-block hover:underline"
                >
                  Read More
                </a>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default News
