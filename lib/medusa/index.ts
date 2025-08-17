import { isMedusaError } from 'lib/type-guards';

import { TAGS } from 'lib/constants';
import { mapOptionIds } from 'lib/utils';
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { calculateVariantAmount, computeAmount, convertToDecimal } from './helpers';
import { mockProducts, mockCategories, mockFeaturedProducts, mockCarouselProducts } from './mock-data';
import {
  Cart,
  CartItem,
  Image,
  MedusaCart,
  MedusaImage,
  MedusaLineItem,
  MedusaProduct,
  MedusaProductCollection,
  MedusaProductOption,
  MedusaProductVariant,
  Product,
  ProductCategory,
  ProductCollection,
  ProductOption,
  ProductVariant,
  SelectedOption
} from './types';

const ENDPOINT = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API ?? 'http://localhost:9000';
const MEDUSA_API_KEY = process.env.MEDUSA_API_KEY ?? '';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export default async function medusaRequest({
  cache = 'force-cache',
  method,
  path,
  payload,
  tags
}: {
  cache?: RequestCache;
  method: string;
  path: string;
  payload?: Record<string, unknown> | undefined;
  tags?: string[];
}) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-key': MEDUSA_API_KEY
    },
    cache,
    ...(tags && { next: { tags } })
  };

  if (path.includes('/carts')) {
    options.cache = 'no-cache';
  }

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  try {
    const result = await fetch(`${ENDPOINT}/store${path}`, options);

    if (!result.ok) {
      console.log(`Backend request failed: ${result.status} ${result.statusText}`);
      return null;
    }

    const body = await result.json();

    if (body.errors) {
      console.log('Backend returned errors:', body.errors[0]);
      return null;
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    console.log('Backend not available:', e);
    return null;
  }
}

const reshapeCart = (cart: MedusaCart): Cart => {
  const lines = cart?.items?.map((item) => reshapeLineItem(item)) || [];
  const totalQuantity = lines.reduce((a, b) => a + b.quantity, 0);
  const checkoutUrl = '/checkout'; // todo: implement medusa checkout flow
  const currencyCode = cart.region?.currency_code.toUpperCase() || 'USD';

  let subtotalAmount = '0';
  if (cart.subtotal && cart.region) {
    subtotalAmount = computeAmount({ amount: cart.subtotal, region: cart.region }).toString();
  }

  let totalAmount = '0';
  if (cart.total && cart.region) {
    totalAmount = computeAmount({ amount: cart.total, region: cart.region }).toString();
  }

  let totalTaxAmount = '0';
  if (cart.tax_total && cart.region) {
    totalTaxAmount = computeAmount({ amount: cart.tax_total, region: cart.region }).toString();
  }

  const cost = {
    subtotalAmount: {
      amount: subtotalAmount,
      currencyCode: currencyCode
    },
    totalAmount: {
      amount: totalAmount,
      currencyCode: currencyCode
    },
    totalTaxAmount: {
      amount: totalTaxAmount,
      currencyCode: currencyCode
    }
  };

  return {
    ...cart,
    totalQuantity,
    checkoutUrl,
    lines,
    cost
  };
};

const reshapeLineItem = (lineItem: MedusaLineItem): CartItem => {
  const product = {
    title: lineItem.title,
    priceRange: {
      maxVariantPrice: calculateVariantAmount(lineItem.variant)
    },
    updatedAt: lineItem.updated_at,
    createdAt: lineItem.created_at,
    tags: [],
    descriptionHtml: lineItem.description ?? '',
    featuredImage: {
      url: lineItem.thumbnail ?? '',
      altText: lineItem.title ?? ''
    },
    availableForSale: true,
    variants: [lineItem.variant && reshapeProductVariant(lineItem.variant)],
    handle: lineItem.variant?.product?.handle ?? '',
    options: [] as ProductOption[]
  };

  const selectedOptions =
    lineItem.variant?.options?.map((option) => ({
      name: option.option?.title ?? '',
      value: option.value
    })) || [];

  const merchandise = {
    id: lineItem.variant_id || lineItem.id,
    selectedOptions,
    product,
    title: lineItem.description ?? ''
  };

  const cost = {
    totalAmount: {
      amount: convertToDecimal(
        lineItem.total,
        lineItem.variant?.prices?.[0]?.currency_code
      ).toString(),
      currencyCode: lineItem.variant?.prices?.[0]?.currency_code.toUpperCase() || 'EUR'
    }
  };
  const quantity = lineItem.quantity;

  return {
    ...lineItem,
    merchandise,
    cost,
    quantity
  };
};

