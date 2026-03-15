import React, { useState, useEffect } from 'react';
import api from './axiosConfig';
import { Save, X, Image as ImageIcon, Moon, Utensils, Info, Plus, Trash2 } from 'lucide-react';

// Componente de entrada reutilizable
const InputField = ({ label, icon: Icon, value, name, placeholder, type = "textarea", onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
      <Icon size={14} className="text-violet-500" />
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500 transition-all min-h-[80px] resize-none"
        placeholder={placeholder}
        value={value}
        name={name}
        onChange={onChange}
      />
    ) : (
      <input
        type="text"
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        placeholder={placeholder}
        value={value}
        name={name}
        onChange={onChange}
      />
    )}
  </div>
);

const FormularioBitacora = ({ niñoId, nombreNiño, onCerrar }) => {
  const [formData, setFormData] = useState({
    desayuno: '', comida: '', merienda: '',
    esfinter: '', observaciones: '', durmio: false
  });
  const [fotosExistentes, setFotosExistentes] = useState([]); // Fotos que ya están en S3
  const [nuevasFotos, setNuevasFotos] = useState([]);       // Archivos File para subir
  const [previews, setPreviews] = useState([]);             // URLs temporales para ver
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!niñoId) return;
      try {
        setLoading(true);
        const res = await api.get(`/seguimiento/${niñoId}`);
        if (res.data) {
          setFormData({
            desayuno: res.data.desayuno || '',
            comida: res.data.comida || '',
            merienda: res.data.merienda || '',
            esfinter: res.data.esfinter || '',
            observaciones: res.data.observaciones || '',
            durmio: res.data.durmio || false
          });
          setFotosExistentes(res.data.fotos || []);
        }
      } catch (err) {
        console.log("Iniciando formulario nuevo");
      } finally { setLoading(false); }
    };
    cargarDatos();
  }, [niñoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Agregamos los archivos al estado
    setNuevasFotos(prev => [...prev, ...files]);
    
    // Creamos las previas
    const nuevasPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...nuevasPreviews]);
  };

  const eliminarFotoNueva = (index) => {
    setNuevasFotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    
    // Agregamos campos de texto
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append("hijo_id", niñoId);
    
    // Agregamos las fotos nuevas al campo "fotos" que espera Go
    nuevasFotos.forEach(foto => {
      data.append("fotos", foto);
    });

    try {
      setLoading(true);
      await api.post('/seguimiento', data);
      onCerrar();
    } catch (err) { 
      alert("Error al guardar la bitácora"); 
    } finally { setLoading(false); }
  };

  if (loading) return <div className="text-center p-20 font-black text-slate-400 animate-pulse">PROCESANDO...</div>;

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="bg-violet-600 p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Seguimiento Diario</h2>
          <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mt-2">{nombreNiño}</p>
        </div>
        <button onClick={onCerrar} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Toggle Siesta */}
        <div className="flex items-center justify-between bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${formData.durmio ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-200 text-slate-400'} transition-all`}>
              <Moon size={24} />
            </div>
            <div>
              <p className="font-black text-slate-900 uppercase text-sm tracking-tight">¿Durmió la siesta?</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Registro de descanso</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={formData.durmio} 
              onChange={(e) => setFormData({...formData, durmio: e.target.checked})} 
            />
            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600"></div>
          </label>
        </div>

        {/* Inputs de Comida y Esfínter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Desayuno" icon={Utensils} name="desayuno" value={formData.desayuno} placeholder="Detalle del desayuno..." onChange={handleChange} />
          <InputField label="Comida" icon={Utensils} name="comida" value={formData.comida} placeholder="Detalle de la comida..." onChange={handleChange} />
          <InputField label="Merienda" icon={Utensils} name="merienda" value={formData.merienda} placeholder="Detalle de la merienda..." onChange={handleChange} />
          <InputField label="Control de Esfínter" icon={Info} name="esfinter" value={formData.esfinter} placeholder="Ej: Pipi/Popó..." type="text" onChange={handleChange} />
        </div>

        <InputField label="Observaciones Generales" icon={Info} name="observaciones" value={formData.observaciones} placeholder="Eventos relevantes del día..." onChange={handleChange} />

        {/* SECCIÓN DE FOTOS */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">
            <ImageIcon size={14} className="text-violet-500" />
            Evidencia Fotográfica
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Botón para añadir fotos */}
            <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-violet-300 transition-all group">
              <div className="p-3 bg-white rounded-xl text-slate-400 group-hover:text-violet-600 shadow-sm transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase">Añadir Foto</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            {/* Previews de nuevas fotos */}
            {previews.map((url, index) => (
              <div key={index} className="aspect-square rounded-[2rem] overflow-hidden relative group shadow-md">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => eliminarFotoNueva(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Fotos ya guardadas anteriormente (si existen) */}
            {fotosExistentes.map((url, index) => (
              <div key={`exp-${index}`} className="aspect-square rounded-[2rem] overflow-hidden relative shadow-md border-2 border-violet-100">
                <img src={url} alt="existente" className="w-full h-full object-cover opacity-80" />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-violet-600/80 rounded-lg text-[8px] text-white font-bold uppercase">Guardada</div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] shadow-xl shadow-violet-200 flex items-center justify-center gap-3 transition-all active:scale-95">
            <Save size={20} /> Guardar Bitácora
          </button>
          <button type="button" onClick={onCerrar} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black uppercase tracking-widest rounded-[1.5rem] transition-all">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioBitacora;