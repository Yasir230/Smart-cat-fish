'use client';

import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

// Dashboard Panels
import { DoMonitor } from '@/components/dashboard/do-monitor';
import { RiskAnalyzer } from '@/components/dashboard/risk-analyzer';
import { AeratorControl } from '@/components/dashboard/aerator-control';
import { DeviceStatus } from '@/components/dashboard/device-status';
import { AlertFeed } from '@/components/dashboard/alert-feed';
import { DataCharts } from '@/components/dashboard/data-charts';
import { ControlLog } from '@/components/dashboard/control-log';

// Hooks
import { useFirebase } from '@/hooks/use-firebase';
import { useRealtimeData } from '@/hooks/use-realtime-data';
import { useDeviceControl } from '@/hooks/use-device-control';
import { useAlerts } from '@/hooks/use-alerts';

export default function DashboardPage() {
  // Initialize Firebase and all hooks
  const { isConnected } = useFirebase();
  const { data: reading, history, isLoading: isDataLoading } = useRealtimeData();
  const { sendCommand, isRateLimited } = useDeviceControl();
  const { currentAlert, alertHistory, soundEnabled, toggleSound, isLoading: isAlertLoading } = useAlerts();

  const isLoading = isDataLoading || isAlertLoading;
  
  // Calculate unread alerts (simulated logic)
  const activeAlertCount = currentAlert?.active ? 1 : 0;

  return (
    <>
      <AnimatedBackground />
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header title="Dashboard" isConnected={isConnected} alertCount={activeAlertCount} />
        
        {/* Offline Banner */}
        {!isConnected && !isLoading && (
          <div className="bg-amber-500/20 border-b border-amber-500/50 px-6 py-2 flex items-center justify-center backdrop-blur-md">
            <span className="text-amber-400 text-sm font-medium text-center">
              Koneksi ke Firebase terputus. Menampilkan data terakhir atau mencoba menyambung kembali...
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Top row: 3 columns on desktop, 1 on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DoMonitor reading={reading} history={history} isLoading={isLoading} />
              <RiskAnalyzer reading={reading} history={history} isLoading={isLoading} />
              <AeratorControl 
                reading={reading} 
                history={history} 
                onCommand={sendCommand} 
                isRateLimited={isRateLimited} 
                isLoading={isLoading} 
              />
            </div>

            {/* Middle row: Charts taking 2 cols, Status taking 1 col */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DataCharts history={history} isLoading={isLoading} />
              <DeviceStatus reading={reading} history={history} isLoading={isLoading} />
            </div>

            {/* Bottom row: Alerts and Control Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertFeed 
                alert={currentAlert} 
                history={history} 
                soundEnabled={soundEnabled} 
                onToggleSound={toggleSound} 
                isLoading={isLoading} 
              />
              <ControlLog history={history} isLoading={isLoading} />
            </div>
            
          </motion.div>
        </div>
      </main>
      
      <MobileNav />
    </>
  );
}
