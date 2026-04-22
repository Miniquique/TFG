import React, { useState, useEffect, useCallback } from 'react';
import { menusAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Sparkles, CalendarDays, Trash2, ChevronDown, ChevronUp, Crown, Lock, Check, Plus } from 'lucide-react';
import styles from './MenusPage.module.css';

const MEAL_LABELS = { desayuno:'🌅 Desayuno', almuerzo:'☀️ Almuerzo', comida:'🍽️ Comida', merienda:'🍎 Merienda', cena:'🌙 Cena' };

export default function MenusPage() {
  const { user } = useAuth();
  const [menus, setMenus]               = useState([]);
  const [templates, setTemplates]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expanded, setExpanded]         = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState(new Set());
  const [templateDays, setTemplateDays] = useState(7);
  const [generating, setGen]            = useState(false);
  const [form, setForm]                 = useState({ days:7, preferences:'', exclude:'' });

  const isPremium = user?.role === 'premium' || user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [menusRes, templatesRes] = await Promise.all([
        menusAPI.getAll(),
        menusAPI.getTemplates()
      ]);
      setMenus(menusRes.data);
      setTemplates(templatesRes.data);
    } catch { 
      toast.error('Error cargando datos'); 
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleTemplate = (templateId) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const saveSelectedTemplates = async () => {
    if (selectedTemplates.size === 0) {
      toast.error('Selecciona al menos una plantilla');
      return;
    }

    setGen(true);
    try {
      for (const templateId of selectedTemplates) {
        await menusAPI.selectTemplate(templateId, templateDays);
      }
      toast.success(`¡${selectedTemplates.size} menú(s) agregado(s)!`);
      setShowMultiSelect(false);
      setSelectedTemplates(new Set());
      setTemplateDays(7);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando menús');
    } finally { 
      setGen(false); 
    }
  };

  const generate = async () => {
    setGen(true);
    try {
      await menusAPI.generate(form);
      toast.success('¡Menú generado con IA!');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error generando menú');
    } finally { setGen(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este menú?')) return;
    await menusAPI.remove(id);
    toast.success('Menú eliminado');
    load();
  };

  const openMenu = async (menu) => {
    if (expanded === menu.id) { setExpanded(null); return; }
    try {
      const { data } = await menusAPI.getById(menu.id);
      setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, content: data.content } : m));
      setExpanded(menu.id);
    } catch { toast.error('Error cargando menú'); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="spinner" style={{width:36,height:36}}/></div>;

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Menús con IA</h1>
          <p className={styles.sub}>Genera planes alimenticios semanales personalizados con inteligencia artificial</p>
        </div>
        <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
          <button className="btn btn-secondary" onClick={() => setShowMultiSelect(true)}>
            <Plus size={16}/> Elegir plantillas
          </button>
          {isPremium && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Sparkles size={16}/> Generar menú
            </button>
          )}
        </div>
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <div className={`card ${styles.upsell}`}>
          <div className={styles.upsellIcon}><Crown size={28}/></div>
          <div>
            <h3 className={styles.upsellTitle}>Función Premium</h3>
            <p className={styles.upsellText}>La generación de menús con IA está disponible para usuarios Premium y Administradores. Contacta con el administrador para actualizar tu cuenta.</p>
          </div>
          <Lock size={20} color="var(--gray-300)"/>
        </div>
      )}

      {/* Lista de menús */}
      {menus.length === 0
        ? <div className={`card ${styles.empty}`}>
            <CalendarDays size={40} color="#d1d5db"/>
            <p>{isPremium ? 'Aún no has generado ningún menú. ¡Empieza ahora!' : 'No hay menús disponibles.'}</p>
          </div>
        : menus.map(menu => {
            const isOpen = expanded === menu.id;
            const content = menu.content ? (typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content) : null;
            return (
              <div key={menu.id} className={`card ${styles.menuCard}`}>
                <div className={styles.menuHeader} onClick={() => openMenu(menu)}>
                  <div className={styles.menuMeta}>
                    <CalendarDays size={18} color="var(--green-600)"/>
                    <div>
                      <p className={styles.menuTitle}>{menu.title}</p>
                      <p className={styles.menuDate}>{new Date(menu.created_at).toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})}</p>
                    </div>
                  </div>
                  <div className={styles.menuRight}>
                    {menu.total_calories && (
                      <span className="badge badge-green">{Math.round(menu.total_calories)} kcal/día</span>
                    )}
                    {menu.is_ai_generated && <span className="badge badge-purple"><Sparkles size={11}/> IA</span>}
                    <button className="btn btn-ghost" style={{padding:'.3rem'}} onClick={e=>{e.stopPropagation();remove(menu.id);}}>
                      <Trash2 size={14}/>
                    </button>
                    {isOpen ? <ChevronUp size={18} color="var(--gray-400)"/> : <ChevronDown size={18} color="var(--gray-400)"/>}
                  </div>
                </div>

                {isOpen && content?.days && (
                  <div className={styles.menuContent}>
                    {content.description && <p className={styles.menuDesc}>{content.description}</p>}
                    <div className={styles.daysGrid}>
                      {content.days.map(day => (
                        <div key={day.day} className={styles.dayCard}>
                          <div className={styles.dayHeader}>
                            <span className={styles.dayNum}>Día {day.day}</span>
                            <span className={styles.dayName}>{day.day_name}</span>
                            <span className={styles.dayCal}>{day.total_calories} kcal</span>
                          </div>
                          <div className={styles.meals}>
                            {Object.entries(day.meals || {}).map(([type, meal]) => (
                              <div key={type} className={styles.meal}>
                                <p className={styles.mealType}>{MEAL_LABELS[type] || type}</p>
                                <p className={styles.mealName}>{meal.name}</p>
                                <p className={styles.mealDesc}>{meal.description}</p>
                                <span className={styles.mealCal}>{meal.calories} kcal</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
      }

      {/* Modal generar */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <Sparkles size={22} color="var(--green-600)"/>
              <h3 className="section-title" style={{margin:0}}>Generar menú con IA</h3>
            </div>
            <p style={{fontSize:'.875rem',color:'var(--gray-500)'}}>La IA tendrá en cuenta tu despensa actual y tus macros objetivo.</p>

            <div>
              <label className="label">Número de días</label>
              <select className="input" value={form.days} onChange={e => setForm(p=>({...p,days:+e.target.value}))}>
                {[3,5,7,14].map(d => <option key={d} value={d}>{d} días</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preferencias alimentarias (opcional)</label>
              <input className="input" placeholder="Ej: vegetariano, bajo en carbohidratos, mediterráneo..." value={form.preferences} onChange={e => setForm(p=>({...p,preferences:e.target.value}))} />
            </div>
            <div>
              <label className="label">Alimentos a excluir (opcional)</label>
              <input className="input" placeholder="Ej: nueces, marisco, gluten..." value={form.exclude} onChange={e => setForm(p=>({...p,exclude:e.target.value}))} />
            </div>

            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={generate} disabled={generating}>
                {generating ? <><span className="spinner"/> Generando...</> : <><Sparkles size={15}/> Generar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Seleccionar Múltiples Plantillas */}
      {showMultiSelect && (
        <div className={styles.overlay} onClick={() => setShowMultiSelect(false)}>
          <div className={`card ${styles.multiSelectModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <Plus size={22} color="var(--green-600)"/>
              <h3 className="section-title" style={{margin:0}}>Elegir plantillas de menú</h3>
            </div>
            <p style={{fontSize:'.875rem',color:'var(--gray-500)',marginBottom:'1rem'}}>Selecciona una o más plantillas para guardar como tus menús.</p>

            <div style={{marginBottom:'1.5rem'}}>
              <label className="label">Número de días para cada menú</label>
              <select 
                className="input" 
                value={templateDays} 
                onChange={e => setTemplateDays(+e.target.value)}
              >
                {[3,5,7,14].map(d => <option key={d} value={d}>{d} días</option>)}
              </select>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'1.5rem', maxHeight:'400px', overflowY:'auto'}}>
              {templates.map(template => (
                <div 
                  key={template.id} 
                  className={`${styles.templateOption} ${selectedTemplates.has(template.id) ? styles.templateOptionSelected : ''}`}
                  onClick={() => toggleTemplate(template.id)}
                  style={{cursor:'pointer'}}
                >
                  <div style={{display:'flex', alignItems:'flex-start', gap:'.75rem'}}>
                    <div style={{
                      width:'20px',
                      height:'20px',
                      border:'2px solid var(--gray-300)',
                      borderRadius:'4px',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      marginTop:'.2rem',
                      backgroundColor: selectedTemplates.has(template.id) ? 'var(--green-600)' : 'transparent',
                      borderColor: selectedTemplates.has(template.id) ? 'var(--green-600)' : 'var(--gray-300)',
                      transition:'all .2s'
                    }}>
                      {selectedTemplates.has(template.id) && <Check size={14} color="white" strokeWidth={3}/>}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{margin:'0 0 .3rem 0', fontWeight:600, fontSize:'.95rem'}}>{template.name}</p>
                      <p style={{margin:'0 0 .5rem 0', fontSize:'.8rem', color:'var(--gray-500)'}}>{template.description}</p>
                      <span className="badge badge-green" style={{fontSize:'.75rem'}}>{template.total_calories} kcal/día</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setShowMultiSelect(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={saveSelectedTemplates} 
                disabled={generating || selectedTemplates.size === 0}
              >
                {generating ? (
                  <><span className="spinner"/> Guardando...</>
                ) : (
                  <><Check size={15}/> Agregar {selectedTemplates.size > 0 ? `(${selectedTemplates.size})` : ''}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

