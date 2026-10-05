'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus, X, Trash2, Download, Upload, CreditCard, PiggyBank, Banknote, Mic, MicOff } from 'lucide-react';

type Account = { id: number; name: string; type: 'cash' | 'virtual' | 'investment'; balance: number };
type Transaction = { id: number; accountId: number; title: string; amount: number; type: 'income' | 'expense'; date: string; category?: string }; 
type Debt = { id: number; person: string; amount: number; direction: 'i_owe' | 'owed_to_me' };
type Habit = { id: number; name: string; type: 'good' | 'bad'; dailyImpact: number; completedToday: boolean };

type VoiceMode = 'off' | 'waiting' | 'command';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'transaction' | 'account' | 'debt' | 'habit'>('transaction');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [lastCommand, setLastCommand] = useState('');

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const voiceModeRef = useRef<VoiceMode>('off');

  // Синхронизируем ref с state
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  const defaultAccounts: Account[] = [
    { id: 1, name: 'Наличные', type: 'cash', balance: 0 },
    { id: 2, name: 'Карта Сбер', type: 'virtual', balance: 0 },
    { id: 3, name: 'Инвестиции', type: 'investment', balance: 0 }
  ];

  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const load = (key: string, defaults: any) => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaults;
      }
      return defaults;
    };
    setAccounts(load('uspex_accounts', defaultAccounts));
    setTransactions(load('uspex_transactions', []));
    setDebts(load('uspex_debts', []));
    setHabits(load('uspex_habits', []));
  }, []);

  useEffect(() => { if (isMounted) localStorage.setItem('uspex_accounts', JSON.stringify(accounts)); }, [accounts, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('uspex_transactions', JSON.stringify(transactions)); }, [transactions, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('uspex_debts', JSON.stringify(debts)); }, [debts, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem('uspex_habits', JSON.stringify(habits)); }, [habits, isMounted]);

  // === РЕГИСТРАЦИЯ SERVICE WORKER (НОВОЕ) ===
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  const [txAccountId, setTxAccountId] = useState(accounts[0]?.id || 0);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDir, setDebtDir] = useState<'i_owe' | 'owed_to_me'>('i_owe');
  const [habitName, setHabitName] = useState('');
  const [habitImpact, setHabitImpact] = useState('');
  const [habitType, setHabitType] = useState<'good' | 'bad'>('bad');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'cash' | 'virtual' | 'investment'>('cash');
  const [accBalance, setAccBalance] = useState('');

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const cashBalance = accounts.filter(a => a.type === 'cash').reduce((s, a) => s + a.balance, 0);
  const virtualBalance = accounts.filter(a => a.type === 'virtual').reduce((s, a) => s + a.balance, 0);
  const investmentBalance = accounts.filter(a => a.type === 'investment').reduce((s, a) => s + a.balance, 0);
  const owedToMe = debts.filter(d => d.direction === 'owed_to_me').reduce((s, d) => s + d.amount, 0);
  const iOwe = debts.filter(d => d.direction === 'i_owe').reduce((s, d) => s + d.amount, 0);
  const lostToHabits = habits.filter(h => h.type === 'bad' && h.completedToday).reduce((s, h) => s + h.dailyImpact, 0);
  const savedByHabits = habits.filter(h => h.type === 'good' && h.completedToday).reduce((s, h) => s + h.dailyImpact, 0);

  // === ЗВУК АКТИВАЦИИ (как у Алисы — два приятных тона) ===
  const playActivationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.frequency.value = 880;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.value = 1174;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }, []);

  // === ЗВУК УСПЕХА (после добавления операции) ===
  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch (e) {}
  }, []);

  // === ЗВУК ОШИБКИ ===
  const playErrorSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 200;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, []);

  const vibrate = (pattern: number | number[]) => { if (navigator.vibrate) navigator.vibrate(pattern); };

  // === ПАРСЕР КОМАНД ===
  const parseVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    let amount = 0;
    let type: 'income' | 'expense' = 'expense';
    let title = text;
    let accountId = accounts[0]?.id || 1;
    let category = 'Другое';

    const amountMatch = lower.match(/(\d+[\s.,]?\d*)\s*(тысяч|тыс|млн|миллион|руб|рубл)?/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/[.,\s]/g, '').replace(',', '.'));
      if (amountMatch[2]) {
        if (amountMatch[2].startsWith('тыс')) amount *= 1000;
        if (amountMatch[2].startsWith('млн') || amountMatch[2].startsWith('мил')) amount *= 1000000;
      }
    }

    const incomeWords = ['получил', 'зарплата', 'пришло', 'перевели', 'пришла', 'доход', 'заработал'];
    if (incomeWords.some(w => lower.includes(w))) type = 'income';

    if (lower.includes('налич') || lower.includes('налом')) accountId = accounts.find(a => a.type === 'cash')?.id || 1;
    else if (lower.includes('инвестиц') || lower.includes('брокер')) accountId = accounts.find(a => a.type === 'investment')?.id || 1;
    else if (lower.includes('карт') || lower.includes('сбер') || lower.includes('тинькофф')) accountId = accounts.find(a => a.type === 'virtual')?.id || 1;

    const categoryMap: Record<string, string[]> = {
      'Продукты': ['пятёрочка', 'пятерочка', 'магнит', 'перекрёсток', 'перекресток', 'лента', 'дикси', 'вкусвилл'],
      'Транспорт': ['такси', 'метро', 'бензин', 'авто', 'транспорт'],
      'Рестораны': ['кафе', 'ресторан', 'кофе', 'старбакс', 'шоколадница', 'мак'],
      'Здоровье': ['аптек', 'врач', 'лекарств', 'медицин'],
      'Зарплата': ['зарплата', 'аванс', 'премия'],
      'Жильё': ['аренд', 'коммуналк', 'квартплат'],
      'Развлечения': ['кино', 'театр', 'концерт', 'подписк'],
    };
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(k => lower.includes(k))) { category = cat; break; }
    }

    const stopWords = ['потратил', 'купил', 'заплатил', 'получил', 'рублей', 'руб', 'на', 'в', 'за'];
    title = text.split(' ').filter(w => !stopWords.includes(w.toLowerCase())).filter(w => !/^\d/.test(w)).join(' ').trim() || category;
    return { amount, type, title: title.charAt(0).toUpperCase() + title.slice(1), accountId, category };
  };

  // === ПРОВЕРКА СЛОВА "УСПЕХ" ===
  const isWakeWord = (text: string): boolean => {
    const lower = text.toLowerCase().replace(/[^а-яё]/g, '');
    return lower.includes('успех') || lower === 'успех';
  };

  // === СЛУШАТЕЛЬ КОМАНДЫ ===
  const startCommandListener = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'ru-RU';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setLastCommand(text);
      const parsed = parseVoiceCommand(text);
      if (parsed.amount === 0) {
        setVoiceStatus('Не поняла сумму. Попробуйте ещё раз');
        playErrorSound();
        vibrate(400);
      } else {
        const amt = parsed.type === 'expense' ? -Math.abs(parsed.amount) : Math.abs(parsed.amount);
        setTransactions(prev => [{ id: Date.now(), accountId: parsed.accountId, title: parsed.title, amount: amt, type: parsed.type, date: new Date().toLocaleDateString('ru-RU'), category: parsed.category }, ...prev]);
        setAccounts(prev => prev.map(a => a.id === parsed.accountId ? { ...a, balance: a.balance + amt } : a));
        setVoiceStatus(`${parsed.title} — ${parsed.amount}₽ (${parsed.category})`);
        playSuccessSound();
        vibrate(100);
      }
      setTimeout(() => {
        setVoiceMode('waiting');
        setVoiceStatus('');
        startWakeWordListener();
      }, 3000);
    };

    rec.onerror = () => {
      setVoiceStatus('Не услышала. Слушаю снова...');
      setTimeout(() => {
        setVoiceMode('waiting');
        setVoiceStatus('');
        startWakeWordListener();
      }, 2000);
    };

    try { rec.start(); } catch (e) {
      setVoiceMode('waiting');
      startWakeWordListener();
    }
  }, [accounts, transactions, playErrorSound, playSuccessSound]);

  // === ГЛАВНЫЙ СЛУШАТЕЛЬ (постоянный) ===
  const startWakeWordListener = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const rec = new SR();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (isWakeWord(text) && voiceModeRef.current === 'waiting') {
          playActivationSound();
          vibrate([100, 50, 100]);
          setVoiceMode('command');
          setVoiceStatus('Слушаю команду...');
          try { rec.abort(); } catch (e) {}
          setTimeout(() => startCommandListener(), 500);
          return;
        }
      }
    };

    rec.onerror = (event: any) => {
      if (shouldListenRef.current && voiceModeRef.current === 'waiting') {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try { rec.start(); } catch (e) {}
          }
        }, 300);
      }
    };

    rec.onend = () => {
      if (shouldListenRef.current && voiceModeRef.current === 'waiting') {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try { rec.start(); } catch (e) {}
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (e) {}
  }, [playActivationSound, startCommandListener]);

  // === ВКЛ/ВЫКЛ ===
  const toggleVoiceControl = () => {
    if (voiceMode === 'off') {
      shouldListenRef.current = true;
      setVoiceMode('waiting');
      setVoiceStatus('');
      setTimeout(() => startWakeWordListener(), 100);
    } else {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      setVoiceMode('off');
      setVoiceStatus('');
      setLastCommand('');
    }
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const addTransaction = () => {
    if (!txTitle || !txAmount || !txAccountId) return;
    const amt = txType === 'expense' ? -Math.abs(Number(txAmount)) : Math.abs(Number(txAmount));
    setTransactions([{ id: Date.now(), accountId: txAccountId, title: txTitle, amount: amt, type: txType, date: new Date().toLocaleDateString('ru-RU') }, ...transactions]);
    setAccounts(accounts.map(a => a.id === txAccountId ? { ...a, balance: a.balance + amt } : a));
    setTxTitle(''); setTxAmount(''); setShowModal(false);
  };
  const addDebt = () => { if (!debtPerson || !debtAmount) return; setDebts([{ id: Date.now(), person: debtPerson, amount: Number(debtAmount), direction: debtDir }, ...debts]); setDebtPerson(''); setDebtAmount(''); setShowModal(false); };
  const addHabit = () => { if (!habitName || !habitImpact) return; setHabits([{ id: Date.now(), name: habitName, type: habitType, dailyImpact: Number(habitImpact), completedToday: false }, ...habits]); setHabitName(''); setHabitImpact(''); setShowModal(false); };
  const addAccount = () => { if (!accName) return; setAccounts([...accounts, { id: Date.now(), name: accName, type: accType, balance: Number(accBalance) || 0 }]); setAccName(''); setAccBalance(''); setShowModal(false); };
  const toggleHabit = (id: number) => setHabits(habits.map(h => h.id === id ? { ...h, completedToday: !h.completedToday } : h));
  const deleteTransaction = (id: number) => { const tx = transactions.find(t => t.id === id); if (tx) { setAccounts(accounts.map(a => a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a)); setTransactions(transactions.filter(t => t.id !== id)); } };
  const deleteDebt = (id: number) => setDebts(debts.filter(d => d.id !== id));
  const deleteHabit = (id: number) => setHabits(habits.filter(h => h.id !== id));
  const deleteAccount = (id: number) => { if (transactions.some(t => t.accountId === id)) { alert('Нельзя удалить счёт с операциями!'); return; } setAccounts(accounts.filter(a => a.id !== id)); };

  const exportData = () => { const data = { accounts, transactions, debts, habits, exportDate: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `uspex_backup_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target?.result as string); if (data.accounts) setAccounts(data.accounts); if (data.transactions) setTransactions(data.transactions); if (data.debts) setDebts(data.debts); if (data.habits) setHabits(data.habits); alert('Данные успешно загружены!'); } catch { alert('Ошибка: неверный формат файла'); } }; reader.readAsText(file); };
  const getAccountIcon = (type: string) => type === 'cash' ? <Banknote className="w-5 h-5" /> : type === 'virtual' ? <CreditCard className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />;

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><TrendingUp className="text-white w-5 h-5" /></div>
          <h1 className="text-xl font-bold tracking-tight text-indigo-900">Uspex</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportData} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg" title="Экспорт"><Download className="w-5 h-5" /></button>
          <label className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg cursor-pointer" title="Импорт"><Upload className="w-5 h-5" /><input type="file" accept=".json" onChange={importData} className="hidden" /></label>
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">АИ</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Добрый день! 👋</h2>
          <p className="text-gray-500">Сводка ваших финансов и привычек.</p>
        </div>

        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-sm">
          <p className="text-indigo-200 text-sm font-medium mb-1">Общий баланс</p>
          <h3 className="text-4xl font-bold mb-4">{totalBalance.toLocaleString('ru-RU')} ₽</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-indigo-200 text-xs">Наличные</p><p className="font-semibold">{cashBalance.toLocaleString()} ₽</p></div>
            <div><p className="text-indigo-200 text-xs">Виртуальные</p><p className="font-semibold">{virtualBalance.toLocaleString()} ₽</p></div>
            <div><p className="text-indigo-200 text-xs">Инвестиции</p><p className="font-semibold">{investmentBalance.toLocaleString()} ₽</p></div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Мои счета</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.type === 'cash' ? 'bg-green-100 text-green-600' : acc.type === 'virtual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{getAccountIcon(acc.type)}</div>
                    <div><p className="font-medium text-sm">{acc.name}</p><p className="text-xs text-gray-500">{acc.type === 'cash' ? 'Наличные' : acc.type === 'virtual' ? 'Виртуальные' : 'Инвестиции'}</p></div>
                  </div>
                  <button onClick={() => deleteAccount(acc.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{acc.balance.toLocaleString('ru-RU')} ₽</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4"><p className="text-gray-500 text-sm font-medium">Долги</p>
            <div className="text-right">
              <div className="flex justify-between items-end mb-1"><span className="text-sm text-gray-600 mr-4">Мне должны:</span><span className="font-semibold text-green-600">+{owedToMe.toLocaleString()} ₽</span></div>
              <div className="flex justify-between items-end"><span className="text-sm text-gray-600 mr-4">Я должен:</span><span className="font-semibold text-red-500">-{iOwe.toLocaleString()} ₽</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-indigo-600" /><h3 className="text-lg font-semibold">Влияние привычек сегодня</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100"><p className="text-green-700 text-sm font-medium">Сэкономлено</p><p className="text-2xl font-bold text-green-800">+{savedByHabits.toLocaleString()} ₽</p></div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-red-700 text-sm font-medium">Потеряно</p><p className="text-2xl font-bold text-red-800">-{lostToHabits.toLocaleString()} ₽</p></div>
          </div>
          <div className="space-y-2">
            {habits.length === 0 ? <p className="text-center text-gray-400 py-4">Пока нет привычек.</p> : habits.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 flex-1">
                  <button onClick={() => toggleHabit(h.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${h.completedToday ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>{h.completedToday && '✓'}</button>
                  <span className={`font-medium ${h.completedToday ? 'line-through text-gray-400' : ''}`}>{h.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${h.type === 'bad' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{h.type === 'bad' ? '-' : '+'}{h.dailyImpact} ₽/день</span>
                </div>
                <button onClick={() => deleteHabit(h.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Последние операции</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {transactions.length === 0 ? <p className="text-center text-gray-400 py-8">Пока нет операций.</p> : transactions.slice(0, 10).map(tx => {
              const acc = accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}</div>
                    <div><p className="font-medium">{tx.title}</p><p className="text-xs text-gray-500">{tx.date} • {acc?.name || 'Счёт'} {tx.category && `• ${tx.category}`}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ₽</span>
                    <button onClick={() => deleteTransaction(tx.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {debts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Детали долгов</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {debts.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${d.direction === 'owed_to_me' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{d.direction === 'owed_to_me' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}</div>
                    <div><p className="font-medium">{d.person}</p><p className="text-xs text-gray-500">{d.direction === 'owed_to_me' ? 'Мне должны' : 'Я должен'}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${d.direction === 'owed_to_me' ? 'text-green-600' : 'text-red-500'}`}>{d.amount.toLocaleString()} ₽</span>
                    <button onClick={() => deleteDebt(d.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* === КНОПКА ДОБАВИТЬ (левый нижний угол) === */}
      <button onClick={() => setShowModal(true)} className="fixed bottom-6 left-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium z-40">
        <Plus className="w-5 h-5" /><span>Добавить</span>
      </button>

      {/* === АЛИСА-СТИЛЬ: КРУГ С МИКРОФОНОМ (правый нижний угол) === */}
      <div className="fixed bottom-4 right-6 flex flex-col items-center z-40">
        {voiceMode !== 'off' && (
          <div className={`mb-3 px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all ${
            voiceMode === 'command' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}>
            {voiceMode === 'waiting' && 'Скажите «Успех»'}
            {voiceMode === 'command' && (voiceStatus || 'Слушаю команду...')}
          </div>
        )}
        {voiceMode === 'off' && lastCommand === '' && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-500 border border-gray-200 shadow">
            Нажмите для голосового управления
          </div>
        )}

        <div className="relative">
          {voiceMode === 'waiting' && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-2 rounded-full bg-red-400 animate-ping opacity-10" style={{ animationDuration: '3s' }} />
            </>
          )}
          {voiceMode === 'command' && (
            <>
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" style={{ animationDuration: '1s' }} />
              <div className="absolute -inset-3 rounded-full bg-green-400 animate-ping opacity-15" style={{ animationDuration: '1.5s' }} />
              <div className="absolute -inset-5 rounded-full bg-green-400 animate-ping opacity-10" style={{ animationDuration: '2s' }} />
            </>
          )}

          <button
            onClick={toggleVoiceControl}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              voiceMode === 'off'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : voiceMode === 'waiting'
                ? 'bg-red-500 text-white scale-110'
                : 'bg-green-500 text-white scale-125'
            }`}
          >
            {voiceMode === 'off' ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* === МОДАЛЬНОЕ ОКНО === */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Добавить</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['transaction', 'account', 'debt', 'habit'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t === 'transaction' ? 'Операция' : t === 'account' ? 'Счёт' : t === 'debt' ? 'Долг' : 'Привычка'}
                </button>
              ))}
            </div>
            {tab === 'transaction' && (
              <div className="space-y-3">
                <select value={txAccountId} onChange={e => setTxAccountId(Number(e.target.value))} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                <input value={txTitle} onChange={e => setTxTitle(e.target.value)} placeholder="Название" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={txAmount} onChange={e => setTxAmount(e.target.value)} type="number" placeholder="Сумма" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <button onClick={() => setTxType('income')} className={`flex-1 py-2 rounded-lg font-medium ${txType === 'income' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>Доход</button>
                  <button onClick={() => setTxType('expense')} className={`flex-1 py-2 rounded-lg font-medium ${txType === 'expense' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Расход</button>
                </div>
                <button onClick={addTransaction} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Добавить операцию</button>
              </div>
            )}
            {tab === 'account' && (
              <div className="space-y-3">
                <input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Название счёта" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={accBalance} onChange={e => setAccBalance(e.target.value)} type="number" placeholder="Текущий баланс" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <button onClick={() => setAccType('cash')} className={`flex-1 py-2 rounded-lg font-medium text-sm ${accType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>💵 Наличные</button>
                  <button onClick={() => setAccType('virtual')} className={`flex-1 py-2 rounded-lg font-medium text-sm ${accType === 'virtual' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>💳 Виртуальные</button>
                  <button onClick={() => setAccType('investment')} className={`flex-1 py-2 rounded-lg font-medium text-sm ${accType === 'investment' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>📈 Инвестиции</button>
                </div>
                <button onClick={addAccount} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Добавить счёт</button>
              </div>
            )}
            {tab === 'debt' && (
              <div className="space-y-3">
                <input value={debtPerson} onChange={e => setDebtPerson(e.target.value)} placeholder="Имя человека" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={debtAmount} onChange={e => setDebtAmount(e.target.value)} type="number" placeholder="Сумма" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <button onClick={() => setDebtDir('i_owe')} className={`flex-1 py-2 rounded-lg font-medium ${debtDir === 'i_owe' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Я должен</button>
                  <button onClick={() => setDebtDir('owed_to_me')} className={`flex-1 py-2 rounded-lg font-medium ${debtDir === 'owed_to_me' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>Мне должны</button>
                </div>
                <button onClick={addDebt} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Добавить долг</button>
              </div>
            )}
            {tab === 'habit' && (
              <div className="space-y-3">
                <input value={habitName} onChange={e => setHabitName(e.target.value)} placeholder="Название привычки" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={habitImpact} onChange={e => setHabitImpact(e.target.value)} type="number" placeholder="Стоимость в день (₽)" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <button onClick={() => setHabitType('bad')} className={`flex-1 py-2 rounded-lg font-medium ${habitType === 'bad' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Тратит 💸</button>
                  <button onClick={() => setHabitType('good')} className={`flex-1 py-2 rounded-lg font-medium ${habitType === 'good' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>Экономит 💰</button>
                </div>
                <button onClick={addHabit} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Добавить привычку</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}