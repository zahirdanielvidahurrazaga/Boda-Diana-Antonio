import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompressor';
import { EVENT } from '@/lib/event';

interface UploadButtonProps {
  guestName: string;
  onUploadSuccess?: () => void;
}

type Status = 'idle' | 'compressing' | 'uploading' | 'saving' | 'success' | 'error';

const STATUS_LABEL: Record<Status, string> = {
  idle:        '',
  compressing: 'Optimizando...',
  uploading:   'Subiendo...',
  saving:      'Guardando...',
  success:     '¡Foto guardada!',
  error:       'Error al subir. Intenta de nuevo.',
};

// Vidrio líquido: casi transparente, con un brillo que entra por arriba a la
// izquierda, un borde que capta luz y un tinte caramelo leve en la orilla de
// abajo (como la cera del sello). Sin brightness(): eso lo volvía un disco blanco.
const circleGlass = {
  background: 'radial-gradient(120% 100% at 28% 12%, rgba(255,255,255,0.75), rgba(255,255,255,0) 52%), linear-gradient(160deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))',
  backdropFilter: 'blur(18px) saturate(190%)',
  WebkitBackdropFilter: 'blur(18px) saturate(190%)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: [
    'inset 0 1.5px 0 rgba(255,255,255,0.95)',
    'inset 0 -10px 18px rgba(170,130,104,0.16)',
    'inset 0 0 0 0.5px rgba(170,130,104,0.18)',
    '0 12px 28px rgba(74,58,48,0.16)',
    '0 2px 6px rgba(74,58,48,0.08)',
  ].join(', '),
};

export default function UploadButton({ guestName, onUploadSuccess }: UploadButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isProcessing = status !== 'idle' && status !== 'success' && status !== 'error';

  const processUpload = async (file: File, msg?: string) => {
    try {
      setStatus('compressing');
      const { file: compressed, width, height } = await compressImage(file);

      setStatus('uploading');
      const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: storageError } = await supabase.storage
        .from(EVENT.bucket)
        .upload(path, compressed, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (storageError) throw storageError;

      setStatus('saving');
      const { data: { publicUrl } } = supabase.storage.from(EVENT.bucket).getPublicUrl(path);
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          url: publicUrl,
          guest_name: guestName,
          event_id: EVENT.id,
          width,
          height,
          ...(msg ? { message: msg } : {}),
        });
      if (dbError) throw dbError;

      setStatus('success');
      onUploadSuccess?.();
      setTimeout(() => setStatus('idle'), 3500);
    } catch (err) {
      console.error('[UploadButton] error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    } finally {
      if (cameraRef.current)  cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Leer el buffer inmediatamente — iOS Safari invalida el File original
    // después de que el event handler completa y hay re-renders.
    const buffer = await file.arrayBuffer();
    const safe = new File([buffer], file.name || 'photo.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    setPendingFile(safe);
    setMessage('');
  };

  const handleSubmit = () => {
    if (!pendingFile) return;
    const file = pendingFile;
    const msg = message.trim() || undefined;
    setPendingFile(null);
    setMessage('');
    processUpload(file, msg);
  };

  const handleCancel = () => {
    setPendingFile(null);
    setMessage('');
    if (cameraRef.current)  cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  };

  return (
    <>
      {/* ── Toast de estado ── */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[9.5px] tracking-[0.18em] uppercase font-sans font-semibold whitespace-nowrap"
            style={{
              ...circleGlass,
              color: status === 'error' ? '#c0392b' : 'rgba(74,58,48,0.7)',
            }}
          >
            {isProcessing        && <Loader2 size={12} className="animate-spin text-primary/50" />}
            {status === 'success' && <CheckCircle2 size={12} className="text-primary/60" />}
            {status === 'error'   && <AlertCircle size={12} className="text-red-400" />}
            <span>{STATUS_LABEL[status]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet de mensaje ── */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end"
            style={{ background: 'rgba(36,30,25,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={handleCancel}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="w-full rounded-t-[28px] px-7 pt-7 pb-14"
              style={{ background: '#F6EFE9' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-9 h-1 rounded-full bg-primary/12 mx-auto mb-7" />

              <p className="text-[8.5px] tracking-[0.4em] uppercase text-primary/35 font-sans mb-5">
                Añade un mensaje (opcional)
              </p>

              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 20))}
                  placeholder="Un recuerdo bonito..."
                  maxLength={20}
                  autoFocus
                  className="w-full bg-transparent border-b border-primary/15 pb-2.5 pr-10 outline-none placeholder:text-primary/20 text-primary/75"
                  style={{ fontFamily: 'Caveat, cursive', fontSize: '22px' }}
                />
                <span className="absolute right-0 bottom-3 text-[9px] text-primary/28 font-sans tabular-nums">
                  {message.length}/20
                </span>
              </div>

              <button
                onClick={handleSubmit}
                className="mt-8 w-full py-4 rounded-full text-[10px] tracking-[0.3em] uppercase font-semibold font-sans transition-opacity active:opacity-70"
                style={{
                  background: 'rgba(170,130,104,0.14)',
                  border: '1px solid rgba(170,130,104,0.45)',
                  color: '#8A6650',
                }}
              >
                Subir foto
              </button>

              <button
                onClick={handleCancel}
                className="mt-3 w-full py-2.5 text-[8.5px] tracking-[0.25em] uppercase text-primary/28 font-sans"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dos círculos flotantes sobre la galería ── */}
      <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-around items-end px-8 max-w-2xl mx-auto">

        {/* Galería */}
        <input type="file" ref={galleryRef} onChange={handleFile} accept="image/*" className="hidden" />
        <motion.button
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => galleryRef.current?.click()}
          disabled={isProcessing}
          className="flex flex-col items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div
            className="w-[70px] h-[70px] rounded-full flex items-center justify-center"
            style={circleGlass}
          >
            {isProcessing
              ? <Loader2 size={22} className="text-primary/55 animate-spin" />
              : <ImageIcon size={22} className="text-primary/60" />
            }
          </div>
          <span className="text-[10px] tracking-[0.12em] text-primary/60 font-sans leading-none">
            Galería
          </span>
        </motion.button>

        {/* Cámara */}
        <input type="file" ref={cameraRef} onChange={handleFile} accept="image/*" capture="environment" className="hidden" />
        <motion.button
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => cameraRef.current?.click()}
          disabled={isProcessing}
          className="flex flex-col items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div
            className="w-[70px] h-[70px] rounded-full flex items-center justify-center"
            style={circleGlass}
          >
            {isProcessing
              ? <Loader2 size={24} className="text-primary/65 animate-spin" />
              : <Camera size={24} className="text-primary/65" />
            }
          </div>
          <span className="text-[10px] tracking-[0.12em] text-primary/60 font-sans leading-none">
            Cámara
          </span>
        </motion.button>
      </div>
    </>
  );
}
