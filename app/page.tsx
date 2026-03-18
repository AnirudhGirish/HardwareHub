'use client'

import Link from 'next/link'
import React from 'react'
import { motion, Variants, useMotionValue, useMotionTemplate } from 'framer-motion'
import { ToastContainer } from '@/components/ui/Toast'
import { Laptop, Key, FileCheck, ClipboardList, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

export default function LandingPage() {
  const year = new Date().getFullYear()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  }

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans selection:bg-zinc-200 selection:text-zinc-900">
      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]/50"
      >
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-zinc-600 to-gray-800 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                  <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.7" />
                  <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.7" />
                  <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-[#0A0A0A] text-lg">Hardware Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#2D2D2D] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section 
        className="relative pt-24 pb-32 overflow-hidden flex-1 flex flex-col justify-center group"
        onMouseMove={handleMouseMove}
      >
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        {/* Spotlight Hover Effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                600px circle at ${mouseX}px ${mouseY}px,
                rgba(0, 0, 0, 0.04),
                transparent 80%
              )
            `,
          }}
        />

        {/* Corner Accents */}
        <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-zinc-300 opacity-60"></div>
        <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-zinc-300 opacity-60"></div>
        <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-zinc-300 opacity-60"></div>
        <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-zinc-300 opacity-60"></div>

        {/* Abstract background shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-300/30 rounded-full blur-3xl mix-blend-multiply animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-zinc-200/30 rounded-full blur-3xl mix-blend-multiply animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeIn} className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200 border-zinc-500 text-black text-xs font-semibold tracking-wide uppercase">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-300"></span>
                MBRDI Internal Tool
              </span>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0A0A0A] leading-[1.1] mb-8">
              Know what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-800">own</span>.<br/>
              Track what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-800">lend</span>.
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg sm:text-xl text-[#6B6B6B] leading-relaxed mb-10 max-w-2xl px-4">
              Hardware Hub is the single source of truth for MBRDI. Track hardware assets, manage software licenses, and streamline cross-team lending without the spreadsheets.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-all hover:shadow-lg hover:shadow-zinc-600/20 hover:-translate-y-0.5"
              >
                Register your account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white border border-[#E5E5E5] text-[#0A0A0A] font-medium hover:bg-[#FAFAFA] hover:border-[#D1D1D1] transition-all shadow-sm"
              >
                Sign in to dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities / Feature cards */}
      <section className="bg-white border-y border-[#E5E5E5] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] mb-4">Everything you need, nothing you don&apos;t.</h2>
            <p className="text-[#6B6B6B] text-lg">Built specifically for the rigorous demands of engineering teams handling high-value assets and strict compliance.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Laptop className="w-6 h-6 text-zinc-700" />,
                title: 'Hardware Tracking',
                desc: 'Laptops, test benches, and specialized lab equipment—fully accounted for and searchable by serial number.',
              },
              {
                icon: <Key className="w-6 h-6 text-zinc-700" />,
                title: 'Licence Management',
                desc: 'Prevent unused software subscriptions. Track floating and fixed licences alongside physical hardware.',
              },
              {
                icon: <FileCheck className="w-6 h-6 text-zinc-700" />,
                title: 'Frictionless Lending',
                desc: 'Need a testing device for two weeks? Request it directly from the owner. Approvals take one click.',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="group bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-8 hover:bg-white hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-900/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-zinc-200 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#0A0A0A] mb-3">{card.title}</h3>
                <p className="text-[#6B6B6B] leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] mb-4">A simple, transparent workflow.</h2>
            <p className="text-[#6B6B6B] text-lg max-w-2xl">From onboarding to asset return, every step is designed to reduce friction and eliminate ambiguity.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          >
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent"></div>

            {[
              { step: '01', title: 'Register & Verify', desc: 'Sign up using your MBRDI email. Provide your Employee ID, department, and team to establish your permissions.' },
              { step: '02', title: 'Discover & Request', desc: 'Search the global catalogue or filter by specific teams. Found what you need? Submit a request with a single click.' },
              { step: '03', title: 'Utilise & Return', desc: 'Once approved, pick up the asset. The system tracks your loan duration and reminds you when it\'s time to return it.' },
            ].map((step, idx) => (
              <motion.div key={step.step} variants={fadeIn} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-white border-2 border-zinc-200 text-zinc-700 flex items-center justify-center text-lg font-bold mb-6 shadow-sm">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-[#0A0A0A] mb-3">{step.title}</h3>
                <p className="text-[#6B6B6B] leading-relaxed max-w-sm">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-[#0A0A0A] overflow-hidden p-10 sm:p-16 text-center relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Ready to streamline your inventory?</h2>
              <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                Join the engineering teams at MBRDI already using Hardware Hub to eliminate asset loss and optimize their resource allocation.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-medium hover:bg-zinc-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-zinc-900/40"
              >
                Create your account today
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#0A0A0A] font-semibold">
            <div className="h-6 w-6 rounded bg-[#1A1A1A] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
              </svg>
            </div>
            Hardware Hub
          </div>
          <p className="text-sm text-[#8B8B8B]">
            © {year} Mercedes-Benz Research and Development India.
          </p>
        </div>
      </footer>
      <ToastContainer />
    </div>
  )
}
