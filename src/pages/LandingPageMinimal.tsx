import React from 'react'
import { Link } from 'react-router-dom'
import { Wifi, User, Sparkles } from 'lucide-react'

const LandingPageMinimal = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-gray-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MikroPix
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <button className="text-white hover:text-blue-400 px-4 py-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Entrar
                </button>
              </Link>
              <Link to="/register">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Testar Grátis
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Controle Seu MikroTik De Qualquer Lugar
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Sistema completo para gerenciar seus equipamentos MikroTik remotamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg">
                Testar Por 7 Dias
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPageMinimal