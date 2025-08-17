import { Product, ProductCollection } from './types';

// Simplified mock data for development
export const mockProducts: any[] = [
  {
    id: '1',
    handle: 'camiseta-basica',
    title: 'Camiseta Básica',
    description: 'Uma camiseta básica confortável e versátil para o dia a dia.',
    descriptionHtml: '<p>Uma camiseta básica confortável e versátil para o dia a dia.</p>',
    availableForSale: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    priceRange: {
      maxVariantPrice: {
        amount: '49.90',
        currencyCode: 'BRL'
      }
    },
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      altText: 'Camiseta Básica',
      width: 800,
      height: 800
    },
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
        altText: 'Camiseta Básica',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    options: [
      {
        id: '1',
        title: 'Tamanho',
        name: 'Tamanho',
        values: ['P', 'M', 'G', 'GG'],
        product_id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        availableForSale: true
      },
      {
        id: '2',
        title: 'Cor',
        name: 'Cor',
        values: ['Branco', 'Preto', 'Azul'],
        product_id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        availableForSale: true
      }
    ],
    variants: [
      {
        id: '1',
        title: 'P / Branco',
        availableForSale: true,
        selectedOptions: [
          { name: 'Tamanho', value: 'P' },
          { name: 'Cor', value: 'Branco' }
        ],
        price: {
          amount: '49.90',
          currencyCode: 'BRL'
        }
      }
    ],
    seo: {
      title: 'Camiseta Básica - Minha Loja',
      description: 'Uma camiseta básica confortável e versátil para o dia a dia.'
    },
    tags: ['camiseta', 'básica', 'casual']
  },
  {
    id: '2',
    handle: 'calca-jeans',
    title: 'Calça Jeans Premium',
    description: 'Calça jeans de alta qualidade com corte moderno.',
    descriptionHtml: '<p>Calça jeans de alta qualidade com corte moderno.</p>',
    availableForSale: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    priceRange: {
      maxVariantPrice: {
        amount: '129.90',
        currencyCode: 'BRL'
      }
    },
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop',
      altText: 'Calça Jeans Premium',
      width: 800,
      height: 800
    },
    images: [
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop',
        altText: 'Calça Jeans Premium',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    options: [
      {
        id: '3',
        title: 'Tamanho',
        name: 'Tamanho',
        values: ['36', '38', '40', '42', '44'],
        product_id: '2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        availableForSale: true
      }
    ],
    variants: [
      {
        id: '2',
        title: '38',
        availableForSale: true,
        selectedOptions: [
          { name: 'Tamanho', value: '38' }
        ],
        price: {
          amount: '129.90',
          currencyCode: 'BRL'
        }
      }
    ],
    seo: {
      title: 'Calça Jeans Premium - Minha Loja',
      description: 'Calça jeans de alta qualidade com corte moderno.'
    },
    tags: ['calça', 'jeans', 'premium']
  },
  {
    id: '3',
    handle: 'tenis-esportivo',
    title: 'Tênis Esportivo',
    description: 'Tênis esportivo confortável para atividades físicas.',
    descriptionHtml: '<p>Tênis esportivo confortável para atividades físicas.</p>',
    availableForSale: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    priceRange: {
      maxVariantPrice: {
        amount: '199.90',
        currencyCode: 'BRL'
      }
    },
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
      altText: 'Tênis Esportivo',
      width: 800,
      height: 800
    },
    images: [
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
        altText: 'Tênis Esportivo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    options: [
      {
        id: '4',
        title: 'Tamanho',
        name: 'Tamanho',
        values: ['37', '38', '39', '40', '41', '42'],
        product_id: '3',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        availableForSale: true
      }
    ],
    variants: [
      {
        id: '3',
        title: '40',
        availableForSale: true,
        selectedOptions: [
          { name: 'Tamanho', value: '40' }
        ],
        price: {
          amount: '199.90',
          currencyCode: 'BRL'
        }
      }
    ],
    seo: {
      title: 'Tênis Esportivo - Minha Loja',
      description: 'Tênis esportivo confortável para atividades físicas.'
    },
    tags: ['tênis', 'esportivo', 'confortável']
  }
];

export const mockCategories: ProductCollection[] = [
  {
    handle: 'roupas',
    id: '1',
    title: 'Roupas',
    description: 'Coleção completa de roupas masculinas e femininas',
    seo: {
      title: 'Roupas - Minha Loja',
      description: 'Coleção completa de roupas masculinas e femininas'
    },
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    path: '/search/roupas'
  },
  {
    handle: 'calcados',
    id: '2', 
    title: 'Calçados',
    description: 'Tênis, sapatos e sandálias para todos os estilos',
    seo: {
      title: 'Calçados - Minha Loja',
      description: 'Tênis, sapatos e sandálias para todos os estilos'
    },
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    path: '/search/calcados'
  },
  {
    handle: 'acessorios',
    id: '3',
    title: 'Acessórios',
    description: 'Bolsas, relógios e bijuterias',
    seo: {
      title: 'Acessórios - Minha Loja',
      description: 'Bolsas, relógios e bijuterias'
    },
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    path: '/search/acessorios'
  }
];

// Produtos em destaque para homepage
export const mockFeaturedProducts: any[] = [mockProducts[0], mockProducts[1], mockProducts[2]];

// Produtos para carrossel
export const mockCarouselProducts: any[] = [mockProducts[1], mockProducts[2], mockProducts[0]];