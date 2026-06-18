export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating?: number;
  isNew?: boolean;
  image?: string;
  catalogImage?: string;
  images: string[];
  sizes: Record<string, boolean> | string[];
  description: string;
};

export const products: Product[] = [
  {
    id: "1", name: "Premium Black Tee", category: "T-Shirts", price: 45.00, rating: 4.8, isNew: true,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Una remera negra atemporal con corte oversize. Tela 100% algodón premium, peso 220g/m². Perfecta para el día a día en la calle.",
  },
  {
    id: "2", name: "Code & Creator T-Shirt", category: "T-Shirts", price: 45.00, rating: 4.7, isNew: false,
    image: "https://images.unsplash.com/photo-1529362266736-231aedce0b0f?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1529362266736-231aedce0b0f?w=800&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Remera blanca con corte relajado. Diseño minimalista, ideal para combinar con cualquier look streetwear.",
  },
  {
    id: "3", name: "Dark Mode Forever Hoodie", category: "Hoodies", price: 75.00, rating: 4.9, isNew: true,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800&q=80",
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800&q=80",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Hoodie oversized con interior cepillado. Canguro frontal, cordón ajustable y puños acanalados. Tu mejor aliado para el invierno.",
  },
  {
    id: "4", name: "Neural Network Hoodie", category: "Hoodies", price: 75.00, rating: 4.6, isNew: false,
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800&q=80",
    ],
    sizes: ["M", "L", "XL", "XXL"],
    description: "Hoodie de corte amplio con gráfica en la espalda. Algodón french terry, cómodo y abrigado para el street.",
  },
  {
    id: "5", name: "AI Commuter Backpack", category: "Accessories", price: 95.00, rating: 4.8, isNew: false,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    ],
    sizes: ["ÚNICO"],
    description: "Mochila urbana con compartimento para laptop 15\". Materiales resistentes al agua, correas acolchadas y múltiples bolsillos.",
  },
  {
    id: "6", name: "Minimal Tech iPhone Case", category: "Accessories", price: 25.00, rating: 4.5, isNew: true,
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1601593346740-925612772716?w=800&q=80",
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80",
      "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80",
    ],
    sizes: ["iPhone 14", "iPhone 15", "iPhone 15 Pro"],
    description: "Funda minimalista de policarbonato con acabado mate. Protección ante caídas y acceso total a todos los puertos.",
  },
  {
    id: "7", name: "Premium AI Pen", category: "Accessories", price: 15.00, rating: 4.7, isNew: false,
    image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&q=80",
    images: [
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&q=80",
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80",
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80",
    ],
    sizes: ["ÚNICO"],
    description: "Bolígrafo metálico de edición limitada. Escritura suave, diseño premium. Para los que todavía toman notas a mano.",
  },
];

export const VALID_DISCOUNTS: Record<string, { type: "percentage" | "fixed"; value: number }> = {
  NEURAL10: { type: "percentage", value: 10 },
  GUNSTYLE: { type: "fixed", value: 20 },
};
