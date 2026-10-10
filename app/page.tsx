'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Clock, HandCoins, Sparkles, Target, Flame, TrendingUp, Settings, Eye, EyeOff, Plus, X, Trash2, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, PiggyBank, Mic, MicOff, Moon, Sun, Download, Upload, AlertCircle, CheckCircle2, Lightbulb, Trophy, Lock, Unlock } from 'lucide-react';

type Account = { id: number; name: string; type: 'cash' | 'virtual' | 'investment'; balance: number; includeInTotal: boolean; hideBalance: boolean };
type Transaction = { id: number; accountId: number; title: string; amount: number; type: 'income' | 'expense'; date: string; category?: string };
type Debt = { id: number; person: string; amount: number; direction: 'i_owe' | 'owed_to_me'; hideBalance: boolean };
type Habit = { id: number; name: string; type: 'good' | 'bad'; dailyImpact: number; completedToday: boolean };
type Goal = { id: number; name: string; targetAmount: number; currentAmount: number; emoji: string };

export default function Page() {
  const [tab, setTab] = useState('finance');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [modalTab, setModalTab] = useState('transaction');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [voiceMode, setVoiceMode] = useState<'off' | 'waiting' | 'command'>('off');
  const [voiceStatus, setVoiceStatus] = useState('');

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const voiceModeRef = useRef<'off' | 'waiting' | 'command'>('off');

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('uspex_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('uspex_theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const defaultAccounts: Account[] = [
    { id: 1, name: 'Наличные', type: 'cash', balance: 0, includeInTotal: true, hideBalance: false },
    { id: 2, name: 'Карта Сбер', type: 'virtual', balance: 0, includeInTotal: true, hideBalance: false },
    { id: 3, name: 'Инвестиции', type: 'investment', balance: 0, includeInTotal: false, hideBalance: false },
  ];

  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [txAccountId, setTxAccountId] = useState(1);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'cash' | 'virtual' | 'investment'>('cash');
  const [accBalance, setAccBalance] = useState('');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDir, setDebtDir] = useState<'i_owe' | 'owed_to_me'>('i_owe');
  const [habitName, setHabitName] = useState('');
  const [habitImpact, setHabitImpact] = useState('');
  const [habitType, setHabitType] = useState<'good' | 'bad'>('bad');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');

  useEffect(() => {
    const load = (key: string, def: any) => {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : def;
    };
    setAccounts(load('uspex_accounts', defaultAccounts));
    setTransactions(load('uspex_transactions', []));
    setDebts(load('uspex_debts', []));
    setHabits(load('uspex_habits', []));
    setGoals(load('uspex_goals', []));
  }, []);

  useEffect(() => { localStorage.setItem('uspex_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('uspex_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('uspex_debts', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('uspex_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('uspex_goals', JSON.stringify(goals)); }, [goals]);

  const totalBalance = accounts.filter(a => a.includeInTotal !== false && !a.hideBalance).reduce((s, a) => s + a.balance, 0);
  const cashBalance = accounts.filter(a => a.type === 'cash' && a.includeInTotal !== false && !a.hideBalance).reduce((s, a) => s + a.balance, 0);
  const virtualBalance = accounts.filter(a => a.type === 'virtual' && a.includeInTotal !== false && !a.hideBalance).reduce((s, a) => s + a.balance, 0);
  const investmentBalance = accounts.filter(a => a.type === 'investment' && a.includeInTotal !== false && !a.hideBalance).reduce((s, a) => s + a.balance, 0);
  const owedToMe = debts.filter(d => d.direction === 'owed_to_me' && !d.hideBalance).reduce((s, d) => s + d.amount, 0);
  const iOwe = debts.filter(d => d.direction === 'i_owe' && !d.hideBalance).reduce((s, d) => s + d.amount, 0);
  const savedByHabits = habits.filter(h => h.type === 'good' && h.completedToday).reduce((s, h) => s + h.dailyImpact, 0);
  const lostToHabits = habits.filter(h => h.type === 'bad' && h.completedToday).reduce((s, h) => s + h.dailyImpact, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = Math.abs(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));

  const toggleAccountInTotal = (id: number) => {
    setAccounts(accounts.map(a => a.id === id ? { ...a, includeInTotal: a.includeInTotal === false } : a));
  };

  const toggleAccountHide = (id: number) => {
    setAccounts(accounts.map(a => a.id === id ? { ...a, hideBalance: !a.hideBalance } : a));
  };

  const toggleDebtHide = (id: number) => {
    setDebts(debts.map(d => d.id === id ? { ...d, hideBalance: !d.hideBalance } : d));
  };

  const addTransaction = () => {
    if (!txTitle || !txAmount) return;
    const amt = txType === 'expense' ? -Math.abs(Number(txAmount)) : Math.abs(Number(txAmount));
    setTransactions([{ id: Date.now(), accountId: txAccountId, title: txTitle, amount: amt, type: txType, date: new Date().toLocaleDateString('ru-RU') }, ...transactions]);
    setAccounts(accounts.map(a => a.id === txAccountId ? { ...a, balance: a.balance + amt } : a));
    setTxTitle(''); setTxAmount(''); setShowModal(false);
  };

  const addAccount = () => {
    if (!accName) return;
    setAccounts([...accounts, { id: Date.now(), name: accName, type: accType, balance: Number(accBalance) || 0, includeInTotal: true, hideBalance: false }]);
    setAccName(''); setAccBalance(''); setShowModal(false);
  };

  const addDebt = () => {
    if (!debtPerson || !debtAmount) return;
    setDebts([{ id: Date.now(), person: debtPerson, amount: Number(debtAmount), direction: debtDir, hideBalance: false }, ...debts]);
    setDebtPerson(''); setDebtAmount(''); setShowModal(false);
  };

  const addHabit = () => {
    if (!habitName || !habitImpact) return;
    setHabits([{ id: Date.now(), name: habitName, type: habitType, dailyImpact: Number(habitImpact), completedToday: false }, ...habits]);
    setHabitName(''); setHabitImpact(''); setShowModal(false);
  };

  const addGoal = () => {
    if (!goalName || !goalTarget) return;
    setGoals([...goals, { id: Date.now(), name: goalName, targetAmount: Number(goalTarget), currentAmount: 0, emoji: goalEmoji }]);
    setGoalName(''); setGoalTarget(''); setShowModal(false);
  };

  const addToGoal = (id: number) => {
    const amount = prompt('Сколько добавить?');
    if (amount && !isNaN(Number(amount))) {
      setGoals(goals.map(g => g.id === id ? { ...g, currentAmount: Math.min(g.currentAmount + Number(amount), g.targetAmount) } : g));
    }
  };

  const deleteTransaction = (id: number) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setAccounts(accounts.map(a => a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a));
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };
  const deleteDebt = (id: number) => setDebts(debts.filter(d => d.id !== id));
  const deleteHabit = (id: number) => setHabits(habits.filter(h => h.id !== id));
  const deleteGoal = (id: number) => setGoals(goals.filter(g => g.id !== id));
  const deleteAccount = (id: number) => {
    if (transactions.some(t => t.accountId === id)) { alert('Нельзя удалить счёт с операциями!'); return; }
    setAccounts(accounts.filter(a => a.id !== id));
  };
  const toggleHabit = (id: number) => setHabits(habits.map(h => h.id === id ? { ...h, completedToday: !h.completedToday } : h));

  // === ГОЛОСОВОЕ УПРАВЛЕНИЕ ===
  const playActivationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.frequency.value = 880; osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.3);
      const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.value = 1174; osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.15); osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }, []);

  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch (e) {}
  }, []);

  const playErrorSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 200; osc.type = 'square';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, []);

  const vibrate = (pattern: number | number[]) => { if (navigator.vibrate) navigator.vibrate(pattern); };

  const parseVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    let amount = 0;
    let type: 'income' | 'expense' | 'goal' = 'expense';
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

    const goalWords = ['цель', 'накопить', 'копить', 'коплю', 'мечта', 'хочу', 'накопил', 'пополнил', 'добавил к цели', 'в копилку', 'отложил'];
    if (goalWords.some(w => lower.includes(w)) && amount > 0) {
      type = 'goal';
      title = text.replace(/\d+/g, '').replace(/рублей|руб|тысяч|тыс|на|в|для|цель|накопить|копить|коплю|мечта|хочу|накопил|пополнил|добавил к цели|в копилку|отложил/gi, '').trim();
      title = title.charAt(0).toUpperCase() + title.slice(1) || 'Новая цель';
      return { amount, type, title, accountId: 0, category: '' };
    }

    const incomeWords = ['получил', 'зарплата', 'пришло', 'перевели', 'доход', 'заработал'];
    if (incomeWords.some(w => lower.includes(w))) type = 'income';

    if (lower.includes('налич') || lower.includes('налом')) accountId = accounts.find(a => a.type === 'cash')?.id || 1;
    else if (lower.includes('инвестиц') || lower.includes('брокер')) accountId = accounts.find(a => a.type === 'investment')?.id || 1;
    else if (lower.includes('карт') || lower.includes('сбер') || lower.includes('тинькофф')) accountId = accounts.find(a => a.type === 'virtual')?.id || 1;

    const categoryMap: Record<string, string[]> = {
      'Продукты': ['пятёрочка', 'пятерочка', 'магнит', 'перекрёсток', 'лента', 'дикси', 'вкусвилл'],
      'Транспорт': ['такси', 'метро', 'бензин', 'авто', 'транспорт'],
      'Рестораны': ['кафе', 'ресторан', 'кофе', 'старбакс', 'мак'],
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

  const isWakeWord = (text: string): boolean => {
    const lower = text.toLowerCase().replace(/[^а-яё]/g, '');
    return lower.includes('успех') || lower === 'успех';
  };

  const startCommandListener = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'ru-RU'; rec.continuous = false; rec.interimResults = false;

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      const parsed = parseVoiceCommand(text);

      if (parsed.type === 'goal') {
        const existingGoal = goals.find(g =>
          parsed.title.toLowerCase().includes(g.name.toLowerCase()) ||
          g.name.toLowerCase().includes(parsed.title.toLowerCase())
        );

        if (existingGoal) {
          setGoals(prev => prev.map(g => g.id === existingGoal.id
            ? { ...g, currentAmount: Math.min(g.currentAmount + parsed.amount, g.targetAmount) }
            : g
          ));
          setVoiceStatus(`Цель "${existingGoal.name}" пополнена на ${parsed.amount.toLocaleString()}₽!`);
        } else {
          setGoals(prev => [{ id: Date.now(), name: parsed.title, targetAmount: parsed.amount, currentAmount: 0, emoji: '🎯' }, ...prev]);
          setVoiceStatus(`Цель "${parsed.title}" на ${parsed.amount.toLocaleString()}₽ создана!`);
        }
        playSuccessSound(); vibrate(100);
        setTimeout(() => { setVoiceMode('waiting'); setVoiceStatus(''); startWakeWordListener(); }, 3000);
        return;
      }

      if (parsed.amount === 0) {
        setVoiceStatus('Не поняла сумму. Попробуйте ещё раз');
        playErrorSound(); vibrate(400);
      } else {
        const amt = parsed.type === 'expense' ? -Math.abs(parsed.amount) : Math.abs(parsed.amount);
        setTransactions(prev => [{ id: Date.now(), accountId: parsed.accountId, title: parsed.title, amount: amt, type: parsed.type, date: new Date().toLocaleDateString('ru-RU'), category: parsed.category }, ...prev]);
        setAccounts(prev => prev.map(a => a.id === parsed.accountId ? { ...a, balance: a.balance + amt } : a));
        setVoiceStatus(`${parsed.title} — ${parsed.amount}₽ (${parsed.category})`);
        playSuccessSound(); vibrate(100);
      }
      setTimeout(() => { setVoiceMode('waiting'); setVoiceStatus(''); startWakeWordListener(); }, 3000);
    };

    rec.onerror = () => {
      setVoiceStatus('Не услышала. Слушаю снова...');
      setTimeout(() => { setVoiceMode('waiting'); setVoiceStatus(''); startWakeWordListener(); }, 2000);
    };

    try { rec.start(); } catch (e) { setVoiceMode('waiting'); startWakeWordListener(); }
  }, [accounts, transactions, goals, playErrorSound, playSuccessSound]);

  const startWakeWordListener = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }

    const rec = new SR();
    rec.lang = 'ru-RU'; rec.continuous = true; rec.interimResults = false; rec.maxAlternatives = 3;

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (isWakeWord(text) && voiceModeRef.current === 'waiting') {
          playActivationSound(); vibrate([100, 50, 100]);
          setVoiceMode('command'); setVoiceStatus('Слушаю команду...');
          try { rec.abort(); } catch (e) {}
          setTimeout(() => startCommandListener(), 500);
          return;
        }
      }
    };

    rec.onerror = () => {
      if (shouldListenRef.current && voiceModeRef.current === 'waiting') {
        setTimeout(() => { if (shouldListenRef.current) { try { rec.start(); } catch (e) {} } }, 300);
      }
    };

    rec.onend = () => {
      if (shouldListenRef.current && voiceModeRef.current === 'waiting') {
        setTimeout(() => { if (shouldListenRef.current) { try { rec.start(); } catch (e) {} } }, 300);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (e) {}
  }, [playActivationSound, startCommandListener]);

  const toggleVoiceControl = () => {
    if (voiceMode === 'off') {
      shouldListenRef.current = true; setVoiceMode('waiting'); setVoiceStatus('');
      setTimeout(() => startWakeWordListener(), 100);
    } else {
      shouldListenRef.current = false;
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
      setVoiceMode('off'); setVoiceStatus('');
    }
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
    };
  }, []);

  const getAdvice = () => {
    const advice: { icon: any; title: string; text: string; color: string }[] = [];
    if (totalExpense > totalIncome && totalIncome > 0) {
      advice.push({ icon: AlertCircle, title: 'Расходы превышают доходы', text: `Ты потратил ${totalExpense.toLocaleString()} ₽, а получил ${totalIncome.toLocaleString()} ₽. Пора пересмотреть бюджет!`, color: 'red' });
    }
    if (totalIncome > 0 && totalExpense === 0) {
      advice.push({ icon: CheckCircle2, title: 'Отличный старт!', text: `Ты получил ${totalIncome.toLocaleString()} ₽ и пока ничего не потратил. Так держать!`, color: 'green' });
    }
    if (habits.filter(h => h.type === 'bad').length > 0) {
      const dailyLoss = habits.filter(h => h.type === 'bad').reduce((s, h) => s + h.dailyImpact, 0);
      advice.push({ icon: Flame, title: 'Вредные привычки', text: `${habits.filter(h => h.type === 'bad').length} привычек забирают ${dailyLoss.toLocaleString()} ₽ в день. Это ${dailyLoss * 30} ₽ в месяц!`, color: 'orange' });
    }
    if (habits.filter(h => h.type === 'good').length > 0) {
      const dailySave = habits.filter(h => h.type === 'good').reduce((s, h) => s + h.dailyImpact, 0);
      advice.push({ icon: Trophy, title: 'Молодец!', text: `${habits.filter(h => h.type === 'good').length} полезных привычек экономят ${dailySave.toLocaleString()} ₽ в день. Продолжай!`, color: 'green' });
    }
    if (iOwe > 0) {
      advice.push({ icon: HandCoins, title: 'У тебя есть долги', text: `Ты должен ${iOwe.toLocaleString()} ₽. Постарайся закрыть их в ближайшее время.`, color: 'red' });
    }
    if (owedToMe > 0) {
      advice.push({ icon: HandCoins, title: 'Тебе должны', text: `Тебе должны ${owedToMe.toLocaleString()} ₽. Не забудь напомнить!`, color: 'blue' });
    }
    if (advice.length === 0) {
      advice.push({ icon: Lightbulb, title: 'Начни отслеживать финансы', text: 'Добавь первую операцию, привычку или цель, и я дам персональный совет!', color: 'blue' });
    }
    return advice;
  };

  const exportData = () => { const data = { accounts, transactions, debts, habits, goals, exportDate: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `uspex_backup_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target?.result as string); if (data.accounts) setAccounts(data.accounts); if (data.transactions) setTransactions(data.transactions); if (data.debts) setDebts(data.debts); if (data.habits) setHabits(data.habits); if (data.goals) setGoals(data.goals); alert('Данные успешно загружены!'); } catch { alert('Ошибка: неверный формат файла'); } }; reader.readAsText(file); };

  const tabs = [
    { id: 'finance', label: 'Финансы', icon: Home },
    { id: 'history', label: 'История', icon: Clock },
    { id: 'debts', label: 'Долги', icon: HandCoins },
    { id: 'advisor', label: 'Советник', icon: Sparkles },
    { id: 'goals', label: 'Цели', icon: Target },
    { id: 'habits', label: 'Привычки', icon: Flame },
  ];

  const getAccountIcon = (type: string) => type === 'cash' ? <Banknote className="w-5 h-5" /> : type === 'virtual' ? <CreditCard className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />;

  const modalTabs = [
    { id: 'transaction', label: 'Операция' },
    { id: 'account', label: 'Счёт' },
    { id: 'debt', label: 'Долг' },
    { id: 'habit', label: 'Привычка' },
    { id: 'goal', label: 'Цель' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">Uspex</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Настройки">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {tab === 'finance' && (
          <>
            <div>
              <h2 className="text-2xl font-bold">Добрый день! 👋</h2>
              <p className="text-gray-500 dark:text-gray-400">Сводка ваших финансов.</p>
            </div>
            <div className="bg-indigo-600 text-white p-6 rounded-2xl">
              <p className="text-indigo-200 text-sm mb-1">Общий баланс</p>
              <h3 className="text-4xl font-bold mb-4">{totalBalance.toLocaleString('ru-RU')} ₽</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-indigo-200 text-xs">Наличные</p><p className="font-semibold">{cashBalance.toLocaleString()} ₽</p></div>
                <div><p className="text-indigo-200 text-xs">Виртуальные</p><p className="font-semibold">{virtualBalance.toLocaleString()} ₽</p></div>
                <div><p className="text-indigo-200 text-xs">Инвестиции</p><p className="font-semibold">{investmentBalance.toLocaleString()} ₽</p></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Мои счета</h3>
                <p className="text-xs text-gray-500">️ — в балансе · 🔒 — скрыт</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border ${acc.includeInTotal ? 'border-gray-100 dark:border-gray-700' : 'border-gray-200 dark:border-gray-600 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.type === 'cash' ? 'bg-green-100 text-green-600' : acc.type === 'virtual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{getAccountIcon(acc.type)}</div>
                        <div>
                          <p className="font-medium text-sm">{acc.name}</p>
                          <p className="text-xs text-gray-500">{acc.type === 'cash' ? 'Наличные' : acc.type === 'virtual' ? 'Виртуальные' : 'Инвестиции'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => toggleAccountInTotal(acc.id)} className={`p-2 rounded-lg ${acc.includeInTotal ? 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={acc.includeInTotal ? 'Исключить из баланса' : 'Включить в баланс'}>
                          {acc.includeInTotal ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button onClick={() => toggleAccountHide(acc.id)} className={`p-2 rounded-lg ${acc.hideBalance ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={acc.hideBalance ? 'Показать сумму' : 'Скрыть сумму'}>
                          {acc.hideBalance ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${acc.balance >= 0 ? '' : 'text-red-500'}`}>
                      {acc.hideBalance ? '•••••' : acc.balance.toLocaleString('ru-RU') + ' ₽'}
                    </p>
                    {!acc.includeInTotal && <p className="text-xs text-gray-400 mt-1">Не учитывается в общем балансе</p>}
                    {acc.hideBalance && acc.includeInTotal && <p className="text-xs text-amber-500 mt-1">🔒 Сумма скрыта</p>}
                    <button onClick={() => deleteAccount(acc.id)} className="text-gray-300 hover:text-red-500 mt-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            <h2 className="text-2xl font-bold">История операций</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden">
              {transactions.length === 0 ? <p className="text-center text-gray-400 py-8">Пока нет операций.</p> : transactions.map(tx => {
                const acc = accounts.find(a => a.id === tx.accountId);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}</div>
                      <div><p className="font-medium">{tx.title}</p><p className="text-xs text-gray-500">{tx.date} • {acc?.name} {tx.category && `• ${tx.category}`}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : ''}`}>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ₽</span>
                      <button onClick={() => deleteTransaction(tx.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'debts' && (
          <>
            <h2 className="text-2xl font-bold">Долги</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                <p className="text-green-700 dark:text-green-400 text-sm">Мне должны</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">+{owedToMe.toLocaleString()} ₽</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-2xl border border-red-100 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 text-sm">Я должен</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">-{iOwe.toLocaleString()} ₽</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden">
              {debts.length === 0 ? <p className="text-center text-gray-400 py-8">Пока нет долгов.</p> : debts.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 border-b last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${d.direction === 'owed_to_me' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{d.direction === 'owed_to_me' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}</div>
                    <div className="flex-1">
                      <p className="font-medium">{d.person}</p>
                      <p className="text-xs text-gray-500">{d.direction === 'owed_to_me' ? 'Мне должны' : 'Я должен'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${d.direction === 'owed_to_me' ? 'text-green-600' : 'text-red-500'}`}>
                      {d.hideBalance ? '•••••' : d.amount.toLocaleString() + ' ₽'}
                    </span>
                    <button onClick={() => toggleDebtHide(d.id)} className={`p-2 rounded-lg ${d.hideBalance ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={d.hideBalance ? 'Показать сумму' : 'Скрыть сумму'}>
                      {d.hideBalance ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteDebt(d.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'advisor' && (
          <>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-600" />Финансовый советник</h2>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold text-lg">Привет! Я твой советник</p>
                  <p className="text-indigo-200 text-sm">Вот что я заметил</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {getAdvice().map((advice, i) => {
                const Icon = advice.icon;
                const colorClasses: Record<string, string> = {
                  red: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400',
                  green: 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800 text-green-700 dark:text-green-400',
                  orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400',
                  blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400',
                };
                return (
                  <div key={i} className={`p-4 rounded-2xl border ${colorClasses[advice.color]}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold mb-1">{advice.title}</p>
                        <p className="text-sm opacity-90">{advice.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border">
              <h3 className="font-semibold mb-4">Быстрая статистика</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><p className="text-xs text-gray-500">Доходы</p><p className="text-lg font-bold text-green-600">+{totalIncome.toLocaleString()} ₽</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><p className="text-xs text-gray-500">Расходы</p><p className="text-lg font-bold text-red-500">-{totalExpense.toLocaleString()} ₽</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><p className="text-xs text-gray-500">Операций</p><p className="text-lg font-bold">{transactions.length}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><p className="text-xs text-gray-500">Привычек</p><p className="text-lg font-bold">{habits.length}</p></div>
              </div>
            </div>
          </>
        )}

        {tab === 'goals' && (
          <>
            <h2 className="text-2xl font-bold">Цели накоплений</h2>
            {goals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">У тебя пока нет целей</p>
                <button onClick={() => { setModalTab('goal'); setShowModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">Добавить первую цель</button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => {
                  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const isComplete = goal.currentAmount >= goal.targetAmount;
                  return (
                    <div key={goal.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{goal.emoji}</div>
                          <div><p className="font-semibold">{goal.name}</p><p className="text-xs text-gray-500">{goal.currentAmount.toLocaleString()} из {goal.targetAmount.toLocaleString()} ₽</p></div>
                        </div>
                        <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                        <div className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>{isComplete ? ' Цель достигнута!' : `${progress.toFixed(0)}% выполнено`}</p>
                        {!isComplete && (
                          <button onClick={() => addToGoal(goal.id)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">+ Пополнить</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'habits' && (
          <>
            <h2 className="text-2xl font-bold">Привычки</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                <p className="text-green-700 dark:text-green-400 text-sm">Сэкономлено</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">+{savedByHabits.toLocaleString()} ₽</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-2xl border border-red-100 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 text-sm">Потеряно</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">-{lostToHabits.toLocaleString()} ₽</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden">
              {habits.length === 0 ? <p className="text-center text-gray-400 py-8">Пока нет привычек.</p> : habits.map(h => (
                <div key={h.id} className="flex items-center justify-between p-4 border-b last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleHabit(h.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${h.completedToday ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>{h.completedToday && '✓'}</button>
                    <span className={`font-medium ${h.completedToday ? 'line-through text-gray-400' : ''}`}>{h.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.type === 'bad' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{h.type === 'bad' ? '-' : '+'}{h.dailyImpact} ₽/день</span>
                  </div>
                  <button onClick={() => deleteHabit(h.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <button onClick={() => setShowModal(true)} className="fixed bottom-24 left-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center gap-2 font-medium z-40">
        <Plus className="w-5 h-5" /><span>Добавить</span>
      </button>

      <div className="fixed bottom-24 right-6 flex flex-col items-center z-40">
        {voiceMode !== 'off' && (
          <div className={`mb-3 px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${voiceMode === 'command' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border'}`}>
            {voiceMode === 'waiting' && 'Скажите «Успех»'}
            {voiceMode === 'command' && (voiceStatus || 'Слушаю команду...')}
          </div>
        )}
        {voiceMode === 'off' && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border shadow">
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
            </>
          )}
          <button onClick={toggleVoiceControl} className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${voiceMode === 'off' ? 'bg-gray-700 dark:bg-gray-600 text-gray-300' : voiceMode === 'waiting' ? 'bg-red-500 text-white scale-110' : 'bg-green-500 text-white scale-125'}`}>
            {voiceMode === 'off' ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex justify-around py-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 flex-1 ${active ? 'text-indigo-600' : 'text-gray-500'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Добавить</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {modalTabs.map(t => (
                <button key={t.id} onClick={() => setModalTab(t.id)} className={`flex-1 py-2 text-sm font-medium rounded-lg ${modalTab === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {modalTab === 'transaction' && (
              <div className="space-y-3">
                <select value={txAccountId} onChange={e => setTxAccountId(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input value={txTitle} onChange={e => setTxTitle(e.target.value)} placeholder="Название" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <input value={txAmount} onChange={e => setTxAmount(e.target.value)} type="number" placeholder="Сумма" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <div className="flex gap-2">
                  <button onClick={() => setTxType('income')} className={`flex-1 py-2 rounded-lg ${txType === 'income' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700'}`}>Доход</button>
                  <button onClick={() => setTxType('expense')} className={`flex-1 py-2 rounded-lg ${txType === 'expense' ? 'bg-red-100 text-red-700' : 'bg-gray-100 dark:bg-gray-700'}`}>Расход</button>
                </div>
                <button onClick={addTransaction} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">Добавить операцию</button>
              </div>
            )}

            {modalTab === 'account' && (
              <div className="space-y-3">
                <input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Название счёта" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <input value={accBalance} onChange={e => setAccBalance(e.target.value)} type="number" placeholder="Текущий баланс" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <div className="flex gap-2">
                  <button onClick={() => setAccType('cash')} className={`flex-1 py-2 rounded-lg text-sm ${accType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700'}`}>💵 Наличные</button>
                  <button onClick={() => setAccType('virtual')} className={`flex-1 py-2 rounded-lg text-sm ${accType === 'virtual' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700'}`}>💳 Виртуальные</button>
                  <button onClick={() => setAccType('investment')} className={`flex-1 py-2 rounded-lg text-sm ${accType === 'investment' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 dark:bg-gray-700'}`}> Инвестиции</button>
                </div>
                <button onClick={addAccount} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">Добавить счёт</button>
              </div>
            )}

            {modalTab === 'debt' && (
              <div className="space-y-3">
                <input value={debtPerson} onChange={e => setDebtPerson(e.target.value)} placeholder="Имя человека" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <input value={debtAmount} onChange={e => setDebtAmount(e.target.value)} type="number" placeholder="Сумма" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <div className="flex gap-2">
                  <button onClick={() => setDebtDir('i_owe')} className={`flex-1 py-2 rounded-lg ${debtDir === 'i_owe' ? 'bg-red-100 text-red-700' : 'bg-gray-100 dark:bg-gray-700'}`}>Я должен</button>
                  <button onClick={() => setDebtDir('owed_to_me')} className={`flex-1 py-2 rounded-lg ${debtDir === 'owed_to_me' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700'}`}>Мне должны</button>
                </div>
                <button onClick={addDebt} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">Добавить долг</button>
              </div>
            )}

            {modalTab === 'habit' && (
              <div className="space-y-3">
                <input value={habitName} onChange={e => setHabitName(e.target.value)} placeholder="Название привычки" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <input value={habitImpact} onChange={e => setHabitImpact(e.target.value)} type="number" placeholder="Стоимость в день (₽)" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <div className="flex gap-2">
                  <button onClick={() => setHabitType('bad')} className={`flex-1 py-2 rounded-lg ${habitType === 'bad' ? 'bg-red-100 text-red-700' : 'bg-gray-100 dark:bg-gray-700'}`}>Тратит 💸</button>
                  <button onClick={() => setHabitType('good')} className={`flex-1 py-2 rounded-lg ${habitType === 'good' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700'}`}>Экономит 💰</button>
                </div>
                <button onClick={addHabit} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">Добавить привычку</button>
              </div>
            )}

            {modalTab === 'goal' && (
              <div className="space-y-3">
                <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Название цели" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)} type="number" placeholder="Целевая сумма (₽)" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Выбери иконку:</p>
                  <div className="flex gap-2 flex-wrap">
                    {['', '🚲', '🏠', '✈️', '💻', '', '🚗', '💍', '🎮', '⌚'].map(emoji => (
                      <button key={emoji} onClick={() => setGoalEmoji(emoji)} className={`w-12 h-12 text-2xl rounded-lg border-2 ${goalEmoji === emoji ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600'}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
                <button onClick={addGoal} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">Добавить цель</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Настройки
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center"><Moon className="w-5 h-5 text-indigo-400" /></div>
                    ) : (
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Sun className="w-5 h-5 text-yellow-600" /></div>
                    )}
                    <div>
                      <p className="font-medium">Тёмная тема</p>
                      <p className="text-xs text-gray-500">{theme === 'dark' ? 'Включена' : 'Выключена'}</p>
                    </div>
                  </div>
                  <button onClick={toggleTheme} className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}>
                      {theme === 'dark' ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-yellow-600" />}
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
                  <div>
                    <p className="font-medium">Uspex v1.6</p>
                    <p className="text-xs text-gray-500">Выборочное скрытие балансов</p>
                  </div>
                </div>
              </div>

              <button onClick={exportData} className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center"><Download className="w-5 h-5 text-green-600" /></div>
                <div><p className="font-medium">Экспорт данных</p><p className="text-xs text-gray-500">Сохранить резервную копию</p></div>
              </button>

              <label className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center"><Upload className="w-5 h-5 text-blue-600" /></div>
                <div><p className="font-medium">Импорт данных</p><p className="text-xs text-gray-500">Загрузить резервную копию</p></div>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}