import React, { useState, useEffect } from 'react';
import api from './axiosConfig'; 
import { Download, RefreshCw, Calendar as CalendarIcon, CheckCircle, ShieldAlert } from 'lucide-react';

const stylePrint = `
  @media print {
    @page {
      size: landscape;
      margin: 1cm;
    }
    body {
      background: white !important;
      -webkit-print-color-adjust: exact;
      margin: 0 !important;
      display: flex;
      justify-content: center;
    }
    .no-print {
      display: none !important;
    }
    .print-container {
      width: 100% !important;
      max-width: 1100px;
      margin: 0 auto !important;
      padding: 0 !important;
    }
    .table-wrapper {
      border: 1px solid #e2e8f0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      width: 100% !important;
    }
    table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      margin: 0 auto !important;
    }
    th, td {
      padding: 10px 6px !important;
      font-size: 10px !important;
      border: 1px solid #cbd5e1 !important;
      text-align: center !important;
      word-wrap: break-word !important;
    }
    .text-left-print {
      text-align: left !important;
    }
  }
`;

const PanelReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const nombreGuarderia = localStorage.getItem('nombre_guarderia') || 'BioSafe Kiosk';

  /**
   * CORRECCIÓN DE FECHA: Evita el uso de UTC (Z) para que no 
   * reste horas y cambie el día en el reporte.
   */
  const formatearFechaLocal = (fechaStr) => {
    if (!fechaStr) return "--:--";
    try {
      const [fechaPart, horaPart] = fechaStr.split(' ');
      const [dia, mes, año] = fechaPart.split('/');
      // Creamos la fecha como local (sin Z al final)
      const fechaObj = new Date(`${año}-${mes}-${dia}T${horaPart}`);
      
      return fechaObj.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch (e) { return fechaStr; }
  };

  const parseFechaBackend = (fechaStr) => {
    if (!fechaStr) return new Date(0);
    const [fecha, hora] = fechaStr.split(' ');
    const [dia, mes, año] = fecha.split('/');
    // Se parsea como local para mantener consistencia en el ordenamiento
    return new Date(`${año}-${mes}-${dia}T${hora}`);
  };

  const obtenerReportes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reportes-asistencia', {
        params: { inicio: fechaInicio, fin: fechaFin }
      });
      let datos = Array.isArray(res.data) ? res.data : [];
      datos.sort((a, b) => parseFechaBackend(a.fecha) - parseFechaBackend(b.fecha));
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
            <p className="text-slate-500">Generado: {new Date().toLocaleString()}</p>
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
          <button onClick={obtenerReportes} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => window.print()} 
            disabled={reportes.length === 0} 
            className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
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
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-[15%] text-center">Fecha/Hora</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-[20%] text-center">Alumno</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-[20%] text-center">Responsable</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center w-[10%]">Mov.</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center w-[10%]">Estado</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-[25%] text-center">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportes.map((reg, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 text-xs font-bold text-slate-500 text-center">{formatearFechaLocal(reg.fecha)}</td>
                  <td className="p-4 text-sm font-black text-slate-900 uppercase text-left-print">{reg.hijo_nombre}</td>
                  <td className="p-4 text-xs font-bold text-violet-600 text-left-print">{reg.tutor_nombre}</td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${reg.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {reg.tipo}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-2">
                      {/* ASEADO: Verde si es true, Oscuro si es false */}
                      <div className="flex flex-col items-center">
                        <CheckCircle 
                          size={18} 
                          className={reg.aseado ? 'text-emerald-500' : 'text-slate-900'} 
                        />
                        <span className={`text-[7px] font-black uppercase ${reg.aseado ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {reg.aseado ? 'Aseado' : 'No Aseado'}
                        </span>
                      </div>

                      {/* GOLPE: Solo se muestra si es true */}
                      {reg.reporte_golpe && (
                        <div className="flex flex-col items-center">
                          <ShieldAlert size={18} className="text-red-500 animate-pulse" />
                          <span className="text-[7px] font-black uppercase text-red-600">Golpe</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-[10px] italic text-slate-600 text-left-print">{reg.observaciones || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* PIE DE PÁGINA CENTRADO */}
      <div className="hidden print:flex justify-center gap-20 mt-16 pb-10">
        <div className="text-center border-t-2 border-black w-56 pt-2 text-[10px] font-bold">FIRMA DE DIRECCIÓN</div>
        <div className="text-center border-t-2 border-black w-56 pt-2 text-[10px] font-bold">SELLO INSTITUCIONAL</div>
      </div>
    </div>
  );
};

export default PanelReportes;