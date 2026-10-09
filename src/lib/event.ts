/**
 * Todos los datos del evento viven aquí.
 * Para montar otra galería (otra boda, un bautizo, una comunión)
 * basta con cambiar este archivo, las fotos de /public y el proyecto de Supabase.
 */

export const EVENT = {
  /** Identificador de las fotos en la base — separa este evento de cualquier otro */
  id: 'diana-antonio-boda-2026',

  /** Bucket de Supabase Storage donde viven las fotos */
  bucket: 'boda-photos',

  /** Como sale en el título y en las descargas */
  nombre: 'Diana & Antonio',
  /** Iniciales del sello de lacre (como el sobre de la invitación) */
  iniciales: ['D', 'A'],
  titulo: 'Nuestra Boda',

  /** Sábado 17 de octubre de 2026 */
  fecha: new Date('2026-10-17T00:00:00-06:00'),
  fechaCorta: '17 · X · 2026',
  fechaLarga: 'Sábado 17 de Octubre de 2026',

  ceremonia: {
    lugar: 'Parroquia de San Andrés Apóstol',
    hora: '1:30 PM',
  },
  recepcion: {
    lugar: 'Quinta Camino Real',
    hora: '3:00 PM',
  },
  ciudad: 'Miahuatlán de Porfirio Díaz, Oax.',

  padresNovia: ['Verónica Cruz Cortés', 'Ezequiel López Ramírez'],
  padresNovio: ['Reyna Josefina Cruz Maya', 'Hazael David Hernández Hernández'],
  padrinos: ['Rosa Paulina García Cruz', 'Jesús Eusebio Jarquín Bautista'],

  /** La frase de la invitación */
  frase: {
    texto: 'Juntos hicimos de un día cualquiera, una fecha para marcar en el calendario.',
    firma: 'Diana & Antonio',
  },

  hashtag: '#DianaYAntonio',

  /** Código del panel de administración (/#admin) */
  adminCode: '1710',
} as const;
