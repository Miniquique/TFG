import React, { useState, useEffect, useCallback } from 'react';
import { pantryAPI, foodsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, Package, AlertTriangle, Edit2, Check, X } from 'lucide-react';
import styles from './PantryPage.module.css';

const CATEGORIES = ['Todas','Carnes','Pescados','Verduras','Frutas','Cereales','Lácteos y huevos','Legumbres','Frutos secos','Panadería','Grasas'];

export default function PantryPage() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('Todas');
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editQty, setEditQty]   = useState('');
  // add form
  const [foodSearch, setFoodSearch]   = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [addForm, setAddForm] = useState({ food_id:'', quantity:'', unit:'g', expiry_date:'', location:'despensa' });

  const load = useCallback(async () => {
    try {
      const { data } = await pantryAPI.get();
      setItems(data);
    } catch { toast.error('Error cargando despensa'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!foodSearch.trim()) { setFoodResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await foodsAPI.search({ search: foodSearch });
      setFoodResults(data);
    }, 350);
    return () => clearTimeout(t);
  }, [foodSearch]);

  const addItem = async () => {
    if (!addForm.food_id || !addForm.quantity) { toast.error('Selecciona alimento y cantidad'); return; }
    try {
      await pantryAPI.add(addForm);
      toast.success('Añadido a la despensa');
      setShowAdd(false);
      setAddForm({ food_id:'', quantity:'', unit:'g', expiry_date:'', location:'despensa' });
      setFoodSearch(''); setFoodResults([]);
      load();
    } catch { toast.error('Error al añadir'); }
  };

  const saveEdit = async (id) => {
    await pantryAPI.update(id, { quantity: editQty });
    toast.success('Actualizado');
    setEditId(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar de la despensa?')) return;
    await pantryAPI.remove(id);
    toast.success('Eliminado');
    load();
  };

  const filtered = items.filter(i => {
    const matchCat = filter === 'Todas' || i.category === filter;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Agrupar por categoría
  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000*60*60*24);
    return diff <= 3 && diff >= 0;
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="spinner" style={{width:36,height:36}}/></div>;

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Mi Despensa</h1>
          <p className={styles.sub}>{items.length} productos almacenados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Añadir producto
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className="input" style={{paddingLeft:'2.25rem'}}
            placeholder="Buscar en despensa..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.catScroll}>
          {CATEGORIES.map(c => (
            <button key={c}
              className={`${styles.catBtn} ${filter === c ? styles.catActive : ''}`}
              onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Items agrupados */}
      {Object.keys(grouped).length === 0
        ? <div className={`card ${styles.empty}`}>
            <Package size={40} color="#d1d5db" />
            <p>Tu despensa está vacía. ¡Añade productos o usa el escáner!</p>
          </div>
        : Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className={`card ${styles.group}`}>
            <h3 className={styles.catTitle}>{cat}</h3>
            <div className={styles.grid}>
              {catItems.map(item => (
                <div key={item.id} className={`${styles.item} ${isExpired(item.expiry_date) ? styles.expired : isExpiringSoon(item.expiry_date) ? styles.expiring : ''}`}>
                  {isExpired(item.expiry_date) && <div className={styles.expiredBadge}><AlertTriangle size={11} /> Caducado</div>}
                  {isExpiringSoon(item.expiry_date) && !isExpired(item.expiry_date) && <div className={styles.expireBadge}><AlertTriangle size={11} /> Caduca pronto</div>}

                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemCal}>{item.calories_per_100g} kcal/100g</p>

                  <div className={styles.itemMacros}>
                    <span>P {item.protein_per_100g}g</span>
                    <span>C {item.carbs_per_100g}g</span>
                    <span>G {item.fat_per_100g}g</span>
                  </div>

                  <div className={styles.itemBottom}>
                    {editId === item.id
                      ? <div className={styles.editRow}>
                          <input className="input" style={{padding:'.3rem .6rem',fontSize:'.85rem',width:80}}
                            type="number" value={editQty} onChange={e => setEditQty(e.target.value)} />
                          <span style={{fontSize:'.8rem',color:'var(--gray-400)'}}>{item.unit}</span>
                          <button className="btn btn-primary" style={{padding:'.3rem .6rem'}} onClick={() => saveEdit(item.id)}><Check size={13}/></button>
                          <button className="btn btn-ghost" style={{padding:'.3rem .6rem'}} onClick={() => setEditId(null)}><X size={13}/></button>
                        </div>
                      : <div className={styles.qtyRow}>
                          <span className={styles.qty}>{item.quantity} {item.unit}</span>
                          <button className="btn btn-ghost" style={{padding:'.3rem'}} onClick={() => { setEditId(item.id); setEditQty(item.quantity); }}>
                            <Edit2 size={13}/>
                          </button>
                          <button className="btn btn-danger" style={{padding:'.3rem'}} onClick={() => remove(item.id)}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                    }
                    {item.expiry_date && (
                      <p className={styles.expiry}>Cad: {new Date(item.expiry_date).toLocaleDateString('es-ES')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }

      {/* Modal añadir */}
      {showAdd && (
        <div className={styles.overlay} onClick={() => setShowAdd(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <h3 className="section-title">Añadir a la despensa</h3>

            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input className="input" style={{paddingLeft:'2.25rem'}}
                placeholder="Buscar alimento..."
                value={foodSearch} onChange={e => setFoodSearch(e.target.value)} />
            </div>
            {foodResults.length > 0 && (
              <div className={styles.foodList}>
                {foodResults.map(f => (
                  <button key={f.id} className={styles.foodOption}
                    onClick={() => { setAddForm(p=>({...p,food_id:f.id})); setFoodSearch(f.name); setFoodResults([]); }}>
                    <span>{f.name}</span>
                    <span style={{fontSize:'.8rem',color:'var(--gray-400)'}}>{f.calories_per_100g} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.formGrid}>
              <div>
                <label className="label">Cantidad</label>
                <input className="input" type="number" min="0" value={addForm.quantity}
                  onChange={e => setAddForm(p=>({...p,quantity:e.target.value}))} />
              </div>
              <div>
                <label className="label">Unidad</label>
                <select className="input" value={addForm.unit} onChange={e => setAddForm(p=>({...p,unit:e.target.value}))}>
                  {['g','kg','ml','l','ud','paquete'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Caducidad (opcional)</label>
                <input className="input" type="date" value={addForm.expiry_date}
                  onChange={e => setAddForm(p=>({...p,expiry_date:e.target.value}))} />
              </div>
              <div>
                <label className="label">Ubicación</label>
                <select className="input" value={addForm.location} onChange={e => setAddForm(p=>({...p,location:e.target.value}))}>
                  {['despensa','nevera','congelador','armario'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={addItem}><Plus size={15}/> Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
