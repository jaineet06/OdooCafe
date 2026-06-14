const cache = new Map();

/** Placeholder image without API key — deterministic per query */
export function getUnsplashPlaceholder(query = "cafe food") {
  const key = query.toLowerCase().trim() || "cafe";
  if (cache.has(key)) return cache.get(key);
  const url = `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(key)},food,cafe`;
  cache.set(key, url);
  return url;
}

export async function searchUnsplashPhotos(query, { perPage = 6 } = {}) {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((p) => ({
    id: p.id,
    url: p.urls?.small,
    thumb: p.urls?.thumb,
    alt: p.alt_description || query,
  }));
}

export function resolveProductImage(product) {
  if (product?.image_url) return product.image_url;
  const q = product?.category_name || product?.name || "cafe";
  return getUnsplashPlaceholder(q);
}
