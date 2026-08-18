export interface OpenFoodFactsProduct {
  barcode: string;
  productNamePt: string;
  brand: string;
  packageSizeGrams: number;
}

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const res = await fetch(`https://br.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 1 && data.product) {
      return {
        barcode,
        productNamePt: data.product.product_name_pt || data.product.product_name || 'Produto Comercial',
        brand: data.product.brands || 'Marca Genérica',
        packageSizeGrams: parseFloat(data.product.product_quantity) || 500,
      };
    }
  } catch (err) {
    console.warn('Open Food Facts API offline fallback:', err);
  }

  return null;
}
