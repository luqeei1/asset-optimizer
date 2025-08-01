import React from 'react'

const NavBar = () => {
  return (
    <div>
        <nav className="bg-black border-b border-gray-800">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <a href="/" className="text-white text-lg font-bold">SharpeOpt</a>
                <div className="space-x-4">
                    <a href="/Home" onClick={() => { localStorage.removeItem('jwtToken'); }} className="text-gray-300 hover:text-white">Sign Out</a>
                    <a href="/news" className="text-gray-300 hover:text-white">News</a>
                    <a href="/Start" className="text-gray-300 hover:text-white">Optimizer</a>
                    <a href="/historical" className="text-gray-300 hover:text-white">Historical</a>
                </div>
            </div>
        </nav>
    </div>
  )
}

export default NavBar
