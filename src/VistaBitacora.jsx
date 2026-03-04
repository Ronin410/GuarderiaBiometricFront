import React, { useEffect, useState } from 'react';
import api from './axiosConfig'; 
import { 
  Calendar, User, CheckCircle, ShieldAlert, Clock, 
  Search, RefreshCw 
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const VistaBitacora = () => {
  // --- FUNCIÓN PARA OBTENER FECHA LOCAL DE CULIACÁN ---
  const getFechaLocalCuliacan = () => {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha - offset).toISOString().split('T')[0];
  };

  const [niños, setNiños] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(getFechaLocalCuliacan());
  const [busqueda, setBusqueda] = useState("");

  const fetchEstatus = async () => {
    setLoading(true);
    // Limpiamos la lista al cambiar de fecha para evitar confusión visual
    setNiños([]); 
    try {
      const res = await api.get('/bitacora', {
        params: { fecha: fechaFiltro }
      });
      setNiños(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al obtener estatus de alumnos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstatus();
  }, [fechaFiltro]);

  // Formatea la hora de la actividad (HH:mm AM/PM)
  const formatearHora = (fechaStr) => {
    if (!fechaStr || fechaStr === '--:--') return '--:--';
    try {
      const isoStr = fechaStr.includes(' ') ? fechaStr.replace(' ', 'T') : fechaStr;
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return fechaStr;

      return date.toLocaleTimeString('es-MX', {
        hour: '2d-digit',
        minute: '2d-digit',
        hour12: true
      });
    } catch (e) { return fechaStr; }
  };

  const handleCambiarEstatus = async (niño) => {
    let nuevoEstatus = "";
    let colorConfirmacion = "";
    let textoAccion = "";

    if (!niño.estatus || niño.estatus === 'AUSENTE' || niño.estatus === 'SALIDA') {
      nuevoEstatus = 'ENTRADA';
      textoAccion = "registrar la ENTRADA";
      colorConfirmacion = '#10b981'; 
    } else {
      nuevoEstatus = 'SALIDA';
      textoAccion = "registrar la SALIDA";
      colorConfirmacion = '#f97316'; 
    }

    const result = await MySwal.fire({
      title: <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">¿Cambiar Estatus?</p>,
      html: (
        <div className="text-slate-600 text-sm space-y-2">
          <p>Vas a {textoAccion} para:</p>
          <p className="font-bold text-lg text-slate-900 uppercase">{niño.hijo}</p>
        </div>
      ),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'SÍ, ACTUALIZAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: colorConfirmacion,
      cancelButtonColor: '#64748b',
      borderRadius: '2rem',
    });

    if (result.isConfirmed) {
      try {
        await api.post('/admin/forzar-estatus', {
          hijo_id: niño.id, 
          tipo_movimiento: nuevoEstatus
        });
        
        MySwal.fire({
          title: '¡Actualizado!',
          icon: 'success',
          timer: 800,
          showConfirmButton: false,
          borderRadius: '2rem'
        });

        fetchEstatus(); 
      } catch (err) {
        MySwal.fire({
          title: 'Error',
          text: err.response?.data?.error || 'No se pudo completar la acción',
          icon: 'error'
        });
      }
    }
  };

  const filtrados = niños.filter(n => 
    (n.hijo || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const getBadgeStyle = (estatus) => {
    switch(estatus) {
      case 'ENTRADA': 
        return 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600 shadow-emerald-200/50';
      case 'SALIDA': 
        return 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600 shadow-orange-200/50';
      default: 
        return 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 -m-4 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Bitácora</h3>
            <div className="h-1 w-20 bg-violet-600 rounded-full"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Zona Horaria: Culiacán, MX</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-4">
              <Calendar size={20} className="text-slate-400" />
              <input 
                type="date" 
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="bg-transparent p-4 text-slate-900 outline-none font-bold text-sm cursor-pointer"
              />
            </div>
            
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input 
                type="text"
                placeholder="Buscar niño..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 pl-14 pr-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500 font-medium transition-all"
              />
            </div>

            <button onClick={fetchEstatus} className="p-4 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 shadow-lg transition-all active:scale-95">
              <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* GRID DE NIÑOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
              Sincronizando registros...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">
              No se encontraron alumnos para el día {fechaFiltro.split('-').reverse().join('/')}.
            </div>
          ) : (
            filtrados.map(niño => (
              <div key={niño.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-md hover:shadow-xl transition-all group flex flex-col justify-between border-b-4 hover:border-b-violet-500 min-h-fit">
                
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-slate-100 p-4 rounded-2xl text-slate-600 group-hover:bg-violet-600 group-hover:text-white transition-all shrink-0">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0 self-center">
                      <h4 className="font-black text-slate-900 text-base uppercase tracking-tight leading-tight whitespace-normal break-words">
                        {niño.hijo}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCambiarEstatus(niño)}
                    className={`w-full py-3 rounded-2xl text-[11px] font-black border uppercase tracking-[0.2em] mb-6 transition-all active:scale-95 shadow-lg ${getBadgeStyle(niño.estatus)}`}
                  >
                    {(!niño.estatus || niño.estatus === 'AUSENTE') ? '🏠 En Casa' : niño.estatus}
                  </button>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-colors ${niño.aseado ? 'border-blue-100 text-blue-400' : 'bg-rose-50 border-rose-500 text-rose-600 animate-pulse'}`}>
                      <CheckCircle size={18}/>
                      <span className="text-[9px] font-black uppercase">{niño.aseado ? 'Limpio' : 'Cambio'}</span>
                    </div>

                    <div className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-colors ${niño.golpe ? 'bg-amber-50 border-amber-500 text-amber-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                      <ShieldAlert size={18}/>
                      <span className="text-[9px] font-black uppercase">{niño.golpe ? 'Golpe' : 'Normal'}</span>
                    </div>
                  </div>

                  {niño.observaciones && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-xs text-slate-600 whitespace-normal break-words">
                      "{niño.observaciones}"
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 mt-auto">
                  <Clock size={14} className="text-violet-500"/>
                  <span className="text-xs font-bold text-slate-500">
                    {formatearHora(niño.fecha_hora)}
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