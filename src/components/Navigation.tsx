import React from 'react';
import { Home, Wrench, Smartphone, Wallet, Package, BarChart3 } from 'lucide-react';

export type TabType = 'dashboard' | 'servis' | 'jual_beli' | 'kas' | 'stok' | 'laporan';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  servisAktifCount?: number;
  jualBeliStokCount?: number;
  stokKritisCount?: number;
}

export const Navigation: React.FC<Props> = ({ 
  activeTab, 
  onChangeTab,
  servisAktifCount = 0,
  jualBeliStokCount = 0,
  stokKritisCount = 0
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Home },
    { id: 'servis' as TabType, label: 'Servis', icon: Wrench, badge: servisAktifCount },
    { id: 'jual_beli' as TabType, label: 'Jual Beli', icon: Smartphone, badge: jualBeliStokCount, badgeColor: 'bg-emerald-500' },
    { id: 'kas' as TabType, label: 'Kas', icon: Wallet },
    { id: 'stok' as TabType, label: 'Stok Sp', icon: Package, badge: stokKritisCount, badgeColor: 'bg-rose-500' },
    { id: 'laporan' as TabType, label: 'Laporan', icon: BarChart3 }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-1.5 px-2 md:py-2 md:px-6 shadow-2xl no-print">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition duration-150 ${
                isActive 
                  ? 'text-cyan-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className={`absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full text-white ${tab.badgeColor || 'bg-cyan-500'} ring-2 ring-slate-900`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
