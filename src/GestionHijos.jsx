import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Search, Baby, Trash2, Save, X, Edit3, Loader2, Check } from 'lucide-react';

//const API_URL = 'https://guarderiabiometricback.onrender.com';
const API_URL = 'http://localhost:8099';

const GestionHijos = ({ padreId, nombrePadre, onFinalizar }) => {
  const [hijosRelacionados, setHijosRelacionados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [nuevoHijoNombre, setNuevoHijoNombre] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [nombreTutorEdit, setNombreTutorEdit] = useState(nombrePadre);
  const [editandoTutor, setEditandoTutor] = useState(false);

  useEffect(() => {
    const cargarHijosActuales = async () => {
      if (!padreId) return;
      try {
        const res = await axios.get(`${API_URL}/padre/${padreId}/hijos`);
        const hijosMapeados = res.data.map(h => ({ 
          id: h.id, 
          nombre_niño: h.nombre || h.nombre_niño || h.Nombre, 
          esNuevo: false, 
          persistente: true 
        }));
        setHijosRelacionados(hijosMapeados);
      } catch (err) {
        console.error("Error cargando hijos:", err);
      }
    };
    cargarHijosActuales();
  }, [padreId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (busqueda.trim().length > 2) {
        try {
          const res = await axios.get(`${API_URL}/buscar-hijos?q=${busqueda}`);
          setSugerencias(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          setSugerencias([]);
        }
      } else {
        setSugerencias([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [busqueda]);

  const manejarActualizarTutor = async () => {
    if (!nombreTutorEdit.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/actualizar-padre`, {
        id: parseInt(padreId),
        nombre: nombreTutorEdit.trim()
      });
      setEditandoTutor(false);
      alert("✅ Nombre del tutor actualizado");
    } catch (err) {
      alert("❌ Error al actualizar tutor");
      setNombreTutorEdit(nombrePadre);
    } finally {
      setLoading(false);
    }
  };

  const agregarSugerencia = (hijo) => {
    const nombreSeleccionado = hijo.nombre || hijo.nombre_niño || hijo.Nombre;
    const idSeleccionado = hijo.id || hijo.ID;

    if (!hijosRelacionados.find(h => h.id === idSeleccionado)) {
      setHijosRelacionados([...hijosRelacionados, { 
        id: idSeleccionado,
        nombre_niño: nombreSeleccionado,
        esNuevo: false, 
        persistente: false 
      }]);
    }
    setBusqueda('');
    setSugerencias([]);
  };

  const prepararNuevoHijo = () => {
    if (nuevoHijoNombre.trim()) {
      setHijosRelacionados([...hijosRelacionados, { 
        nombre_niño: nuevoHijoNombre.trim(), 
        esNuevo: true,
        persistente: false,
        id: Date.now() 
      }]);
      setNuevoHijoNombre('');
    }
  };

  const manejarEliminacion = async (hijo) => {
    if (hijo.persistente) {
      if (!window.confirm(`¿Desvincular a ${hijo.nombre_niño}?`)) return;
      try {
        await axios.post(`${API_URL}/desvincular-hijo`, {
          padre_id: parseInt(padreId),
          hijo_id: hijo.id
        });
        setHijosRelacionados(prev => prev.filter(h => h.id !== hijo.id));
      } catch (err) {
        alert("Error al desvincular");
      }
    } else {
      setHijosRelacionados(prev => prev.filter(item => item.id !== hijo.id));
    }
  };

  const guardarRelaciones = async () => {
    setLoading(true);
    try {
      const nuevosPorGuardar = hijosRelacionados.filter(h => !h.persistente);
      for (const hijo of nuevosPorGuardar) {
        let idHijoFinal = hijo.id;
        if (hijo.esNuevo) {
          const resHijo = await axios.post(`${API_URL}/registrar-hijo`, { 
            nombre_niño: hijo.nombre_niño 
          });
          idHijoFinal = resHijo.data.id;
        }
        await axios.post(`${API_URL}/vincular-tutor`, { 
          padre_id: parseInt(padreId), 
          hijo_id: idHijoFinal 
        });
      }
      alert("✅ Cambios guardados con éxito");
      onFinalizar();
    } catch (error) {
      alert("❌ Error al guardar relaciones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white text-slate-900 max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
      {/* SECCIÓN TUTOR EDITABLE */}
      <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
        <div className="flex-1">
          <p className="text-violet-600 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Tutor Registrado</p>
          {editandoTutor ? (
            <div className="flex items-center gap-3">
              <input 
                autoFocus
                value={nombreTutorEdit}
                onChange={(e) => setNombreTutorEdit(e.target.value)}
                className="bg-slate-50 border-2 border-violet-500 rounded-2xl px-5 py-3 text-2xl font-black uppercase outline-none w-full max-w-md shadow-sm"
              />
              <button onClick={manejarActualizarTutor} className="bg-emerald-500 p-3 rounded-xl text-white hover:bg-emerald-600 shadow-md"><Check size={24}/></button>
              <button onClick={() => {setEditandoTutor(false); setNombreTutorEdit(nombrePadre);}} className="bg-slate-200 p-3 rounded-xl text-slate-600 hover:bg-slate-300 shadow-sm"><X size={24}/></button>
            </div>
          ) : (
            <div className="flex items-center gap-5 group">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">{nombreTutorEdit}</h2>
              <button 
                onClick={() => setEditandoTutor(true)}
                className="p-2.5 bg-violet-50 rounded-xl text-violet-600 hover:bg-violet-100 transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit3 size={20} />
              </button>
            </div>
          )}
        </div>
        <button onClick={onFinalizar} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><X size={32}/></button>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          {/* BUSCADOR */}
          <div className="bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-5 ml-2 tracking-widest">Vincular de la lista general</h4>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar niño por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 font-medium shadow-sm"
              />
              {sugerencias.length > 0 && (
                <div className="absolute z-50 w-full mt-3 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                  {sugerencias.map(s => (
                    <button 
                      key={s.id || s.ID} 
                      onClick={() => agregarSugerencia(s)}
                      className="w-full p-5 text-left hover:bg-violet-50 flex justify-between items-center border-b border-slate-50 last:border-0 group transition-colors"
                    >
                      <span className="font-bold uppercase text-slate-700 group-hover:text-violet-700">
                        {s.nombre || s.nombre_niño || s.Nombre}
                      </span>
                      <UserPlus size={20} className="text-violet-400 group-hover:text-violet-600"/>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* NUEVO REGISTRO */}
          <div className="bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-5 ml-2 tracking-widest">Nuevo registro de niño</h4>
            <div className="flex gap-3">
              <input 
                type="text"
                placeholder="Nombre del niño..."
                value={nuevoHijoNombre}
                onChange={(e) => setNuevoHijoNombre(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-[1.5rem] p-5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium shadow-sm"
              />
              <button onClick={prepararNuevoHijo} className="bg-emerald-500 p-5 rounded-[1.5rem] text-white hover:bg-emerald-600 shadow-lg transition-all active:scale-95"><UserPlus size={24}/></button>
            </div>
          </div>
        </div>

        {/* LISTA DE HIJOS VINCULADOS */}
        <div className="bg-white p-7 rounded-[3rem] border-2 border-slate-50 shadow-inner">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-[0.2em] px-2">Niños vinculados actualmente</h3>
          <div className="space-y-4">
            {hijosRelacionados.map((h) => (
              <div key={h.id} className="flex items-center justify-between bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl shadow-sm ${h.persistente ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                    <Baby size={24}/>
                  </div>
                  <div>
                    <p className="font-black text-lg uppercase tracking-tight text-slate-800 leading-tight">{h.nombre_niño}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${h.persistente ? 'text-slate-400' : 'text-amber-500'}`}>
                      {h.persistente ? 'Confirmado' : 'Pendiente de guardar'}
                    </p>
                  </div>
                </div>
                <button onClick={() => manejarEliminacion(h)} className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-xl transition-all"><Trash2 size={22}/></button>
              </div>
            ))}
            {hijosRelacionados.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center opacity-30">
                <Baby size={48} className="mb-3 text-slate-400" />
                <p className="font-bold uppercase text-[10px] tracking-widest">No hay niños vinculados</p>
              </div>
            )}
          </div>

          <button 
            onClick={guardarRelaciones} 
            disabled={loading || hijosRelacionados.every(h => h.persistente)}
            className="w-full mt-10 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-300 py-6 rounded-[1.5rem] font-black uppercase text-white shadow-xl shadow-violet-600/20 flex items-center justify-center gap-4 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
            {loading ? 'Guardando...' : 'Guardar Cambios de Familia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionHijos;