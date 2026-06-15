import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Live data
  btcPrice:    null,
  btcChange:   null,
  fearGreed:   { value: 72, label: 'Greed' },
  lastUpdated: null,

  // Portfolio
  btcAmount: 0.1,
  setBtcAmount: (v) => set({ btcAmount: v }),

  // Sell ladder
  sellLadder: [
    { pct: 25, price: 150000, triggered: false },
    { pct: 25, price: 200000, triggered: false },
    { pct: 25, price: 275000, triggered: false },
    { pct: 25, price: 340000, triggered: false },
  ],

  // Alerts
  alerts: [
    { id: 1, icon: '🎯', title: 'ATH Zone (Day 1000+)',    desc: 'Top warning window opens', active: true },
    { id: 2, icon: '📈', title: 'Cycle Score > 85',        desc: 'Extreme greed — exit signal', active: true },
    { id: 3, icon: '🟢', title: 'Pi Cycle Top Triggered',  desc: 'Historical ATH indicator', active: true },
    { id: 4, icon: '💰', title: 'Bear Bottom Zone',        desc: 'Stealth buy zone (Arc 2 Day 280+)', active: false },
    { id: 5, icon: '🐋', title: 'Whale Exchange Inflow',   desc: 'Sell pressure signal', active: false },
    { id: 6, icon: '📉', title: 'Price Below $100K',       desc: 'Key support broken', active: false },
  ],
  toggleAlert: (id) => set(s => ({
    alerts: s.alerts.map(a => a.id === id ? { ...a, active: !a.active } : a)
  })),

  // Autopilot
  autopilot: false,
  riskProfile: 'balanced',
  setAutopilot: (v) => set({ autopilot: v }),
  setRiskProfile: (v) => set({ riskProfile: v }),

  // Update from API
  updatePrice: (data) => set({
    btcPrice: data.price,
    btcChange: data.change24h,
    lastUpdated: new Date(),
  }),
  updateFearGreed: (data) => set({ fearGreed: data }),
}));
