'use client'

import { motion } from 'framer-motion'
import { Navbar } from './Navbar'
import { SessionWarning } from './SessionWarning'
import { RealtimeTracker } from '@/components/ui/RealtimeTracker'
import { ToastContainer } from '@/components/ui/Toast'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <Navbar />
      <motion.main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className ?? ''}`}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
      <SessionWarning />
      <RealtimeTracker />
      <ToastContainer />
    </div>
  )
}
