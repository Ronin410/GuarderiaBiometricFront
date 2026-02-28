import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
// 1. IMPORTAMOS TU INSTANCIA CONFIGURADA
import api from './axiosConfig'; 
import { 
  UserPlus, ScanEye, Baby, AlertCircle, Users, Search, 
  ClipboardList, TrendingUp, ShieldCheck, ArrowRightCircle, 
  Lock, LogOut, CheckCircle, KeyRound, RefreshCw, X, Send, Clock, LogOut as LogOutIcon
} from 'lucide-react';

import GestionHijos from './GestionHijos';
import VistaBitacora from './VistaBitacora';
import PanelReportes from './PanelReportes';

// --- YA NO NECESITAMOS EL INTERCEPTOR NI API_URL AQUÍ ---

// Configuración para cámara VERTICAL (Portrait)
const videoConstraints = {
  width: { ideal: 720 },
  height: { ideal: 1280 },
  facingMode: "user",
  aspectRatio: 0.75 
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [guarderiaInfo, setGuarderiaInfo] = useState({ nombre: '', slug: '' });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [tab, setTab] = useState('identificar');
  const [nombre, setNombre] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef(null);

  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [tabPendiente, setTabPendiente] = useState(null);

  const [padreSeleccionado, setPadreSeleccionado] = useState(null);
  const [tutoresEncontrados, setTutoresEncontrados] = useState([]);
  const [mostrarModalGestion, setMostrarModalGestion] = useState(false);

  const [formAsistencia, setFormAsistencia] = useState({});
  const [seleccionados, setSeleccionados] = useState([]);

  const cargarTodosLosPadres = async () => {
    try {
      // 2. CAMBIO A RUTAS RELATIVAS USANDO 'api'
      const res = await api.get('/buscar-padres?q=');
      setTutoresEncontrados(res.data || []);
    } catch (err) { console.error("Error:", err); }
  };

  useEffect(() => {
    if (tab === 'admin' && isLoggedIn) cargarTodosLosPadres();
  }, [tab, isLoggedIn]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(localStorage.getItem('role'));
      setGuarderiaInfo({ 
        nombre: localStorage.getItem('guarderia_nombre'), 
        slug: localStorage.getItem('guarderia_slug') 
      });
    }
  }, []);

  const manejarLoginPrincipal = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.post('/login', { username: loginUsername, password: loginPassword });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.rol);
        localStorage.setItem('guarderia_nombre', res.data.guarderia_nombre);
        localStorage.setItem('guarderia_slug', res.data.guarderia_slug);
        setIsLoggedIn(true);
        setUserRole(res.data.rol);
        setGuarderiaInfo({ nombre: res.data.guarderia_nombre, slug: res.data.guarderia_slug });
      }
    } catch (error) { alert("Credenciales incorrectas"); }
  };

  const cambiarTab = (targetTab) => {
    const tabsProtegidas = ['admin', 'bitacora', 'reportes'];
    if (tabsProtegidas.includes(targetTab) && userRole !== 'admin') {
      setTabPendiente(targetTab);
      setShowAdminPinModal(true);
    } else {
      setTab(targetTab);
      setResultado(null);
      setNombre('');
      setSeleccionados([]);
      setFormAsistencia({});
    }
  };

  const verificarPinAdmin = async () => {
    try {
      const res = await api.post('/verificar-pin', { pin: adminPin });
      if (res.data.message === "PIN válido") {
        setTab(tabPendiente);
        setShowAdminPinModal(false);
        setAdminPin('');
      }
    } catch (error) { alert("PIN incorrecto"); setAdminPin(''); }
  };

  const procesarRostro = async (endpoint) => {
    if (endpoint === 'registrar' && !nombre.trim()) {
      alert("⚠️ Error: No has escrito un nombre para el registro.");
      return;
    }

    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert("No se pudo capturar la imagen de la cámara.");
      return;
    }
    setLoading(true);
    const base64Image = imageSrc.split(',')[1];
    try {
      const payload = { imagen: base64Image, collection_id: `guarderia-rostros`, ...(endpoint === 'registrar' && { nombre }) };
      const response = await api.post(`/${endpoint}`, payload);
      setResultado({ type: 'success', data: { ...response.data, nombre: endpoint === 'registrar' ? nombre : (response.data.nombre || response.data.padre) } });
      
      setSeleccionados([]);
      setFormAsistencia({});

      if (endpoint === 'registrar') {
        setPadreSeleccionado({ id: response.data.padre_id, nombre });
        setMostrarModalGestion(true);
        setNombre('');
      }
    } catch (error) { setResultado({ type: 'error', msg: error.response?.data?.error || 'No reconocido' }); }
    finally { setLoading(false); }
  };

  const manejarToggleHijo = (hijo) => {
    const hID = hijo.id || hijo.hijo_id;
    const estado = hijo.ultimo_estado;
    if (estado === "SALIDA") return;
    if (!seleccionados.includes(hID)) {
      if (estado === "ENTRADA") {
        const confirmar = window.confirm(`El niño ${hijo.nombre_niño || hijo.nombre} ya está en la guardería. ¿Deseas registrar su SALIDA?`);
        if (!confirmar) return;
      }
      setSeleccionados([...seleccionados, hID]);
    } else {
      setSeleccionados(seleccionados.filter(id => id !== hID));
    }
  };

  const registrarMultiplesAsistencias = async () => {
    if (seleccionados.length === 0) return alert("Selecciona al menos un niño");
    setLoading(true);
    try {
      const promesas = seleccionados.map(hijoId => {
        const hijoInfo = resultado.data.hijos.find(h => (h.id || h.hijo_id) === hijoId);
        const datos = formAsistencia[hijoId] || {};
        const esSalida = hijoInfo.ultimo_estado === "ENTRADA";
        return api.post('/confirmar-asistencia', {
          padre_id: resultado.data.padre_id || resultado.data.id,
          hijo_id: hijoId,
          aseado: esSalida ? false : (datos.aseado || false),
          reporte_golpe: esSalida ? false : (datos.golpes || false),
          observaciones: datos.observaciones || ""
        });
      });
      await Promise.all(promesas);
      alert("Movimientos registrados con éxito");
      setResultado(null);
      setSeleccionados([]);
    } catch (error) { alert("Error al procesar registros"); } 
    finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] w-full max-w-md shadow-xl text-center">
          <div className="inline-block bg-violet-600 p-4 rounded-3xl shadow-lg mb-6">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">BioSafe</h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-8">Acceso Seguro</p>
          <form onSubmit={manejarLoginPrincipal} className="space-y-4">
            <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all" placeholder="Usuario" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all" placeholder="••••••••" />
            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-2xl uppercase tracking-tighter shadow-lg transition-all active:scale-95">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col items-center mb-8 border-b border-slate-200 pb-6 gap-6 w-full">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-2 rounded-xl shadow-md"><ShieldCheck size={20} className="text-white" /></div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-black uppercase leading-none text-slate-900">BioSafe</h1>
            <p className="text-[9px] text-violet-600 font-bold uppercase tracking-widest">{guarderiaInfo.nombre || 'Kiosk'}</p>
          </div>
        </div>

        <nav className="w-full max-w-full overflow-x-auto no-scrollbar">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm min-w-max mx-auto">
            <button onClick={() => cambiarTab('identificar')} className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${tab === 'identificar' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><ScanEye size={18} /> Kiosco</button>
            <button onClick={() => cambiarTab('registrar')} className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${tab === 'registrar' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><UserPlus size={18} /> Registro</button>
            <button onClick={() => cambiarTab('admin')} className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${tab === 'admin' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18} /> Familia</button>
            <button onClick={() => cambiarTab('bitacora')} className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${tab === 'bitacora' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList size={18} /> Bitácora</button>
            <button onClick={() => cambiarTab('reportes')} className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${tab === 'reportes' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><TrendingUp size={18} /> Reportes</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl ml-2 border-l border-slate-100"><LogOut size={18} /></button>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto">
        {tab === 'reportes' && <PanelReportes />}
        {tab === 'bitacora' && <VistaBitacora />}
        
        {tab === 'admin' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-violet-100 p-3 rounded-2xl text-violet-600"><Search size={28} /></div>
                <h3 className="text-xl font-black uppercase text-slate-900">Directorio</h3>
              </div>
              <input type="text" placeholder="Buscar tutor..." className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 mb-6 transition-all" 
                onChange={async (e) => {
                  const res = await api.get(`/buscar-padres?q=${e.target.value}`);
                  setTutoresEncontrados(res.data || []);
                }} />
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {tutoresEncontrados.map(tutor => (
                  <button key={tutor.id} onClick={() => { setPadreSeleccionado(tutor); setMostrarModalGestion(true); }} className="w-full bg-slate-50 border border-slate-100 hover:bg-violet-50 p-4 rounded-xl flex justify-between items-center group transition-all">
                    <div className="text-left">
                      <p className="font-black uppercase text-slate-900">{tutor.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tutor.hijos?.length || 0} hijos</p>
                    </div>
                    <ArrowRightCircle size={20} className="text-slate-300 group-hover:text-violet-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(tab === 'identificar' || tab === 'registrar') && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500">
            <div className="w-full max-w-md space-y-6">
               {tab === 'registrar' && (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nombre Completo</label>
                   <input type="text" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none shadow-sm" />
                 </div>
               )}
               
               <div className="relative rounded-[3.5rem] overflow-hidden border-8 border-white bg-slate-200 shadow-2xl aspect-[3/4] mx-auto w-full group">
                  <Webcam 
                    audio={false} 
                    ref={webcamRef} 
                    screenshotFormat="image/jpeg" 
                    videoConstraints={videoConstraints}
                    className="absolute inset-0 w-full h-full object-cover" 
                    mirrored={true} 
                  />
                  
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-2 border-white/20 rounded-[3rem] relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-500 rounded-tl-2xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-500 rounded-tr-2xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-500 rounded-bl-2xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-500 rounded-br-2xl" />
                    </div>
                  </div>

                  {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                      <RefreshCw className="animate-spin text-violet-600" size={54} />
                    </div>
                  )}
               </div>

               <button 
                 onClick={() => procesarRostro(tab)} 
                 disabled={loading} 
                 className="w-full py-6 bg-violet-600 hover:bg-violet-700 text-white rounded-[2rem] font-black uppercase text-xl shadow-lg active:scale-95 transition-all"
               >
                 {loading ? 'Procesando...' : (tab === 'registrar' ? 'Confirmar Registro' : 'Escanear Rostro')}
               </button>
            </div>

            <div className="w-full max-w-md">
               {resultado ? (
                 <div className={`p-6 sm:p-8 rounded-[3rem] border-2 bg-white shadow-xl animate-in zoom-in duration-300 ${resultado.type === 'success' ? 'border-emerald-100' : 'border-rose-100'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      {resultado.type === 'success' ? <CheckCircle className="text-emerald-500" size={28} /> : <AlertCircle className="text-rose-500" size={28} />}
                      <h3 className="text-xl font-black uppercase text-slate-900">{resultado.type === 'success' ? 'Identificado' : 'Aviso'}</h3>
                    </div>
                    
                    {resultado.type === 'success' ? (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <p className="text-violet-600 text-[10px] font-black uppercase mb-1 tracking-widest">Tutor</p>
                          <p className="text-xl font-bold text-slate-900 uppercase">{resultado.data.nombre}</p>
                        </div>

                        {resultado.data.hijos?.length > 0 && (
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de los Niños:</p>
                            {resultado.data.hijos.map((h, i) => {
                              const hID = h.id || h.hijo_id;
                              const estaSeleccionado = seleccionados.includes(hID);
                              const estado = h.ultimo_estado || "AUSENTE";
                              const yaSalio = estado === "SALIDA";
                              const estaDentro = estado === "ENTRADA";

                              return (
                                <div key={i} className={`p-4 rounded-2xl border transition-all ${yaSalio ? 'bg-slate-100 opacity-60' : estaSeleccionado ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-white'}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" disabled={yaSalio} checked={estaSeleccionado} onChange={() => manejarToggleHijo(h)} className={`w-6 h-6 rounded-lg ${yaSalio ? 'cursor-not-allowed' : 'accent-violet-600 cursor-pointer'}`} />
                                        <div className="flex flex-col">
                                            <span className={`font-bold uppercase text-sm ${yaSalio ? 'line-through text-slate-400' : 'text-slate-700'}`}>{h.nombre_niño || h.nombre}</span>
                                            {yaSalio && <span className="text-[8px] font-bold text-rose-500 uppercase">Salida registrada</span>}
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${estaDentro ? 'bg-emerald-100 text-emerald-700' : yaSalio ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                                        {estado === "AUSENTE" || estado === "FUERA" ? "AUSENTE" : estado}
                                    </span>
                                  </div>

                                  {estaSeleccionado && !estaDentro && !yaSalio && (
                                    <div className="mt-4 space-y-3 pt-4 border-t border-violet-100">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setFormAsistencia({...formAsistencia, [hID]: {...formAsistencia[hID], aseado: !formAsistencia[hID]?.aseado}})} className={`py-3 rounded-xl text-[10px] font-black uppercase border ${formAsistencia[hID]?.aseado ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                {formAsistencia[hID]?.aseado ? 'Aseado ✓' : '¿Aseado?'}
                                            </button>
                                            <button onClick={() => setFormAsistencia({...formAsistencia, [hID]: {...formAsistencia[hID], golpes: !formAsistencia[hID]?.golpes}})} className={`py-3 rounded-xl text-[10px] font-black uppercase border ${formAsistencia[hID]?.golpes ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                {formAsistencia[hID]?.golpes ? 'Golpes !' : '¿Golpes?'}
                                            </button>
                                        </div>
                                        <input type="text" placeholder="Notas de entrada..." className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-violet-300" onChange={(e) => setFormAsistencia({...formAsistencia, [hID]: {...formAsistencia[hID], observaciones: e.target.value}})} />
                                    </div>
                                  )}

                                  {estaSeleccionado && estaDentro && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <LogOutIcon size={14} className="text-blue-600" />
                                            <span className="text-[10px] font-bold text-blue-700 uppercase">Listo para SALIDA</span>
                                        </div>
                                        <Clock size={14} className="text-blue-300" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <button onClick={registrarMultiplesAsistencias} disabled={seleccionados.length === 0 || loading} className={`w-full py-5 rounded-2xl font-black uppercase text-sm shadow-lg flex items-center justify-center gap-3 transition-all ${seleccionados.length > 0 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {loading ? <RefreshCw className="animate-spin" /> : <Send size={18} />}
                                Confirmar {seleccionados.length} Movimiento(s)
                            </button>
                          </div>
                        )}
                      </div>
                    ) : <p className="text-rose-600 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">{resultado.msg}</p>}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-300 rounded-[3rem] text-slate-400 bg-white">
                   <ScanEye size={48} className="mb-4 opacity-20" />
                   <p className="font-bold uppercase text-[10px] tracking-widest leading-relaxed">Esperando escaneo biométrico</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* MODALES */}
      {mostrarModalGestion && padreSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden relative border-t-8 border-t-violet-600 max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setMostrarModalGestion(false); cargarTodosLosPadres(); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"><X size={32} /></button>
            <GestionHijos padreId={padreSeleccionado.id} nombrePadre={padreSeleccionado.nombre} onFinalizar={() => { setMostrarModalGestion(false); cargarTodosLosPadres(); }} />
          </div>
        </div>
      )}

      {showAdminPinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm text-center shadow-2xl">
            <KeyRound size={40} className="mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 uppercase mb-6 tracking-tight">PIN Requerido</h2>
            <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verificarPinAdmin()} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center text-3xl mb-6 outline-none focus:ring-2 focus:ring-amber-500" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowAdminPinModal(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs">Cancelar</button>
              <button onClick={verificarPinAdmin} className="flex-1 bg-amber-500 py-3 rounded-xl font-black text-white uppercase shadow-lg">Validar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;