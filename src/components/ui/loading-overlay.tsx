import { motion, AnimatePresence } from "framer-motion";
import { Loader2, BarChart3, Router, Activity } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export function LoadingOverlay({ isLoading, message = "Carregando...", progress }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-black/90 border border-gray-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm max-w-sm w-full mx-4"
          >
            {/* Logo e Ícones Animados */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* Círculo de background */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-2 border-blue-500/20 rounded-full"
                />
                
                {/* Círculo de progresso */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-blue-500 rounded-full"
                />
                
                {/* Ícone central */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </motion.div>
              </div>
            </div>

            {/* Ícones flutuantes */}
            <div className="relative mb-6 h-8">
              <motion.div
                animate={{ 
                  y: [-10, 10, -10],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0
                }}
                className="absolute left-4 top-0"
              >
                <Router className="w-4 h-4 text-orange-400" />
              </motion.div>
              
              <motion.div
                animate={{ 
                  y: [10, -10, 10],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0.7
                }}
                className="absolute right-4 top-0"
              >
                <Activity className="w-4 h-4 text-green-400" />
              </motion.div>
            </div>

            {/* Texto de loading */}
            <div className="text-center">
              <motion.h3
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-lg font-semibold text-white mb-2"
              >
                {message}
              </motion.h3>
              
              {/* Barra de progresso */}
              {typeof progress !== 'undefined' && (
                <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                  />
                </div>
              )}
              
              {/* Pontos animados */}
              <div className="flex items-center justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente de loading para páginas inteiras
export function PageLoadingOverlay({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-black via-gray-900 to-black"
        >
          <div className="flex items-center justify-center min-h-screen">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              {/* Logo */}
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-8"
              >
                <img 
                  src="/img/logo-white.png" 
                  alt="MikroPix" 
                  className="h-16 w-auto mx-auto drop-shadow-2xl" 
                />
              </motion.div>

              {/* Nome da aplicação */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
              >
                MikroPix
              </motion.h1>

              {/* Subtítulo */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-gray-400 mb-8 text-lg"
              >
                Carregando sua dashboard...
              </motion.p>

              {/* Indicador de progresso */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.6, duration: 2, ease: "easeInOut" }}
                className="w-64 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 rounded-full mx-auto mb-6"
              />

              {/* Estatísticas em movimento */}
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                {[
                  { icon: BarChart3, label: "Dashboard", color: "text-blue-400" },
                  { icon: Router, label: "MikroTiks", color: "text-orange-400" },
                  { icon: Activity, label: "Estatísticas", color: "text-green-400" }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ 
                        y: [-5, 5, -5],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                      className={`${item.color} mb-2 flex justify-center`}
                    >
                      <item.icon className="w-6 h-6" />
                    </motion.div>
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}