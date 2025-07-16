/**
 * 🎨 Templates Tab
 * 
 * Wrapper para o novo TemplatesManager
 */

import React from 'react'
import TemplatesManager from '../TemplatesManager'

interface TemplatesTabProps {
  mikrotikId: string
  mikrotikName: string
  session: any
  baseUrl: string
  headers: Record<string, string>
  onRefresh?: () => void
}

const TemplatesTab: React.FC<TemplatesTabProps> = (props) => {
  return <TemplatesManager {...props} />
}

export default TemplatesTab