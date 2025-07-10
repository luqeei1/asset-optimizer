'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiExternalLink, FiClock, FiTrendingUp, FiBookmark, FiSearch } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import NavBar from './NavBar'

interface Article {
  uuid: string
  title: string
  description: string
  url: string
  published_at?: string
  source?: string
}





const News = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchNews = async (page: number, query: string = '') => {
    setIsLoading(true)
    try {
      const url = `http://localhost:5000/news?page=${page}${query ? `&query=${query}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Could not fetch news')
      }

      const data = await response.json()
      setArticles(data.results || [])
    } catch (error: any) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoading(false)
    }
  }

 
  useEffect(() => {
    fetchNews(currentPage, searchQuery)
  }, [currentPage, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNews(1, searchQuery)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center"
          >
           
           
          </motion.div>
        </div>
      </header>
      <section className="bg-gradient-to-r from-gray-900 to-black py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Stay Ahead with <span className="text-red-500">Real-Time</span> Financial News
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mb-8">
              Get the latest market updates, stock analysis, and economic trends to make informed investment decisions.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <section>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold">
              <span className="text-red-500">Latest</span> Financial News
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-xl">No articles found.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <motion.article
                  key={article.uuid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {article.source || 'Unknown Source'}
                      </span>
                      <button className="text-gray-400 hover:text-red-500 transition">
                        <FiBookmark />
                      </button>
                    </div>
                    <h4 className="text-xl font-bold mb-3 line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {article.description || 'No description available.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 flex items-center">
                        <FiClock className="mr-1" />
                        {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Unknown date'}
                      </span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 text-sm flex items-center transition"
                      >
                        Read full story <FiExternalLink className="ml-1" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </main>

      
      
    </div>
  )
}

export default News