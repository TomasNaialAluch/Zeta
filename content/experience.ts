export type ExperienceVideo = {src: string; poster: string; title: string; type: string; note: string}

/** Videos de un día de evento. Para sumar uno: copiá el .mp4 y su miniatura .jpg a public/experience/ y agregalo acá. */
export const experienceVideos: ExperienceVideo[] = [
  {src: '/experience/pizza.mp4', poster: '/experience/pizza-poster.jpg', title: 'PIZZA OMAKASE', type: 'EVENTO', note: 'Un día de evento: la masa, el horno y el servicio.'},
  {src: '/experience/asado.mp4', poster: '/experience/asado-poster.jpg', title: 'ASADO', type: 'EVENTO — PARRILLA', note: 'Un día de evento: el fuego, la parrilla y la mesa.'},
]
