import React, { useState, useEffect } from 'react';
import api from './axiosConfig'; 
import { 
  Download, RefreshCw, Calendar as CalendarIcon, 
  CheckCircle, ShieldAlert, ChevronUp, ChevronDown 
} from 'lucide-react';

const stylePrint = `
  @media print {
    @page { size: landscape; margin: 1cm; }
    body { background: white !important; -webkit-print-color-adjust: exact; margin: 0 !important; display: flex; justify-content: center; }
    .no-print { display: none !important; }
    .print-container { width: 100% !important; max-width: 1100px; margin: 0 auto !important; padding: 0 !important; }
    .table-wrapper { border: 1px solid #e2e8f0 !important; border-radius: 0 !important; box-shadow: none !important; width: 100% !important; }
    table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; margin: 0 auto !important; }
    th, td { padding: 10px 6px !important; font-size: 10px !important; border: 1px solid #cbd5e1 !important; text-align: center !important; word-wrap: break-word !important; }
    .text-left-print { text-align: left !important; }
  }
`;

const PanelReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  
  // ESTADO PARA EL ORDENAMIENTO
  // 'fecha' es la clave del backend, 'hijo_nombre' es la clave para el nombre
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });

  const nombreGuarderia = localStorage.getItem('guarderia_nombre') || 'BioSafe Kiosk';

  const formatearFechaLocal = (fechaStr) => {
    if (!fechaStr) return "--:--";
    try {
      const [fechaPart, horaPart] = fechaStr.split(' ');
      const [año, mes, dia] = fechaPart.split('-');
      const [hora, min] = horaPart.split(':');
      const h = parseInt(hora);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${dia}/${mes}/${año} ${String(h12).padStart(2, '0')}:${min} ${ampm}`;
    } catch (e) { return fechaStr; }
  };

  const obtenerReportes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reportes-asistencia', {
        params: { inicio: fechaInicio, fin: fechaFin }
      });
      setReportes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener reportes", error);
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE ORDENAMIENTO
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const reportesOrdenados = React.useMemo(() => {
    let sortableItems = [...reportes];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key] || "";
        let valB = b[sortConfig.key] || "";

        // CASO ESPECIAL: ORDENAR POR FECHA (Timestamp)
        if (sortConfig.key === 'fecha') {
          const dateA = new Date(valA.replace(' ', 'T')).getTime();
          const dateB = new Date(valB.replace(' ', 'T')).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // CASO GENERAL: ORDENAR ALFABÉTICAMENTE (Nombres, etc.)
        const stringA = valA.toString().toLowerCase();
        const stringB = valB.toString().toLowerCase();

        if (stringA < stringB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (stringA > stringB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [reportes, sortConfig]);

  useEffect(() => {
    obtenerReportes();
  }, [fechaInicio, fechaFin]);

  // Icono dinámico según el estado de orden
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <div className="w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-violet-600" /> : <ChevronDown size={14} className="text-violet-600" />;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 animate-in fade-in duration-500 print-container">
      <style>{stylePrint}</style>

      {/* TÍTULO PARA IMPRESIÓN */}
      <div className="hidden print:block border-b-4 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-900">{nombreGuarderia}</h1>
            <h2 className="text-lg font-bold uppercase text-violet-600">Reporte de Asistencia</h2>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Periodo: {fechaInicio} al {fechaFin}</p>
            <p className="text-slate-500">Generado: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* FILTROS (no-print) */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg mb-8">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
            <CalendarIcon size={12} /> Fecha Inicial
          </label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
            <CalendarIcon size={12} /> Fecha Final
          </label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={obtenerReportes} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => window.print()} 
            disabled={reportes.length === 0} 
            className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            <Download size={18} /> IMPRIMIR
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="table-wrapper bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th 
                  onClick={() => handleSort('fecha')}
                  className="p-4 text-[10px] font-black text-slate-500 uppercase w-[15%] text-center cursor-pointer hover:bg-violet-50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">Fecha/Hora <SortIcon column="fecha" /></div>
                </th>
                <th 
                  onClick={() => handleSort('hijo_nombre')}
                  className="p-4 text-[10px] font-black text-slate-500 uppercase w-[20%] text-center cursor-pointer hover:bg-violet-50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">Alumno <SortIcon column="hijo_nombre" /></div>
                </th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-[20%] text-center">Responsable</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center w-[10%]">Mov.</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center w-[10%]">Estado</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-[25%] text-center">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportesOrdenados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No hay registros para este periodo.</td>
                </tr>
              ) : (
                reportesOrdenados.map((reg, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-500 text-center">
                      {formatearFechaLocal(reg.fecha)}
                    </td>
                    <td className="p-4 text-sm font-black text-slate-900 uppercase text-left-print">
                      {reg.hijo_nombre}
                    </td>
                    <td className="p-4 text-xs font-bold text-violet-600 text-left-print">
                      {reg.tutor_nombre}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${reg.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                        {reg.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <div className="flex flex-col items-center">
                          <CheckCircle size={18} className={reg.aseado ? 'text-emerald-500' : 'text-slate-300'} />
                          <span className={`text-[7px] font-black uppercase ${reg.aseado ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {reg.aseado ? 'Aseado' : 'No Aseado'}
                          </span>
                        </div>
                        {reg.reporte_golpe && (
                          <div className="flex flex-col items-center">
                            <ShieldAlert size={18} className="text-red-500 animate-pulse" />
                            <span className="text-[7px] font-black uppercase text-red-600">Golpe</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-[10px] italic text-slate-600 text-left-print">
                      {reg.observaciones || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* PIE DE PÁGINA IMPRESIÓN */}
      <div className="hidden print:flex justify-center gap-20 mt-16 pb-10">
        <div className="text-center border-t-2 border-black w-56 pt-2 text-[10px] font-bold uppercase">Firma de Dirección</div>
        <div className="text-center border-t-2 border-black w-56 pt-2 text-[10px] font-bold uppercase">Sello Institucional</div>
      </div>
    </div>
  );
};

export default PanelReportes;