import React, { useEffect, useState } from 'react';
// 1. Importamos la instancia configurada en lugar de axios directamente
import api from './axiosConfig'; 
import { Calendar, User, CheckCircle, ShieldAlert, Clock, Search, RefreshCw } from 'lucide-react';

// Ya no necesitamos definir API_URL aquí
// const API_URL = 'http://localhost:8099';

const VistaBitacora = () => {
  const [niños, setNiños] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [busqueda, setBusqueda] = useState("");

  const fetchEstatus = async () => {
    setLoading(true);
    try {
      // 2. Usamos 'api' y una ruta relativa. El interceptor manejará el 401 automáticamente.
      const res = await api.get('/bitacora', {
        params: { fecha: fechaFiltro }
      });
      setNiños(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al obtener estatus de alumnos", err);
      // No es necesario redirigir aquí, el interceptor ya lo hizo si fue un 401
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstatus();
  }, [fechaFiltro]);

  const filtrados = niños.filter(n => 
    (n.hijo || n.nombre || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const getBadgeStyle = (estatus) => {
    switch(estatus) {
      case 'ENTRADA': 
        return 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-200/50';
      case 'SALIDA': 
        return 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-200/50';
      default: 
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 -m-4 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* CABECERA Y FILTROS */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Bitácora de Asistencia</h3>
            <div className="h-1 w-20 bg-violet-600 rounded-full"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-violet-500 transition-all shadow-sm">
              <Calendar size={20} className="text-slate-400" />
              <input 
                type="date" 
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="bg-transparent p-4 text-slate-900 outline-none font-bold text-sm w-full cursor-pointer"
              />
            </div>
            
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input 
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 pl-14 pr-6 py-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 font-medium transition-all shadow-inner"
              />
            </div>

            <button 
              onClick={fetchEstatus}
              className="p-4 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 shadow-lg shadow-violet-300 transition-all active:scale-95"
            >
              <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* GRID DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <RefreshCw className="animate-spin mx-auto text-violet-500 mb-4" size={48} />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando registros...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 text-center">
              <User size={64} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No se encontraron movimientos</p>
            </div>
          ) : (
            filtrados.map(niño => (
              <div key={niño.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-md hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 group flex flex-col justify-between h-full border-b-4 border-b-slate-200 hover:border-b-violet-500">
                
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-slate-100 p-4 rounded-2xl text-slate-600 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                      <User size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight">
                        {niño.hijo || niño.nombre}
                      </h4>
                    </div>
                  </div>

                  <div className={`w-full py-3 rounded-2xl text-center text-[11px] font-black border uppercase tracking-[0.2em] mb-4 ${getBadgeStyle(niño.estatus)}`}>
                    {niño.estatus === 'AUSENTE' ? '🏠 En Casa' : niño.estatus}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-colors ${niño.aseado ? 'bg-white border-blue-500 text-blue-600' : 'bg-rose-50 border-rose-200 text-rose-500'}`}>
                      <CheckCircle size={18}/>
                      <span className="text-[9px] font-black uppercase tracking-tighter">{niño.aseado ? 'Limpio' : 'Cambio'}</span>
                    </div>

                    <div className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-colors ${niño.golpe ? 'bg-amber-50 border-amber-500 text-amber-600 animate-pulse shadow-lg shadow-amber-200' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                      <ShieldAlert size={18}/>
                      <span className="text-[9px] font-black uppercase tracking-tighter">{niño.golpe ? 'Golpe' : 'Sin Novedad'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
                  <Clock size={14} className="text-violet-500"/>
                  <span className="text-xs font-bold text-slate-500">
                    {niño.fecha ? new Date(niño.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </span>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VistaBitacora;