import React, { useState, useEffect, useCallback } from 'react';
import { dailyLogAPI, foodsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Plus, Trash2, Search, FlameKindling, Beef, Wheat, Droplets, Sprout } from 'lucide-react';
import styles from './Dashboard.module.css';

const MEALS = ['desayuno','almuerzo','comida','merienda','cena','snack'];

export default function Dashboard() {
  const { user } = useAuth();
  const [log, setLog]           = useState({ items: [], totals: { calories:0, protein:0, carbs:0, fat:0, fiber:0 } });
  const [stats, setStats]       = useState([]);
  const [foods, setFoods]       = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const emptyForm = { food_id:'', quantity:100, meal_type:'comida', name:'', calories_per_100g:0, protein_per_100g:0, carbs_per_100g:0, fat_per_100g:0, fiber_per_100g:0, source:'' };
  const [addForm, setAddForm]   = useState(emptyForm);
  const today = new Date().toISOString().slice(0, 10);

  const fetchLog = useCallback(async () => {
    try {
      const { data } = await dailyLogAPI.get(today);
      setLog(data);
    } catch { toast.error('Error cargando registro'); }
    finally { setLoading(false); }
  }, [today]);

  const fetchStats = useCallback(async () => {
    const { data } = await dailyLogAPI.getStats(7);
    setStats(data);
  }, []);

  useEffect(() => { fetchLog(); fetchStats(); }, [fetchLog, fetchStats]);

  useEffect(() => {
    if (!search.trim()) { setFoods([]); return; }
    const t = setTimeout(async () => {
      const { data } = await foodsAPI.search({ search });
      setFoods(data);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const selectFood = (f) => {
    setAddForm(p => ({
      ...p,
      food_id: f.id,
      name: f.name,
      calories_per_100g: f.calories_per_100g || 0,
      protein_per_100g: f.protein_per_100g || 0,
      carbs_per_100g: f.carbs_per_100g || 0,
      fat_per_100g: f.fat_per_100g || 0,
      fiber_per_100g: f.fiber_per_100g || 0,
      source: f.source || 'local',
    }));
    setSearch(f.name);
    setFoods([]);
  };

  const addEntry = async () => {
    if (!addForm.food_id && !addForm.name) { toast.error('Selecciona un alimento'); return; }
    try {
      await dailyLogAPI.add({ ...addForm, date: today });
      toast.success('Registrado');
      setShowAdd(false);
      setAddForm(emptyForm);
      setSearch(''); setFoods([]);
      fetchLog(); fetchStats();
    } catch { toast.error('Error al registrar'); }
  };

  const removeEntry = async (id) => {
    await dailyLogAPI.remove(id);
    fetchLog(); fetchStats();
  };

  const goal = user?.daily_calorie_goal || 2000;
  const pct  = Math.min((log.totals.calories / goal) * 100, 100);
  const remaining = Math.max(goal - log.totals.calories, 0);

  const macroData = [
    { name: 'Proteína', value: log.totals.protein, color: '#16a34a', icon: Beef,    unit:'g' },
    { name: 'Carbos',   value: log.totals.carbs,   color: '#f59e0b', icon: Wheat,   unit:'g' },
    { name: 'Grasa',    value: log.totals.fat,      color: '#ef4444', icon: Droplets,unit:'g' },
    { name: 'Fibra',    value: log.totals.fiber,    color: '#8b5cf6', icon: Sprout,  unit:'g' },
  ];

  const grouped = MEALS.map(m => ({
    meal: m,
    items: log.items.filter(i => i.meal_type === m),
  })).filter(g => g.items.length > 0);

  if (loading) return <div className={styles.center}><div className="spinner" style={{width:36,height:36}} /></div>;

  return (
    <div className={`${styles.page} fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Buenos días, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.date}>{new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Añadir alimento
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        {/* Caloría gauge */}
        <div className={`card ${styles.calorieCard}`}>
          <div className={styles.calorieInner}>
            <div className={styles.gaugeWrap}>
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%"
                  startAngle={220} endAngle={-40}
                  data={[{ value: pct, fill: pct > 90 ? '#ef4444' : '#16a34a' }]}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f0fdf4' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className={styles.gaugeCenter}>
                <FlameKindling size={18} color="#16a34a" />
                <span className={styles.kcalVal}>{Math.round(log.totals.calories)}</span>
                <span className={styles.kcalLabel}>kcal</span>
              </div>
            </div>
            <div className={styles.calorieInfo}>
              <p className={styles.calorieTitle}>Calorías hoy</p>
              <p className={styles.calorieGoal}>Objetivo: <strong>{goal} kcal</strong></p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width:`${pct}%`, background: pct>90?'#ef4444':'#16a34a' }} />
              </div>
              <p className={styles.remaining}>{remaining > 0 ? `Quedan ${remaining} kcal` : '¡Objetivo alcanzado!'}</p>
            </div>
          </div>
        </div>

        {/* Macros */}
        {macroData.map(({ name, value, color, icon: Icon, unit }) => (
          <div key={name} className={`card ${styles.macroCard}`}>
            <div className={styles.macroIcon} style={{ background:`${color}18`, color }}>
              <Icon size={20} />
            </div>
            <p className={styles.macroVal}>{value}<span className={styles.macroUnit}>{unit}</span></p>
            <p className={styles.macroName}>{name}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      {stats.length > 0 && (
        <div className={`card ${styles.chartCard}`}>
          <h3 className="section-title">Calorías últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="logged_at" tickFormatter={d => d.slice(5)} tick={{ fontSize:12, fill:'#9ca3af' }} />
              <YAxis tick={{ fontSize:12, fill:'#9ca3af' }} />
              <Tooltip formatter={v => [`${v} kcal`]} labelFormatter={l => `Día ${l}`} contentStyle={{ borderRadius:8, fontSize:13 }} />
              <Bar dataKey="calories" fill="#16a34a" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log del día */}
      <div className={`card ${styles.logCard}`}>
        <h3 className="section-title">Registro de hoy</h3>
        {grouped.length === 0
          ? <p className={styles.empty}>No has registrado ningún alimento hoy. ¡Empieza añadiendo uno!</p>
          : grouped.map(({ meal, items }) => (
            <div key={meal} className={styles.mealGroup}>
              <p className={styles.mealLabel}>{meal.charAt(0).toUpperCase()+meal.slice(1)}</p>
              {items.map(item => (
                <div key={item.id} className={styles.logRow}>
                  <div className={styles.logName}>
                    <span>{item.name}</span>
                    <span className={styles.logQty}>{item.quantity}g</span>
                  </div>
                  <div className={styles.logMacros}>
                    <span style={{color:'#16a34a'}}>{item.calories} kcal</span>
                    <span>P {item.protein}g</span>
                    <span>C {item.carbs}g</span>
                    <span>G {item.fat}g</span>
                  </div>
                  <button className="btn btn-ghost" onClick={() => removeEntry(item.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ))
        }
      </div>

      {/* Modal añadir */}
      {showAdd && (
        <div className={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <h3 className="section-title">Añadir alimento</h3>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input className="input" style={{paddingLeft:'2.25rem'}}
                placeholder="Buscar alimento..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            {foods.length > 0 && (
              <div className={styles.foodList}>
                {foods.map((f, idx) => (
                  <button key={f.id || `off-${idx}`} className={styles.foodOption}
                    onClick={() => selectFood(f)}
                  >
                    <span>{f.name}{f.source === 'openfoodfacts' ? ' 🌐' : ''}</span>
                    <span className={styles.foodCal}>{f.calories_per_100g} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}
            <div className={styles.modalFields}>
              <div>
                <label className="label">Cantidad (g)</label>
                <input className="input" type="number" min="1" value={addForm.quantity}
                  onChange={e => setAddForm(p => ({...p, quantity: e.target.value}))} />
              </div>
              <div>
                <label className="label">Comida</label>
                <select className="input" value={addForm.meal_type}
                  onChange={e => setAddForm(p => ({...p, meal_type: e.target.value}))}>
                  {MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={addEntry}><Plus size={16} /> Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
