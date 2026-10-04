import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatCurrency';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Package, Eye, EyeOff, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const COLORS_LIGHT = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];
const COLORS_DARK = ['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YEARS = [2024, 2025, 2026, 2027, 2028];

export function DashboardPage() {
  const { isDark } = useTheme();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [showMoney, setShowMoney] = useState(false);
  
  const [stats, setStats] = useState({ todaySales: 0, todayTrx: 0, monthlySales: 0, monthlyTrx: 0, prevMonthSales: 0, dailyAvg: 0 });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [cashSummary, setCashSummary] = useState({ totalIn: 0, totalOut: 0 });
  const [loading, setLoading] = useState(true);

  const displayMoney = useCallback((val) => showMoney ? formatCurrency(val) : 'Rp •••••••', [showMoney]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
      
      const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString();
      
      const monthStartObj = new Date(selectedYear, selectedMonth, 1);
      const monthEndObj = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      
      const prevMonthStartObj = new Date(selectedYear, selectedMonth - 1, 1);
      const prevMonthEndObj = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

      const monthStart = monthStartObj.toISOString();
      const monthEnd = monthEndObj.toISOString();
      const prevMonthStart = prevMonthStartObj.toISOString();
      const prevMonthEnd = prevMonthEndObj.toISOString();

      const dateStartStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const dateEndStr = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      const [todayRes, monthRes, prevMonthRes, itemsRes, cashRes] = await Promise.all([
        isCurrentMonth ? supabase.from('transactions').select('grand_total').gte('created_at', todayStart) : Promise.resolve({ data: [] }),
        supabase.from('transactions').select('grand_total, created_at').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('transactions').select('grand_total').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
        supabase.from('transaction_items').select('product_name, qty, subtotal').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('cash_flow').select('type, amount').gte('date', dateStartStr).lte('date', dateEndStr)
      ]);

      const todaySales = isCurrentMonth ? (todayRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0) : 0;
      const monthlySales = monthRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      const prevMonthSales = prevMonthRes.data?.reduce((s, t) => s + Number(t.grand_total), 0) || 0;
      
      const daysInMonth = monthEndObj.getDate();
      const dailyAvg = monthlySales / (isCurrentMonth ? currentDate.getDate() : daysInMonth);

      setStats({
        todaySales, 
        todayTrx: isCurrentMonth ? (todayRes.data?.length || 0) : 0,
        monthlySales, 
        monthlyTrx: monthRes.data?.length || 0,
        prevMonthSales,
        dailyAvg
      });

      const chartDataArr = [];
      for (let i = 1; i <= daysInMonth; i++) {
        if (isCurrentMonth && i > currentDate.getDate()) break;

        const d = new Date(selectedYear, selectedMonth, i);
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const dayStartStr = new Date(selectedYear, selectedMonth, i).toISOString();
        const dayEndStr = new Date(selectedYear, selectedMonth, i, 23, 59, 59, 999).toISOString();
        
        const dayTotal = monthRes.data?.filter(t => t.created_at >= dayStartStr && t.created_at <= dayEndStr)
          .reduce((s, t) => s + Number(t.grand_total), 0) || 0;
          
        chartDataArr.push({ label, total: dayTotal });
      }
      setChartData(chartDataArr);

      const productMap = {};
      itemsRes.data?.forEach(item => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
        productMap[item.product_name].qty += item.qty;
        productMap[item.product_name].revenue += Number(item.subtotal);
      });
      const sorted = Object.entries(productMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(sorted);

      const totalIn = cashRes.data?.filter(c => c.type === 'in').reduce((s, c) => s + Number(c.amount), 0) || 0;
      const totalOut = cashRes.data?.filter(c => c.type === 'out').reduce((s, c) => s + Number(c.amount), 0) || 0;
      setCashSummary({ totalIn, totalOut });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const growthPct = stats.prevMonthSales > 0
    ? ((stats.monthlySales - stats.prevMonthSales) / stats.prevMonthSales * 100).toFixed(1)
    : null;
  const isGrowthPositive = Number(growthPct) >= 0;
  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-lg text-xs">
          <p className="text-neutral-500 dark:text-neutral-400 mb-1 font-medium">{label}</p>
          <p className="font-bold text-neutral-900 dark:text-white font-mono">{displayMoney(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 antialiased">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Dashboard Analisis
            </h2>
            <button 
              onClick={() => setShowMoney(!showMoney)}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title={showMoney ? "Sembunyikan Nominal" : "Tampilkan Nominal"}
            >
              {showMoney ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Ringkasan pendapatan penjualan dan arus kas gerai
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs shadow-xs">
            <Calendar size={14} className="text-neutral-400" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-medium outline-none cursor-pointer text-neutral-800 dark:text-neutral-200"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i} className="bg-white dark:bg-neutral-900">{m}</option>
              ))}
            </select>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium outline-none cursor-pointer text-neutral-800 dark:text-neutral-200"
            >
              {YEARS.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-neutral-900">{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Hari Ini / Rata-rata */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4.5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500">
              {isCurrentMonth ? 'Penjualan Hari Ini' : 'Rata-rata Penjualan'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-semibold">
              {isCurrentMonth ? 'Live' : 'Avg'}
            </span>
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              {displayMoney(isCurrentMonth ? stats.todaySales : stats.dailyAvg)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              {isCurrentMonth ? `${stats.todayTrx} transaksi hari ini` : 'Estimasi per hari'}
            </p>
          </div>
        </div>

        {/* Card 2: Bulan Ini */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4.5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500">
              Total Bulan Ini
            </span>
            {growthPct !== null && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                isGrowthPositive 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              }`}>
                {isGrowthPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(growthPct)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              {displayMoney(stats.monthlySales)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              {stats.monthlyTrx} total transaksi tercatat
            </p>
          </div>
        </div>

        {/* Card 3: Kas Masuk */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4.5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500">Kas Masuk</span>
            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight size={13} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {displayMoney(cashSummary.totalIn)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Periode {MONTHS[selectedMonth]}
            </p>
          </div>
        </div>

        {/* Card 4: Kas Keluar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4.5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500">Kas Keluar</span>
            <div className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight size={13} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              {displayMoney(cashSummary.totalOut)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Biaya operasional & bahan
            </p>
          </div>
        </div>

      </div>

      {/* Main Chart Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
              Kurva Tren Penjualan Harian
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Grafik akumulasi transaksi per hari pada {MONTHS[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-neutral-400 text-xs">
            Belum ada rekaman penjualan pada periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#fafafa' : '#18181b'} stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="95%" stopColor={isDark ? '#fafafa' : '#18181b'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#a1a1aa' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke={isDark ? '#fafafa' : '#18181b'} 
                strokeWidth={2}
                fill="url(#salesGrad)" 
                dot={{ fill: isDark ? '#fafafa' : '#18181b', r: 2.5 }} 
                activeDot={{ r: 5 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Grid: Top Products & Cash Flow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Top Products */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                Produk Terlaris
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Top 5 item berdasarkan revenue penjualan</p>
            </div>
            <ShoppingBag size={16} className="text-neutral-400" />
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">Belum ada data produk terjual</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white truncate">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-neutral-900 dark:text-white font-mono block">
                      {displayMoney(p.revenue)}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {p.qty} porsi terjual
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cash Flow Summary */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                  Rekapitulasi Arus Kas
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Perbandingan kas masuk dan keluar bulan ini</p>
              </div>
              <Package size={16} className="text-neutral-400" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-neutral-500">Kas Masuk</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">{displayMoney(cashSummary.totalIn)}</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: cashSummary.totalIn + cashSummary.totalOut > 0
                      ? `${(cashSummary.totalIn / (cashSummary.totalIn + cashSummary.totalOut)) * 100}%` : '0%' }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-neutral-500">Kas Keluar</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{displayMoney(cashSummary.totalOut)}</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: cashSummary.totalIn + cashSummary.totalOut > 0
                      ? `${(cashSummary.totalOut / (cashSummary.totalIn + cashSummary.totalOut)) * 100}%` : '0%' }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Saldo Kas Bersih</span>
            <span className={`text-base font-bold font-mono ${
              cashSummary.totalIn - cashSummary.totalOut >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}>
              {displayMoney(cashSummary.totalIn - cashSummary.totalOut)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
