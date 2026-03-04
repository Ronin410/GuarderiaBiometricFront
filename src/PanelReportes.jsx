import React, { useState, useEffect } from 'react';
import api from './axiosConfig'; 
import { 
  Download, RefreshCw, Calendar as CalendarIcon, 
  CheckCircle, ShieldAlert, ChevronUp, ChevronDown, Search
} from 'lucide-react';

const stylePrint = `
  @media print {
    @page { size: landscape; margin: 1cm; }
    body { background: white !important; -webkit-print-color-adjust: exact; margin: 0 !important; }
    .no-print { display: none !important; }
    
    .print-container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
    
    /* Evita que el contenedor de firmas se separe de la tabla */
    .report-wrapper {
      display: block;
      page-break-inside: auto;
    }

    .table-wrapper { 
      border: 1px solid #e2e8f0 !important; 
      border-radius: 0 !important; 
      box-shadow: none !important; 
      width: 100% !important; 
      display: table; /* Cambiar de block a table para mejor soporte de saltos */
    }

    table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
    
    /* Evita que una fila se parta a la mitad entre dos páginas */
    tr { page-break-inside: avoid; page-break-after: auto; }
    
    th, td { 
      padding: 8px 4px !important; 
      font-size: 9px !important; 
      border: 1px solid #cbd5e1 !important; 
      text-align: center !important; 
      word-wrap: break-word !important; 
    }

    /* CONTENEDOR DE FIRMAS: Evita que aparezca solo en una hoja */
    .footer-signatures {
      margin-top: 30px;
      display: flex;
      justify-content: center;
      gap: 100px;
      page-break-inside: avoid; /* Bloquea el salto dentro de las firmas */
      page-break-before: auto;  /* Permite saltar antes si es necesario, pero intentará estar con la tabla */
    }

    .text-left-print { text-align: left !important; }
  }
`;

const PanelReportes = () => {
  const getFechaLocalCuliacan = () => {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha - offset).toISOString().split('T')[0];
  };

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(getFechaLocalCuliacan());
  const [fechaFin, setFechaFin] = useState(getFechaLocalCuliacan());
  const [busquedaNombre, setBusquedaNombre] = useState(""); 
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });

  const nombreGuarderia = localStorage.getItem('guarderia_nombre') || 'BioSafe Kiosk';

  const sugerenciasNombres = React.useMemo(() => {
    const nombres = reportes.map(r => r.hijo_nombre);
    return [...new Set(nombres)].sort();
  }, [reportes]);

  const formatearFechaLocal = (fechaStr) => {
    if (!fechaStr) return "--:--";
    try {
      const isoStr = fechaStr.includes(' ') ? fechaStr.replace(' ', 'T') : fechaStr;
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return fechaStr;
      return date.toLocaleString('es-MX', {
        day: '2d-digit', month: '2d-digit', year: 'numeric',
        hour: '2d-digit', minute: '2d-digit', hour12: true
      });
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const reportesProcesados = React.useMemo(() => {
    let items = reportes.filter(reg => 
      reg.hijo_nombre.toLowerCase().includes(busquedaNombre.toLowerCase())
    );
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key] || "";
        let valB = b[sortConfig.key] || "";
        if (sortConfig.key === 'fecha') {
          const dateA = new Date(valA.replace(' ', 'T')).getTime();
          const dateB = new Date(valB.replace(' ', 'T')).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return sortConfig.direction === 'asc' 
          ? valA.toString().localeCompare(valB.toString()) 
          : valB.toString().localeCompare(valA.toString());
      });
    }
    return items;
  }, [reportes, sortConfig, busquedaNombre]);

  useEffect(() => { obtenerReportes(); }, [fechaInicio, fechaFin]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 print-container">
      <style>{stylePrint}</style>

      {/* FILTROS (no-print) */}
      <div className="no-print space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><CalendarIcon size={12} /> Fecha Inicial</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><CalendarIcon size={12} /> Fecha Final</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
          </div>
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Search size={12} /> Buscar Alumno</label>
            <input list="nombres-alumnos" type="text" value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} placeholder="Nombre..." className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-violet-500 uppercase" />
            <datalist id="nombres-alumnos">
              {sugerenciasNombres.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={obtenerReportes} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
            <button onClick={() => window.print()} disabled={reportesProcesados.length === 0} className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"><Download size={18} /> IMPRIMIR</button>
          </div>
        </div>
      </div>

      {/* CONTENEDOR QUE AGRUPA TABLA Y FIRMAS */}
      <div className="report-wrapper">
        {/* ENCABEZADO PARA IMPRESIÓN */}
        <div className="hidden print:block border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900">{nombreGuarderia}</h1>
              <h2 className="text-lg font-bold uppercase text-violet-600">Reporte de Asistencia</h2>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Periodo: {fechaInicio} al {fechaFin}</p>
              <p>Generado: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="table-wrapper bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th onClick={() => handleSort('fecha')} className="p-4 text-[10px] font-black text-slate-500 uppercase cursor-pointer text-center">Fecha/Hora</th>
                <th onClick={() => handleSort('hijo_nombre')} className="p-4 text-[10px] font-black text-slate-500 uppercase cursor-pointer text-center">Alumno</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">Responsable</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">Mov.</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">Estado</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center w-[25%]">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportesProcesados.map((reg, i) => (
                <tr key={i}>
                  <td className="p-4 text-xs font-bold text-slate-500">{formatearFechaLocal(reg.fecha)}</td>
                  <td className="p-4 text-sm font-black uppercase text-left-print">{reg.hijo_nombre}</td>
                  <td className="p-4 text-xs font-bold text-violet-600 text-left-print">{reg.tutor_nombre}</td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${reg.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                      {reg.tipo}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {reg.tipo === 'ENTRADA' && <CheckCircle size={16} className={reg.aseado ? 'text-emerald-500' : 'text-slate-200'} />}
                      {reg.reporte_golpe && <ShieldAlert size={16} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="p-4 text-[10px] italic text-left-print">{reg.observaciones || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PIE DE FIRMAS: Envuelto en footer-signatures con page-break-inside: avoid */}
        <div className="hidden print:flex footer-signatures">
          <div className="text-center border-t-2 border-black w-64 pt-2 text-[10px] font-bold uppercase">Firma de Dirección</div>
          <div className="text-center border-t-2 border-black w-64 pt-2 text-[10px] font-bold uppercase">Sello Institucional</div>
        </div>
      </div>
    </div>
  );
};

export default PanelReportes;