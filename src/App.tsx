/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  Calculator,
  Percent,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
type TransactionType = 'income' | 'expense';
type TransactionCategory = 'Logo' | 'Layout' | 'Poster' | 'Website' | 'Other';

interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  party: string;
  category: TransactionCategory;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounting' | 'history'>('dashboard');
  const [showQuickCalc, setShowQuickCalc] = useState(false);
  const [calcInput, setCalcInput] = useState<string>('');

  // Persistence State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [taxRate, setTaxRate] = useState<number>(3); // Default 3%

  // Load Data
  useEffect(() => {
    const savedData = localStorage.getItem('zharqyn_transactions');
    if (savedData) setTransactions(JSON.parse(savedData));
    
    const savedTax = localStorage.getItem('zharqyn_tax_rate');
    if (savedTax) setTaxRate(Number(savedTax));
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('zharqyn_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('zharqyn_tax_rate', taxRate.toString());
  }, [taxRate]);

  // Calculations
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const turnover = totalIncome + totalExpense;
    const taxReserve = totalIncome * (taxRate / 100);
    const netIncome = totalIncome - taxReserve;

    return {
      income: totalIncome,
      expense: totalExpense,
      turnover,
      taxReserve,
      netIncome,
      investment: netIncome * 0.5,
      agency: netIncome * 0.3,
      personal: netIncome * 0.2
    };
  }, [transactions, taxRate]);

  // Chart Data
  const chartData = useMemo(() => {
    // Group by date
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'dd.MM');
    }).reverse();

    const dailyIncome = last7Days.map(date => {
      return transactions
        .filter(t => t.type === 'income' && format(new Date(t.date), 'dd.MM') === date)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      labels: last7Days,
      datasets: [
        {
          fill: true,
          label: 'Доходы (₸)',
          data: dailyIncome,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(5, 5, 11, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  // Action: Add Transaction
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions([newTransaction, ...transactions]);
    setActiveTab('dashboard');
  };

  // Action: Delete
  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen w-full flex flex-col pt-6 pb-24 px-4 max-w-lg mx-auto">
      
      {/* Header */}
      <header className="mb-8 flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold platinum-gradient">Zharqyn Ledger</h1>
          <p className="text-white/40 text-sm">v3.0 Premium Edition</p>
        </div>
        <button 
          onClick={() => setShowQuickCalc(true)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        >
            <Calculator className="w-5 h-5 text-white/60" />
        </button>
      </header>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.3, staggerChildren: 0.1 }}
              className="space-y-6 overflow-y-auto no-scrollbar max-h-full"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4">
                <div className="glass-card p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">Общий Оборот</p>
                    <h2 className="text-4xl font-bold tracking-tight mb-4">
                      {stats.turnover.toLocaleString()} <span className="text-lg font-normal opacity-50">₸</span>
                    </h2>
                    
                    <div className="flex gap-6">
                      <div>
                        <p className="text-green-400 text-xs flex items-center gap-1 mb-0.5">
                          <TrendingUp className="w-3 h-3" /> Доход
                        </p>
                        <p className="text-lg font-semibold">{stats.income.toLocaleString()} ₸</p>
                      </div>
                      <div className="w-[1px] h-10 bg-white/5" />
                      <div>
                        <p className="text-red-400 text-xs flex items-center gap-1 mb-0.5">
                          <TrendingDown className="w-3 h-3" /> Расход
                        </p>
                        <p className="text-lg font-semibold">{stats.expense.toLocaleString()} ₸</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Background Graph */}
                  <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mt-12">
                    <Line data={chartData} options={chartOptions} height={120} />
                  </div>
                </div>
              </div>

              {/* 50/30/20 Module */}
              <section className="space-y-3">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-sm font-semibold text-white/60">Модель 50/30/20</h3>
                   <div className="flex items-center gap-2 glass-card px-2 py-1">
                      <Percent className="w-3 h-3 text-white/50" />
                      <input 
                        type="number" 
                        value={taxRate} 
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="bg-transparent border-none outline-none text-xs w-8 text-center font-bold"
                      />
                      <span className="text-[10px] text-white/40 uppercase font-bold">Налог</span>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   {[
                     { label: '50% Капитал', val: stats.investment, color: 'from-blue-500/20' },
                     { label: '30% Агентство', val: stats.agency, color: 'from-purple-500/20' },
                     { label: '20% Личное', val: stats.personal, color: 'from-amber-500/20' }
                   ].map((item) => (
                     <div key={item.label} className={cn("glass-card p-3 bg-gradient-to-br to-transparent", item.color)}>
                        <p className="text-[10px] uppercase text-white/40 font-bold mb-1">{item.label}</p>
                        <p className="text-sm font-bold truncate">{Math.floor(item.val).toLocaleString()} ₸</p>
                     </div>
                   ))}
                </div>

                <div className="glass-card p-4 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Calculator className="w-5 h-5 text-orange-400" />
                       </div>
                       <div>
                          <p className="text-[10px] uppercase text-white/40 font-bold">Резерв Налогов ({taxRate}%)</p>
                          <p className="text-base font-bold">{Math.floor(stats.taxReserve).toLocaleString()} ₸</p>
                       </div>
                    </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'accounting' && (
            <motion.div
              key="accounting"
              initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-white/80" /> Новая Запись
              </h2>
              
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addTransaction({
                  type: formData.get('type') as TransactionType,
                  date: formData.get('date') as string,
                  amount: Number(formData.get('amount')),
                  party: formData.get('party') as string,
                  category: formData.get('category') as TransactionCategory
                });
              }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Тип</label>
                    <select name="type" className="glass-card bg-transparent px-4 py-3 outline-none text-sm border-none appearance-none">
                      <option value="income" className="bg-obsidian">Доход (+)</option>
                      <option value="expense" className="bg-obsidian">Расход (-)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Дата</label>
                    <input name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="glass-card bg-transparent px-4 py-3 outline-none text-sm border-none" required />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Сумма (₸)</label>
                  <input name="amount" type="number" placeholder="0" className="glass-card bg-transparent px-4 py-3 outline-none text-lg font-bold border-none" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">От кого / Кому</label>
                  <input name="party" type="text" placeholder="Имя или Компания" className="glass-card bg-transparent px-4 py-3 outline-none text-sm border-none" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Услуга / Категория</label>
                  <select name="category" className="glass-card bg-transparent px-4 py-3 outline-none text-sm border-none appearance-none">
                    <option value="Logo" className="bg-obsidian">Лого</option>
                    <option value="Layout" className="bg-obsidian">Макет</option>
                    <option value="Poster" className="bg-obsidian">Постер</option>
                    <option value="Website" className="bg-obsidian">Сайт</option>
                    <option value="Other" className="bg-obsidian">Прочее</option>
                  </select>
                </div>

                <button type="submit" className="w-full mt-4 py-4 bg-white text-obsidian font-bold rounded-xl active:scale-95 transition-transform">
                  Записать в Ledger
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              className="space-y-4 overflow-y-auto no-scrollbar max-h-full pb-10"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between px-2">
                <span>История Операций</span>
                <span className="text-xs font-normal text-white/40">{transactions.length} записей</span>
              </h2>

              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <div className="glass-card p-12 text-center text-white/20">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>Тут пока пусто...</p>
                  </div>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="glass-card p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          t.type === 'income' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <p className="font-bold">{t.amount.toLocaleString()} ₸</p>
                              <span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/5 rounded-md text-white/60 font-bold">{t.category}</span>
                           </div>
                           <p className="text-xs text-white/40">{t.party} • {format(new Date(t.date), 'dd MMM')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* iOS Tab Bar */}
      <nav className="ios-tab-bar">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn("nav-item", activeTab === 'dashboard' && "active")}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">Дашборд</span>
        </button>
        <button 
          onClick={() => setActiveTab('accounting')}
          className={cn("nav-item", activeTab === 'accounting' && "active")}
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold">Учет</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("nav-item", activeTab === 'history' && "active")}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold">История</span>
        </button>
      </nav>
      {/* Quick Calc Modal */}
      <AnimatePresence>
        {showQuickCalc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={() => setShowQuickCalc(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-sm p-6 relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calculator className="w-5 h-5" /> Калькулятор 50/30/20
                </h2>
                <button onClick={() => setShowQuickCalc(false)} className="text-white/40">Закрыть</button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Введите сумму (₸)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    autoFocus
                    className="glass-card bg-transparent px-4 py-4 outline-none text-2xl font-bold border-none w-full" 
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                   {[
                     { label: '50% Капитал (Инвестиции)', val: Number(calcInput) * 0.5, color: 'text-blue-400' },
                     { label: '30% Расходы Агентства', val: Number(calcInput) * 0.3, color: 'text-purple-400' },
                     { label: '20% Личные (На чилл)', val: Number(calcInput) * 0.2, color: 'text-amber-400' }
                   ].map((item) => (
                     <div key={item.label} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03]">
                        <span className="text-xs text-white/50">{item.label}</span>
                        <span className={cn("font-bold", item.color)}>{Math.floor(item.val).toLocaleString()} ₸</span>
                     </div>
                   ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                   <div className="flex justify-between items-center p-3 rounded-xl bg-orange-500/5">
                      <span className="text-xs text-orange-400/70 font-bold uppercase">Налог ({taxRate}%)</span>
                      <span className="font-bold text-orange-400">{Math.floor(Number(calcInput) * (taxRate/100)).toLocaleString()} ₸</span>
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
