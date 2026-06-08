'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, BrainCircuit, Droplets, Bell, ArrowRight } from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function LandingPage() {
  const features = [
    {
      icon: Activity,
      title: "Real-time Monitoring",
      desc: "Pantau Dissolved Oxygen (DO), suhu, dan level air secara real-time dari mana saja."
    },
    {
      icon: BrainCircuit,
      title: "Edge AI Prediction",
      desc: "Prediksi tingkat DO akurat tanpa sensor elektrokimia mahal menggunakan model TensorFlow Lite."
    },
    {
      icon: Droplets,
      title: "Auto Aerator",
      desc: "Kontrol aerator otomatis yang responsif terhadap risiko penurunan oksigen terlarut."
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      desc: "Sistem notifikasi dini saat parameter kolam memasuki zona kritis."
    }
  ];

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-20">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <div className="z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Powered by Edge AI & ESP32</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-sky-200 to-teal-400 mb-6 drop-shadow-lg"
        >
          Smart Catfish Dashboard
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-sky-100/70 mb-12 font-light leading-relaxed"
        >
          Platform pemantauan risiko Dissolved Oxygen untuk budidaya lele berbiaya rendah dengan inferensi Edge AI secara langsung tanpa sensor elektrokimia.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link 
            href="/dashboard"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:shadow-[0_0_40px_rgba(14,165,233,0.5)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span>Buka Dashboard</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="z-10 w-full max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature, index) => (
          <div 
            key={index}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Footer / Citation */}
      <div className="z-10 mt-auto pt-20 text-center">
        <p className="text-xs text-white/40 max-w-3xl mx-auto italic">
          Berdasarkan riset: &quot;Pemantauan Risiko Dissolved Oxygen Berbasis Edge AI Tanpa Sensor Elektrokimia dengan Aerator Otomatis untuk Budidaya Lele Berbiaya Rendah&quot;
        </p>
      </div>
    </main>
  );
}
