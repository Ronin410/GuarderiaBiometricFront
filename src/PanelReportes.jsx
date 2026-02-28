import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, UserCheck, FileText, RefreshCw, Calendar as CalendarIcon, CheckCircle, ShieldAlert } from 'lucide-react';

//const API_URL = 'https://guarderiabiometricback.onrender.com';
const API_URL = 'http://localhost:8099';

const PanelReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const nombreGuarderia = localStorage.getItem('nombre_guarderia') || 'BioSafe Kiosk';

  // Función para convertir "DD/MM/YYYY HH:mm" a un objeto Date real para poder comparar
  const parseFechaBackend = (fechaStr) => {
    if (!fechaStr) return new Date(0);
    const [fecha, hora] = fechaStr.split(' ');
    const [dia, mes, año] = fecha.split('/');
    // Formato ISO: YYYY-MM-DDTHH:mm:00
    return new Date(`${año}-${mes}-${dia}T${hora}:00`);
  };

  const obtenerReportes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reportes-asistencia`, {
        params: { inicio: fechaInicio, fin: fechaFin }
      });
      
      let datos = Array.isArray(res.data) ? res.data : [];

      // --- LÓGICA DE ORDENAMIENTO ASCENDENTE ---
      datos.sort((a, b) => {
        return parseFechaBackend(a.fecha) - parseFechaBackend(b.fecha);
      });

      setReportes(datos);
    } catch (error) {
      console.error("Error al obtener reportes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerReportes();
  }, [fechaInicio, fechaFin]);

  return (
    <div className="min-h-screen bg-slate-50/50 -m-4 p-8 animate-in fade-in duration-500">
      
      {/* TÍTULO PARA IMPRESIÓN */}
      <div className="hidden print:block border-b-4 border-slate-900 pb-6 mb-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900">{nombreGuarderia}</h1>
            <h2 className="text-xl font-bold uppercase text-violet-600">Reporte Cronológico de Asistencia</h2>
          </div>
          <div className="text-right">
            <p className="text-slate-600 font-bold">Periodo: {fechaInicio} al {fechaFin}</p>
            <p className="text-slate-400 text-[10px] uppercase font-black">Generado: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE FILTROS */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/60 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
            <CalendarIcon size={12} className="text-violet-500" /> Fecha Inicial
          </label>
          <input 
            type="date" 
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-bold shadow-inner"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
            <CalendarIcon size={12} className="text-violet-500" /> Fecha Final
          </label>
          <input 
            type="date" 
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-bold shadow-inner"
          />
        </div>
        <div className="flex items-end gap-3">
          <button 
            onClick={obtenerReportes}
            className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => window.print()} 
            disabled={reportes.length === 0}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-200 active:scale-95"
          >
            <Download size={20} /> IMPRIMIR REPORTE
          </button>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white print:bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 print:bg-slate-50 border-b-2 border-slate-100">
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Fecha / Hora</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Alumno</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Responsable</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Movimiento</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportes.map((reg, i) => (
                <tr key={i} className="hover:bg-violet-50/30 transition-colors group">
                  <td className="p-6 text-sm font-bold text-slate-500 whitespace-nowrap">
                    {reg.fecha}
                  </td>
                  <td className="p-6">
                    <span className="text-base font-black text-slate-900 uppercase tracking-tight">
                      {reg.hijo_nombre}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-violet-600 flex items-center gap-2">
                        <UserCheck size={16} className="text-violet-400" /> {reg.tutor_nombre}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl border-2 uppercase tracking-widest shadow-sm inline-block w-24 ${
                      reg.tipo === 'ENTRADA' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {reg.tipo}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <div title="Aseado" className={`p-2 rounded-lg border ${reg.aseado ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-rose-50 border-rose-100 text-rose-400'}`}>
                        <CheckCircle size={18} />
                      </div>
                      <div title="Golpe" className={`p-2 rounded-lg border ${reg.reporte_golpe ? 'bg-red-50 border-red-200 text-red-500 animate-pulse shadow-sm shadow-red-100' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                        <ShieldAlert size={18} />
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[200px]">
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        {reg.observaciones || "Sin observaciones."}
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* PIE DE PÁGINA PARA IMPRESIÓN */}
      <div className="hidden print:flex justify-around items-center mt-20 pt-10 border-t-2 border-slate-200">
        <div className="text-center w-64 pt-4 border-t-2 border-slate-900">
          <p className="text-[12px] font-black text-slate-900 uppercase">Firma de Dirección</p>
        </div>
        <div className="text-center w-64 pt-4 border-t-2 border-slate-900">
          <p className="text-[12px] font-black text-slate-900 uppercase">Sello Institucional</p>
        </div>
      </div>
    </div>
  );
};

export default PanelReportes;