import React, { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Shield, Crown, Save, Key, Users, ChevronDown } from 'lucide-react';
import styles from './ProfilePage.module.css';

const ROLES = [
  { value:'user',    label:'Usuario',      icon:'👤', badge:'badge-gray' },
  { value:'premium', label:'Premium',      icon:'👑', badge:'badge-purple' },
  { value:'admin',   label:'Administrador',icon:'🛡️', badge:'badge-blue' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState({
    name: user?.name || '',
    daily_calorie_goal: user?.daily_calorie_goal || 2000,
    weight: user?.weight || '',
    height: user?.height || '',
    age: user?.age || '',
    activity_level: user?.activity_level || 'moderate',
  });
  const [pwForm, setPwForm]     = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Admin
  const [allUsers, setAllUsers]   = useState([]);
  const [loadingU, setLoadingU]   = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingU(true);
    try {
      const { data } = await usersAPI.getAll();
      setAllUsers(data);
    } catch { toast.error('Error cargando usuarios'); }
    finally { setLoadingU(false); }
  }, [isAdmin]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(profile);
      updateUser(profile);
      toast.success('Perfil guardado');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    setSavingPw(true);
    try {
      await usersAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Contraseña actualizada');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSavingPw(false); }
  };

  const changeRole = async (userId, role) => {
    try {
      await usersAPI.updateRole(userId, role);
      toast.success('Rol actualizado');
      setAllUsers(prev => prev.map(u => u.id === userId ? {...u, role} : u));
    } catch { toast.error('Error al cambiar rol'); }
  };

  const RoleIcon = ({ role }) => {
    if (role === 'admin')   return <span className={`${styles.rolePill} ${styles.admin}`}><Shield size={12}/> Admin</span>;
    if (role === 'premium') return <span className={`${styles.rolePill} ${styles.premium}`}><Crown size={12}/> Premium</span>;
    return <span className={`${styles.rolePill} ${styles.user}`}><User size={12}/> Usuario</span>;
  };

  return (
    <div className={`${styles.page} fade-in`}>
      <h1 className="page-title">Perfil</h1>

      <div className={styles.layout}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* Avatar card */}
          <div className={`card ${styles.avatarCard}`}>
            <div className={styles.avatarBig}>{user?.name?.charAt(0).toUpperCase()}</div>
            <div className={styles.avatarInfo}>
              <p className={styles.avatarName}>{user?.name}</p>
              <p className={styles.avatarEmail}>{user?.email}</p>
              <RoleIcon role={user?.role} />
            </div>
          </div>

          {/* Datos personales */}
          <div className={`card ${styles.section}`}>
            <h3 className="section-title"><User size={16}/> Datos personales</h3>
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className="label">Nombre</label>
                <input className="input" value={profile.name} onChange={e => setProfile(p=>({...p,name:e.target.value}))} />
              </div>
              <div>
                <label className="label">Objetivo calórico (kcal)</label>
                <input className="input" type="number" value={profile.daily_calorie_goal}
                  onChange={e => setProfile(p=>({...p,daily_calorie_goal:+e.target.value}))} />
              </div>
              <div>
                <label className="label">Nivel de actividad</label>
                <select className="input" value={profile.activity_level} onChange={e => setProfile(p=>({...p,activity_level:e.target.value}))}>
                  <option value="sedentary">Sedentario</option>
                  <option value="light">Ligero</option>
                  <option value="moderate">Moderado</option>
                  <option value="active">Activo</option>
                  <option value="very_active">Muy activo</option>
                </select>
              </div>
              <div>
                <label className="label">Peso (kg)</label>
                <input className="input" type="number" step="0.1" value={profile.weight}
                  onChange={e => setProfile(p=>({...p,weight:e.target.value}))} />
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input className="input" type="number" value={profile.height}
                  onChange={e => setProfile(p=>({...p,height:e.target.value}))} />
              </div>
              <div>
                <label className="label">Edad</label>
                <input className="input" type="number" value={profile.age}
                  onChange={e => setProfile(p=>({...p,age:e.target.value}))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{marginTop:'.5rem'}}>
              {saving ? <span className="spinner"/> : <Save size={15}/>}
              {saving ? ' Guardando...' : ' Guardar cambios'}
            </button>
          </div>

          {/* Cambiar contraseña */}
          <div className={`card ${styles.section}`}>
            <h3 className="section-title"><Key size={16}/> Cambiar contraseña</h3>
            <div className={styles.formCol}>
              <div>
                <label className="label">Contraseña actual</label>
                <input className="input" type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm(p=>({...p,currentPassword:e.target.value}))} />
              </div>
              <div>
                <label className="label">Nueva contraseña</label>
                <input className="input" type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm(p=>({...p,newPassword:e.target.value}))} />
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input className="input" type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p=>({...p,confirm:e.target.value}))} />
              </div>
            </div>
            <button className="btn btn-secondary" onClick={savePassword} disabled={savingPw} style={{marginTop:'.75rem'}}>
              {savingPw ? <><span className="spinner"/> Actualizando...</> : <><Key size={14}/> Actualizar contraseña</>}
            </button>
          </div>
        </div>

        {/* Right column: Admin panel */}
        {isAdmin && (
          <div className={styles.rightCol}>
            <div className={`card ${styles.section}`}>
              <h3 className="section-title"><Users size={16}/> Panel de administración</h3>
              <p className={styles.adminNote}>Como administrador puedes cambiar el rol de cualquier usuario.</p>

              {loadingU
                ? <div className="spinner" style={{margin:'2rem auto'}}/>
                : (
                  <div className={styles.userTable}>
                    <div className={styles.tableHead}>
                      <span>Usuario</span>
                      <span>Rol actual</span>
                      <span>Cambiar rol</span>
                    </div>
                    {allUsers.map(u => (
                      <div key={u.id} className={`${styles.tableRow} ${u.id === user?.id ? styles.selfRow : ''}`}>
                        <div className={styles.userCell}>
                          <div className={styles.miniAvatar}>{u.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className={styles.userName}>{u.name} {u.id === user?.id && <span className={styles.youTag}>(tú)</span>}</p>
                            <p className={styles.userEmail}>{u.email}</p>
                          </div>
                        </div>
                        <RoleIcon role={u.role} />
                        <div className={styles.roleSelect}>
                          <select
                            className="input"
                            style={{padding:'.4rem .7rem',fontSize:'.8rem'}}
                            value={u.role}
                            disabled={u.id === user?.id}
                            onChange={e => changeRole(u.id, e.target.value)}
                          >
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
