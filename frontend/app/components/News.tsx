'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiExternalLink, FiClock, FiArrowLeft } from 'react-icons/fi'
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
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const expressBackendUrl = 'https://asset-optimizer-1.onrender.com';
  const articlesPerPage = 3
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        router.push('/Home');
      } 
    }
  }, [router]);

  const fetchNews = async (query: string = '') => {
    setIsLoading(true)
    try {
      const url = `${expressBackendUrl}/news?page=1&limit=50${query ? `&query=${query}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Could not fetch news')

      const data = await response.json()
      setAllArticles(data.results || [])
      setCurrentPage(1) 
    } catch (error: any) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage
    const endIndex = startIndex + articlesPerPage
    return allArticles.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(allArticles.length / articlesPerPage)

  useEffect(() => {
    fetchNews(searchQuery)
  }, [])

  const handlePrevious = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const handleNext = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))

  const currentArticles = getCurrentPageArticles()

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <NavBar />

        <div className="text-center mt-12 mb-12">
          <h1 className="text-4xl font-extrabold underline decoration-red-500">
            Financial <span className="text-red-500">News</span>
          </h1>
          <p className="text-gray-400 mt-4">Stay updated with the latest market trends</p>
        </div>

        {/* News Content */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Latest Articles</h3>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages} ({allArticles.length} articles)
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition text-sm"
                >
                  Previous
                </button>
                <button 
                  onClick={handleNext}
                  disabled={currentPage >= totalPages || isLoading}
                  className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : currentArticles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No articles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {currentArticles.map((article, i) => (
                <motion.article
                  key={`${article.uuid}-${currentPage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {article.source || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <FiClock className="mr-1" />
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-2 line-clamp-2 text-white">
                    {article.title}
                  </h4>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {article.description || 'No description available.'}
                  </p>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:text-red-400 text-sm flex items-center transition"
                  >
                    Read more <FiExternalLink className="ml-1" />
                  </a>
                </motion.article>
              ))}
            </div>
          )}

          {/* Quick Page Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-1 rounded text-sm transition ${
                    currentPage === pageNum 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="text-gray-400 text-sm">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-2 py-1 rounded text-sm transition ${
                      currentPage === totalPages 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default News