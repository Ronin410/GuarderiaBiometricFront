import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { 
  UserPlus, ScanEye, Baby, AlertCircle, Users, Search, 
  ClipboardList, TrendingUp, ShieldCheck, ArrowRightCircle, 
  Lock, LogOut, CheckCircle, KeyRound, UserCog, RefreshCw, X
} from 'lucide-react';

import GestionHijos from './GestionHijos';
import VistaBitacora from './VistaBitacora';
import PanelReportes from './PanelReportes';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const slug = localStorage.getItem('guarderia_slug');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (slug) config.headers['X-Guarderia-Slug'] = slug;
  return config;
});

const API_URL = 'https://guarderiabiometricback.onrender.com';

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

  const cargarTodosLosPadres = async () => {
    try {
      const res = await axios.get(`${API_URL}/buscar-padres?q=`);
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
      const res = await axios.post(`${API_URL}/login`, { username: loginUsername, password: loginPassword });
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
    }
  };

  const verificarPinAdmin = async () => {
    try {
      const res = await axios.post(`${API_URL}/verificar-pin`, { pin: adminPin });
      if (res.data.message === "PIN válido") {
        setTab(tabPendiente);
        setShowAdminPinModal(false);
        setAdminPin('');
      }
    } catch (error) { alert("PIN incorrecto"); setAdminPin(''); }
  };

  const procesarRostro = async (endpoint) => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setLoading(true);
    const base64Image = imageSrc.split(',')[1];
    try {
      const payload = { imagen: base64Image, collection_id: `guarderia-rostros`, ...(endpoint === 'registrar' && { nombre }) };
      const response = await axios.post(`${API_URL}/${endpoint}`, payload);
      setResultado({ type: 'success', data: { ...response.data, nombre: endpoint === 'registrar' ? nombre : (response.data.nombre || response.data.padre) } });
      if (endpoint === 'registrar') {
        setPadreSeleccionado({ id: response.data.padre_id, nombre });
        setMostrarModalGestion(true);
        setNombre('');
      }
    } catch (error) { setResultado({ type: 'error', msg: error.response?.data?.error || 'No reconocido' }); }
    finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-10 rounded-[3rem] w-full max-w-md shadow-xl">
          <div className="flex justify-center mb-8">
            <div className="bg-violet-600 p-4 rounded-3xl shadow-lg">
              <ShieldCheck size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center text-slate-900 uppercase mb-2">BioSafe</h1>
          <p className="text-slate-500 text-center font-bold uppercase text-xs tracking-widest mb-10">Acceso Seguro</p>
          <form onSubmit={manejarLoginPrincipal} className="space-y-4">
            <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all" placeholder="Usuario" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all" placeholder="••••••••" />
            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-2xl uppercase tracking-tighter shadow-lg transition-all active:scale-95 mt-6">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      
      {/* MODAL GESTION */}
      {mostrarModalGestion && padreSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden relative border-t-8 border-t-violet-600">
            <button onClick={() => { setMostrarModalGestion(false); cargarTodosLosPadres(); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"><X size={32} /></button>
            <GestionHijos padreId={padreSeleccionado.id} nombrePadre={padreSeleccionado.nombre} onFinalizar={() => { setMostrarModalGestion(false); cargarTodosLosPadres(); }} />
          </div>
        </div>
      )}

      {/* MODAL PIN */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl">
            <KeyRound size={40} className="mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 uppercase mb-6 tracking-tight">PIN Requerido</h2>
            <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verificarPinAdmin()} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center text-3xl text-slate-900 mb-6 outline-none focus:ring-2 focus:ring-amber-500" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowAdminPinModal(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs">Cancelar</button>
              <button onClick={verificarPinAdmin} className="flex-1 bg-amber-500 py-3 rounded-xl font-black text-white uppercase shadow-lg">Validar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER TABLET-OPTIMIZED */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-200 pb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-violet-600 p-2.5 rounded-xl shadow-lg shadow-violet-600/20"><ShieldCheck size={24} className="text-white" /></div>
          <div>
            <h1 className="text-xl font-black uppercase leading-none text-slate-900 tracking-tighter">BioSafe</h1>
            <p className="text-[10px] text-violet-600 font-bold uppercase tracking-[0.2em]">{guarderiaInfo.nombre || 'Kiosk'}</p>
          </div>
        </div>
        <nav className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <button onClick={() => cambiarTab('identificar')} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap transition-all ${tab === 'identificar' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><ScanEye size={18} /> Kiosco</button>
          <button onClick={() => cambiarTab('registrar')} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap transition-all ${tab === 'registrar' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><UserPlus size={18} /> Registro</button>
          <button onClick={() => cambiarTab('admin')} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap transition-all ${tab === 'admin' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18} /> Familia</button>
          <button onClick={() => cambiarTab('bitacora')} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap transition-all ${tab === 'bitacora' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList size={18} /> Bitácora</button>
          <button onClick={() => cambiarTab('reportes')} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold whitespace-nowrap transition-all ${tab === 'reportes' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><TrendingUp size={18} /> Reportes</button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all ml-2 border-l border-slate-200"><LogOut size={20} /></button>
        </nav>
      </header>

      <main>
        {tab === 'reportes' && <PanelReportes />}
        {tab === 'bitacora' && <VistaBitacora />}
        
        {tab === 'admin' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-violet-100 p-3 rounded-2xl text-violet-600"><Search size={32} /></div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Directorio Familiar</h3>
              </div>
              <input type="text" placeholder="Buscar tutor..." className="w-full bg-slate-50 border border-slate-200 p-6 rounded-3xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 text-xl mb-6 transition-all" 
                onChange={async (e) => {
                  const res = await axios.get(`${API_URL}/buscar-padres?q=${e.target.value}`);
                  setTutoresEncontrados(res.data || []);
                }} />
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {tutoresEncontrados.map(tutor => (
                  <button key={tutor.id} onClick={() => { setPadreSeleccionado(tutor); setMostrarModalGestion(true); }} className="w-full bg-slate-50 border border-slate-100 hover:border-violet-300 hover:bg-violet-50 p-5 rounded-2xl flex justify-between items-center transition-all group">
                    <div className="text-left">
                      <p className="font-black text-lg uppercase text-slate-900 group-hover:text-violet-700">{tutor.nombre}</p>
                      <p className="text-[10px] font-black text-slate-400 group-hover:text-violet-500 uppercase tracking-widest">{tutor.hijos?.length || 0} hijos registrados</p>
                    </div>
                    <ArrowRightCircle size={24} className="text-slate-300 group-hover:text-violet-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(tab === 'identificar' || tab === 'registrar') && (
          <div className="grid lg:grid-cols-5 gap-10 animate-in fade-in duration-500">
            <div className="lg:col-span-3 space-y-6">
               {tab === 'registrar' && (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nombre Completo</label>
                   <input type="text" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-white border border-slate-200 p-5 rounded-[2rem] text-slate-900 text-lg focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm" />
                 </div>
               )}
               <div className="relative rounded-[3rem] overflow-hidden border-8 border-white bg-slate-200 shadow-xl aspect-video">
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" mirrored={true} />
                  {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"><RefreshCw className="animate-spin text-violet-600" size={48} /></div>}
               </div>
               <button onClick={() => procesarRostro(tab)} disabled={loading || (tab === 'registrar' && !nombre)} className="w-full py-6 bg-violet-600 hover:bg-violet-700 text-white rounded-[2rem] font-black uppercase text-xl shadow-lg active:scale-95 transition-all">
                 {loading ? 'Procesando...' : (tab === 'registrar' ? 'Confirmar Registro' : 'Escanear Rostro')}
               </button>
            </div>

            <div className="lg:col-span-2">
               {resultado ? (
                 <div className={`p-8 rounded-[3rem] border-2 animate-in zoom-in duration-300 bg-white shadow-xl ${resultado.type === 'success' ? 'border-emerald-100' : 'border-rose-100'}`}>
                    <div className="flex items-center gap-4 mb-8">
                      {resultado.type === 'success' ? <CheckCircle className="text-emerald-500" size={32} /> : <AlertCircle className="text-rose-500" size={32} />}
                      <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{resultado.type === 'success' ? 'Identificado' : 'Aviso'}</h3>
                    </div>
                    {resultado.type === 'success' ? (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-violet-600 text-[10px] font-black uppercase mb-1 tracking-widest">Tutor</p>
                          <p className="text-2xl font-bold text-slate-900 uppercase leading-tight">{resultado.data.nombre}</p>
                        </div>
                        {resultado.data.hijos?.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Hijos Autorizados:</p>
                            {resultado.data.hijos.map((h, i) => (
                              <div key={i} className="flex items-center gap-3 bg-violet-50 p-4 rounded-xl font-bold border border-violet-100">
                                <Baby size={18} className="text-violet-600" /> <span className="text-slate-700 uppercase italic">{h.nombre_niño || h.nombre}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : <p className="text-rose-600 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">{resultado.msg}</p>}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-300 rounded-[3rem] text-slate-400 bg-white shadow-sm">
                   <ScanEye size={60} className="mb-4 opacity-20 text-slate-900" />
                   <p className="font-bold uppercase text-xs tracking-widest leading-relaxed">Esperando escaneo<br/>biométrico...</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;