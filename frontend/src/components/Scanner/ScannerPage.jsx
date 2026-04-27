import React, { useState, useRef } from 'react';
import { scannerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ScanLine, Upload, Camera, CheckCircle, XCircle, ShoppingCart, RefreshCw, ImageIcon } from 'lucide-react';
import styles from './ScannerPage.module.css';

export default function ScannerPage() {
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState({});
  const [adding, setAdding] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setBase64(e.target.result.split(',')[1]);
      setResults(null);
      setSelected({});
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const scan = async () => {
    if (!base64) { toast.error('Sube una imagen primero'); return; }
    setScanning(true);
    try {
      const { data } = await scannerAPI.scan(base64, mediaType);
      setResults(data.items || []);
      // Seleccionar por defecto los que tienen match
      const sel = {};
      data.items.forEach((item, i) => { if (item.matched_food) sel[i] = true; });
      setSelected(sel);
      toast.success(`${data.items.length} artículos detectados`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al escanear');
    } finally {
      setScanning(false);
    }
  };

  const addToPantry = async () => {
    const toAdd = results
      .filter((_, i) => selected[i] && results[i].matched_food)
      .map(item => ({
        food_id: item.matched_food.id,
        name: item.matched_food.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'g',
        calories_per_100g: item.matched_food.calories_per_100g,
        protein_per_100g: item.matched_food.protein_per_100g,
        carbs_per_100g: item.matched_food.carbs_per_100g,
        fat_per_100g: item.matched_food.fat_per_100g,
      }));

    if (!toAdd.length) { toast.error('Selecciona al menos un artículo reconocido'); return; }
    setAdding(true);
    try {
      const { data } = await scannerAPI.addToPantry(toAdd);
      toast.success(data.message);
      setResults(null); setPreview(null); setBase64(null); setSelected({});
    } catch { toast.error('Error al añadir a la despensa'); }
    finally { setAdding(false); }
  };

  const toggleAll = () => {
    if (!results) return;
    const allSelected = results.every((_, i) => selected[i]);
    const sel = {};
    if (!allSelected) results.forEach((_, i) => { sel[i] = true; });
    setSelected(sel);
  };

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Escáner de Lista</h1>
          <p className={styles.sub}>Fotografía tu lista de la compra y añádela a la despensa automáticamente</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Upload panel */}
        <div className={`card ${styles.uploadPanel}`}>
          <h3 className="section-title"><ScanLine size={18} /> Subir imagen</h3>

          <div
            className={`${styles.dropZone} ${preview ? styles.hasPreview : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !preview && fileRef.current.click()}
          >
            {preview
              ? <img src={preview} alt="Lista de la compra" className={styles.preview} />
              : <div className={styles.dropInner}>
                <div className={styles.dropIcon}><ImageIcon size={32} /></div>
                <p className={styles.dropText}>Arrastra una foto aquí</p>
                <p className={styles.dropSub}>o haz clic para seleccionar</p>
                <span className={styles.dropFormats}>JPG, PNG, WEBP</span>
              </div>
            }
          </div>

          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />

          <div className={styles.uploadActions}>
            <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
              <Upload size={15} /> Seleccionar archivo
            </button>
            {preview && (
              <button className="btn btn-ghost" onClick={() => { setPreview(null); setBase64(null); setResults(null); }}>
                <RefreshCw size={15} /> Cambiar
              </button>
            )}
          </div>

          {base64 && (
            <button className={`btn btn-primary ${styles.scanBtn}`} onClick={scan} disabled={scanning}>
              {scanning
                ? <><span className="spinner" />  Analizando con IA...</>
                : <><Camera size={16} /> Escanear lista</>
              }
            </button>
          )}

          <div className={`${styles.tip}`}>
            <p>💡 <strong>Consejo:</strong> Las fotos bien iluminadas y sin sombras dan mejores resultados. El texto debe ser legible.</p>
          </div>
        </div>

        {/* Results panel */}
        <div className={`card ${styles.resultsPanel}`}>
          <div className={styles.resultsHeader}>
            <h3 className="section-title"><ShoppingCart size={18} /> Artículos detectados</h3>
            {results && results.length > 0 && (
              <button className="btn btn-ghost" style={{ fontSize: '.8rem' }} onClick={toggleAll}>
                Seleccionar todos
              </button>
            )}
          </div>

          {!results && (
            <div className={styles.resultsEmpty}>
              <ScanLine size={48} color="#d1d5db" />
              <p>Los artículos de tu lista aparecerán aquí tras el escaneo</p>
            </div>
          )}

          {results && results.length === 0 && (
            <div className={styles.resultsEmpty}>
              <XCircle size={48} color="#fca5a5" />
              <p>No se detectaron artículos. Prueba con una imagen más clara.</p>
            </div>
          )}

          {results && results.length > 0 && (
            <>
              <div className={styles.resultsList}>
                {results.map((item, i) => (
                  <div key={i} className={`${styles.resultItem} ${selected[i] ? styles.resultSelected : ''}`}>
                    <label className={styles.resultCheck}>
                      <input type="checkbox" checked={!!selected[i]} onChange={e => setSelected(p => ({ ...p, [i]: e.target.checked }))} />
                    </label>
                    <div className={styles.resultInfo}>
                      <p className={styles.resultName}>{item.name}</p>
                      <p className={styles.resultQty}>{item.quantity} {item.unit}</p>
                    </div>
                    <div className={styles.resultMatch}>
                      {item.matched_food
                        ? <span className={styles.matched}>
                          <CheckCircle size={14} /> {item.matched_food.name}
                          <span className={styles.matchCal}>{item.matched_food.calories_per_100g} kcal</span>
                        </span>
                        : <span className={styles.unmatched}>
                          <XCircle size={14} /> Sin coincidencia
                        </span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.addBar}>
                <p className={styles.addSummary}>
                  {Object.values(selected).filter(Boolean).length} de {results.length} seleccionados
                  {' · '}
                  {results.filter((r, i) => selected[i] && r.matched_food).length} se añadirán a la despensa
                </p>
                <button className="btn btn-primary" onClick={addToPantry} disabled={adding}>
                  {adding ? <><span className="spinner" /> Añadiendo...</> : <><ShoppingCart size={15} /> Añadir a despensa</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
