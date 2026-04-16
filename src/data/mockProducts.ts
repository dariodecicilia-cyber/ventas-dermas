import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'nur-1',
    name: 'Espuma piel Normal a Grasa',
    brand: 'NÜR',
    description: 'Espuma facial limpiadora. Piel Normal a Grasa. Contenido: 150ml',
    price: 25500,
    category: 'Limpieza',
  },
  {
    id: 'nur-2',
    name: 'Bruma Hidratante (Hialurónico+7 botánicos)',
    brand: 'NÜR',
    description: 'Tónico hidratante avanzado. Contenido: 100ml',
    price: 24500,
    category: 'Tónico',
  },
  {
    id: 'nur-3',
    name: 'HP (Hialurónico + Argireline)',
    brand: 'NÜR',
    description: 'Booster anti-age con efecto tensor. Contenido: 30ml',
    price: 39000,
    category: 'Boosters',
  },
  {
    id: 'bio-1',
    name: 'Genetic - Rostro',
    brand: 'Bioalquimia',
    description: 'Tratamiento facial Genetic - Línea Rostro',
    price: 39128,
    category: 'Rostro',
  },
  {
    id: 'bio-2',
    name: 'Emulsión Exfoliante',
    brand: 'Bioalquimia',
    description: 'Emulsión para limpieza y exfoliación',
    price: 21656,
    category: 'Limpieza',
  },
  {
    id: 'bio-3',
    name: 'Agua Micelar',
    brand: 'Bioalquimia',
    description: 'Agua micelar desmaquillante suave',
    price: 23046,
    category: 'Limpieza',
  }
];