const reshapeImages = (images?: MedusaImage[], productTitle?: string): Image[] => {
  if (!images) return [];
  return images.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)![1];
    return {
      ...image,
      altText: `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (product: MedusaProduct): Product => {
  const variant = product.variants?.[0];

  let amount = '0';
  let currencyCode = 'USD';
  if (variant && variant.prices?.[0]?.amount) {
    currencyCode = variant.prices?.[0]?.currency_code.toUpperCase() ?? 'USD';
    amount = convertToDecimal(variant.prices[0].amount, currencyCode).toString();
  }

  const priceRange = {
    maxVariantPrice: {
      amount,
      currencyCode: product.variants?.[0]?.prices?.[0]?.currency_code.toUpperCase() ?? ''
    }
  };

  const updatedAt = product.updated_at;
  const createdAt = product.created_at;
  const tags = product.tags?.map((tag) => tag.value) || [];
  const descriptionHtml = product.description ?? '';
  const featuredImageFilename = product.thumbnail?.match(/.*\/(.*)\..*/)![1];
  const featuredImage = {
    url: product.thumbnail ?? '',
    altText: product.thumbnail ? `${product.title} - ${featuredImageFilename}` : ''
  };
  const availableForSale = product.variants?.[0]?.purchasable || true;
  const images = reshapeImages(product.images, product.title);

  const variants = product.variants.map((variant) =>
    reshapeProductVariant(variant, product.options)
  );

  let options = [] as ProductOption[];
  product.options && (options = product.options.map((option) => reshapeProductOption(option)));

  return {
    ...product,
    images,
    featuredImage,
    priceRange,
    updatedAt,
    createdAt,
    tags,
    descriptionHtml,
    availableForSale,
    options,
    variants
  };
};

const reshapeProductOption = (productOption: MedusaProductOption): ProductOption => {
  const availableForSale = productOption.product?.variants?.[0]?.purchasable || true;
  const name = productOption.title;
  let values = productOption.values?.map((option) => option.value) || [];
  values = [...new Set(values)];

  return {
    ...productOption,
    availableForSale,
    name,
    values
  };
};

const reshapeProductVariant = (
  productVariant: MedusaProductVariant,
  productOptions?: MedusaProductOption[]
): ProductVariant => {
  let selectedOptions: SelectedOption[] = [];
  if (productOptions && productVariant.options) {
    const optionIdMap = mapOptionIds(productOptions);
    selectedOptions = productVariant.options.map((option) => ({
      name: optionIdMap[option.option_id] ?? '',
      value: option.value
    }));
  }
  const availableForSale = productVariant.purchasable || true;
  const price = calculateVariantAmount(productVariant);

  return {
    ...productVariant,
    availableForSale,
    selectedOptions,
    price
  };
};

const reshapeCategory = (category: ProductCategory): ProductCollection => {
  const description = category.description || category.metadata?.description?.toString() || '';
  const seo = {
    title: category?.metadata?.seo_title?.toString() || category.name || '',
    description: category?.metadata?.seo_description?.toString() || category.description || ''
  };
  const path = `/search/${category.handle}`;
  const updatedAt = category.updated_at;
  const title = category.name;

  return {
    ...category,
    description,
    seo,
    title,
    path,
    updatedAt
  };
};

export async function createCart(): Promise<Cart | null> {
  try {
    const res = await medusaRequest({ method: 'POST', path: '/carts' });
    if (!res?.body?.cart) {
      console.log('Backend not available, cannot create cart');
      return null;
    }
    return reshapeCart(res.body.cart);
  } catch (error) {
    console.log('Error creating cart:', error);
    return null;
  }
}

export async function addToCart(
  cartId: string,
  lineItem: { variantId: string; quantity: number }
): Promise<Cart | null> {
  try {
    const res = await medusaRequest({
      method: 'POST',
      path: `/carts/${cartId}/line-items`,
      payload: {
        variant_id: lineItem?.variantId,
        quantity: lineItem?.quantity
      },
      tags: ['cart']
    });
    if (!res?.body?.cart) {
      console.log('Backend not available, cannot add to cart');
      return null;
    }
    return reshapeCart(res.body.cart);
  } catch (error) {
    console.log('Error adding to cart:', error);
    return null;
  }
}

export async function removeFromCart(cartId: string, lineItemId: string): Promise<Cart | null> {
  try {
    const res = await medusaRequest({
      method: 'DELETE',
      path: `/carts/${cartId}/line-items/${lineItemId}`,
      tags: ['cart']
    });
    if (!res?.body?.cart) {
      console.log('Backend not available, cannot remove from cart');
      return null;
    }
    return reshapeCart(res.body.cart);
  } catch (error) {
    console.log('Error removing from cart:', error);
    return null;
  }
}

export async function updateCart(
  cartId: string,
  { lineItemId, quantity }: { lineItemId: string; quantity: number }
): Promise<Cart | null> {
  try {
    const res = await medusaRequest({
      method: 'POST',
      path: `/carts/${cartId}/line-items/${lineItemId}`,
      payload: {
        quantity
      },
      tags: ['cart']
    });
    if (!res?.body?.cart) {
      console.log('Backend not available, cannot update cart');
      return null;
    }
    return reshapeCart(res.body.cart);
  } catch (error) {
    console.log('Error updating cart:', error);
    return null;
  }
}

export async function getCart(cartId: string): Promise<Cart | null> {
  try {
    const res = await medusaRequest({ method: 'GET', path: `/carts/${cartId}`, tags: ['cart'] });

    if (!res?.body?.cart) {
      console.log('Backend not available, cannot get cart');
      return null;
    }

    const cart = res.body.cart;
    return reshapeCart(cart);
  } catch (error) {
    console.log('Error getting cart:', error);
    return null;
  }
}

export async function getCategories(): Promise<ProductCollection[]> {
  if (USE_MOCK_DATA) {
    return mockCategories;
  }

  try {
    const res = await medusaRequest({
      method: 'GET',
      path: '/product-categories',
      tags: ['categories']
    });

    if (!res?.body?.product_categories) {
      return mockCategories;
    }

    // Reshape categories and hide categories starting with 'hidden'
    const categories = res.body.product_categories
      .map((collection: ProductCategory) => reshapeCategory(collection))
      .filter((collection: MedusaProductCollection) => !collection.handle.startsWith('hidden'));

    return categories;
  } catch (error) {
    console.log('Backend not available, returning mock categories');
    return mockCategories;
  }
}

export async function getCategory(handle: string): Promise<ProductCollection | undefined> {
  try {
    const res = await medusaRequest({
      method: 'GET',
      path: `/product-categories?handle=${handle}&expand=products`,
      tags: ['categories', 'products']
    });

    if (!res?.body?.product_categories?.length) {
      return undefined;
    }

    return res.body.product_categories[0];
  } catch (error) {
    console.log(`Backend not available, returning undefined for category: ${handle}`);
    return undefined;
  }
}

export async function getCategoryProducts(
  handle: string,
  reverse?: boolean,
  sortKey?: string
): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    // Retorna produtos específicos baseado na categoria
    if (handle === 'hidden-homepage-featured-items') {
      return mockFeaturedProducts;
    }
    if (handle === 'hidden-homepage-carousel') {
      return mockCarouselProducts;
    }
    // Para outras categorias, retorna produtos filtrados
    return mockProducts.filter((product: any) => 
      product.tags.some((tag: any) => tag.toLowerCase().includes(handle.toLowerCase()))
    );
  }

  try {
    const res = await medusaRequest({
      method: 'GET',
      path: `/product-categories?handle=${handle}`,
      tags: ['categories']
    });

    if (!res?.body?.product_categories?.length) {
      // Fallback para dados mock
      if (handle === 'hidden-homepage-featured-items') {
        return mockFeaturedProducts;
      }
      if (handle === 'hidden-homepage-carousel') {
        return mockCarouselProducts;
      }
      return mockProducts;
    }

    const category = res.body.product_categories[0];

    if (!category?.id) {
      return mockProducts;
    }

    const category_products = await getProducts({ reverse, sortKey, categoryId: category.id });

    return category_products;
  } catch (error) {
    console.log(`Backend not available, returning mock products for category: ${handle}`);
    if (handle === 'hidden-homepage-featured-items') {
      return mockFeaturedProducts;
    }
    if (handle === 'hidden-homepage-carousel') {
      return mockCarouselProducts;
    }
    return mockProducts;
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  try {
    const res = await medusaRequest({
      method: 'GET',
      path: `/products?handle=${handle}&limit=1`,
      tags: ['products']
    });

    if (!res?.body?.products?.length) {
      return undefined;
    }

    const product = res.body.products[0];
    return reshapeProduct(product);
  } catch (error) {
    console.log(`Backend not available, returning undefined for product: ${handle}`);
    return undefined;
  }
}

export async function getProducts({
  query,
  reverse,
  sortKey,
  categoryId
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  categoryId?: string;
}): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    let products = [...mockProducts];
    
    // Filtrar por query se fornecida
    if (query) {
      products = products.filter((product: any) => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(query.toLowerCase())) ||
        product.tags.some((tag: any) => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Ordenar por preço se especificado
    if (sortKey === 'PRICE') {
      products.sort(
        (a, b) =>
          parseFloat(a.priceRange.maxVariantPrice.amount) -
          parseFloat(b.priceRange.maxVariantPrice.amount)
      );
    }

    // Ordenar por data se especificado
    if (sortKey === 'CREATED_AT') {
      products.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Reverter se especificado
    if (reverse) {
      products.reverse();
    }

    return products;
  }

  try {
    let res;

    if (query) {
      res = await medusaRequest({
        method: 'GET',
        path: `/products?q=${query}&limit=100`,
        tags: ['products']
      });
    } else if (categoryId) {
      res = await medusaRequest({
        method: 'GET',
        path: `/products?category_id[]=${categoryId}&limit=100`,
        tags: ['products']
      });
    } else {
      res = await medusaRequest({ method: 'GET', path: `/products?limit=100`, tags: ['products'] });
    }

    if (!res?.body?.products) {
      console.log('Backend not available, returning mock products');
      return mockProducts;
    }

    let products: Product[] = res.body.products.map((product: MedusaProduct) =>
      reshapeProduct(product)
    );

    sortKey === 'PRICE' &&
      products.sort(
        (a, b) =>
          parseFloat(a.priceRange.maxVariantPrice.amount) -
          parseFloat(b.priceRange.maxVariantPrice.amount)
      );

    sortKey === 'CREATED_AT' &&
      products.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    reverse && products.reverse();

    return products;
  } catch (error) {
    console.log('Error fetching products:', error);
    return mockProducts;
  }
}

export async function getMenu(menu: string): Promise<any[]> {
  if (menu === 'next-js-frontend-header-menu') {
    const categories = await getCategories();
    return categories.map((cat) => ({
      title: cat.title,
      path: cat.path
    }));
  }

  if (menu === 'next-js-frontend-footer-menu') {
    return [
      { title: 'About Medusa', path: 'https://medusajs.com/' },
      { title: 'Medusa Docs', path: 'https://docs.medusajs.com/' },
      { title: 'Medusa Blog', path: 'https://medusajs.com/blog' }
    ];
  }

  return [];
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Medusa,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = ['categories/create', 'categories/delete', 'categories/update'];
  const productWebhooks = ['products/create', 'products/delete', 'products/update'];
  const topic = headers().get('x-medusa-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.MEDUSA_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 200 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.categories);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
