import React from 'react'
import { UnifiedCard } from '../components/ui/unified'

const LandingPageDebug = () => {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Debug Page</h1>
      
      <UnifiedCard variant="default">
        <p>Se você vê este card, os componentes unificados estão funcionando!</p>
      </UnifiedCard>
    </div>
  )
}

export default LandingPageDebug