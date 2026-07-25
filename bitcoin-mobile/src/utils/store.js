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

  // Sell ladder (targets the next cycle ATH, ~Sep 2029)
  sellLadder: [
    { pct: 25, price: 250000, triggered: false },
    { pct: 25, price: 400000, triggered: false },
    { pct: 25, price: 550000, triggered: false },
    { pct: 25, price: 700000, triggered: false },
  ],

  // Alerts
  alerts: [
    { id: 1, icon: '🎯', title: 'Bottom Zone Alert',       desc: 'Stealth Bottom phase entered', active: true },
    { id: 2, icon: '📈', title: 'Cycle Score > 85',        desc: 'Extreme greed — exit signal', active: true },
    { id: 3, icon: '🟢', title: 'Pi Cycle Top Triggered',  desc: 'Historical ATH indicator', active: true },
    { id: 4, icon: '💰', title: 'Cycle Score < 20',        desc: 'Despair DCA window opens', active: false },
    { id: 5, icon: '🐋', title: 'Whale Accumulation',      desc: 'Large wallets buying the dip', active: false },
    { id: 6, icon: '📉', title: 'Price Below $50K',        desc: 'Key support broken', active: false },
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
