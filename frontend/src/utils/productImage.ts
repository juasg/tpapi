// Maps product category keywords to Unsplash photo IDs (curated, stable URLs)
const CATEGORY_PHOTOS: Record<string, string> = {
  // Raw / Industrial Materials
  'raw material':       'photo-1558618666-fcd25c85cd64', // steel coils
  'chemical':           'photo-1603126857599-f6e157fa2fe6', // laboratory chemicals
  'metal':              'photo-1504328345606-18bbc8c9d7d1', // metal parts
  'steel':              'photo-1504328345606-18bbc8c9d7d1',
  'plastic':            'photo-1558618047-3d59f4ab4f3d', // plastic pellets
  'timber':             'photo-1541123437800-1bb1317badc2', // timber/wood
  'wood':               'photo-1541123437800-1bb1317badc2',
  'glass':              'photo-1589802829985-817e51171b92',
  'rubber':             'photo-1558618666-fcd25c85cd64',
  // Machinery & Equipment
  'machinery':          'photo-1581091226825-a6a2a5aee158', // industrial machine
  'equipment':          'photo-1581091226825-a6a2a5aee158',
  'tool':               'photo-1504917595217-d4dc5ebe6122', // tools
  'hardware':           'photo-1504917595217-d4dc5ebe6122',
  'pump':               'photo-1609177682892-b4e38de5a7e6',
  'valve':              'photo-1609177682892-b4e38de5a7e6',
  'motor':              'photo-1621188988909-fbef0a27e8b9',
  'sensor':             'photo-1518770660439-4636190af475', // circuit/electronics
  // Electronics & Technology
  'electronic':         'photo-1518770660439-4636190af475',
  'component':          'photo-1518770660439-4636190af475',
  'circuit':            'photo-1518770660439-4636190af475',
  'cable':              'photo-1558618666-fcd25c85cd64',
  // Packaging
  'packaging':          'photo-1554224155-6726b3ff858f', // cardboard boxes
  'container':          'photo-1554224155-6726b3ff858f',
  'box':                'photo-1554224155-6726b3ff858f',
  // Office & Supplies
  'office':             'photo-1497366216548-37526070297c', // office supplies
  'supply':             'photo-1497366216548-37526070297c',
  'stationery':         'photo-1497366216548-37526070297c',
  // Logistics & Spare Parts
  'spare part':         'photo-1504917595217-d4dc5ebe6122',
  'bearing':            'photo-1609177682892-b4e38de5a7e6',
  'fastener':           'photo-1504917595217-d4dc5ebe6122',
  // Construction
  'construction':       'photo-1504307651254-35680f356dfd', // construction site
  'building':           'photo-1504307651254-35680f356dfd',
  'cement':             'photo-1504307651254-35680f356dfd',
  'pipe':               'photo-1609177682892-b4e38de5a7e6',
  // Food & Consumer Goods (B2B wholesale)
  'food':               'photo-1498579150354-977475b7ea0b',
  'beverage':           'photo-1534353473418-4cfa0e4a7c6a',
  'textile':            'photo-1558769132-cb1aea458c5e',
  'apparel':            'photo-1558769132-cb1aea458c5e',
};

// Deterministic numeric seed from a string (djb2 hash)
function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33) ^ id.charCodeAt(i);
  return Math.abs(h);
}

export function getProductImageUrl(product: { id: string; category: string; imageUrl?: string }): string {
  if (product.imageUrl) return product.imageUrl;

  const cat = product.category.toLowerCase();
  for (const [keyword, photoId] of Object.entries(CATEGORY_PHOTOS)) {
    if (cat.includes(keyword)) {
      return `https://images.unsplash.com/${photoId}?w=400&h=240&fit=crop&auto=format`;
    }
  }

  // Deterministic fallback: picsum seeded by product ID
  const seed = hashId(product.id) % 1000;
  return `https://picsum.photos/seed/${seed}/400/240`;
}
