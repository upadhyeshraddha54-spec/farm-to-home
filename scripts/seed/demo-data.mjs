// Demo catalogue for Farm To Home.
//
// Every farm here is FICTIONAL. Prices are ILLUSTRATIVE, not market quotes.
// All records are written with `isDemo: true` and IDs starting with "demo-",
// so they are clearly labelled in the store and can be removed safely with
//   npm run seed:demo -- --remove --write
//
// `image` is a file in ./images (freely licensed photos from Wikimedia Commons;
// credits are in ./image-credits.json and are shown on each product page).

export const DEMO_NOTE = 'Demo listing: fictional farm, illustrative price.'

// Same as DEFAULT_CATEGORIES in src/utils/constants.js (created only if missing).
export const DEMO_CATEGORIES = [
  { value: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { value: 'fruits', label: 'Fruits', emoji: '🥭' },
  { value: 'grains-pulses', label: 'Grains & Pulses', emoji: '🌾' },
  { value: 'dairy-eggs', label: 'Dairy & Eggs', emoji: '🥛' },
  { value: 'spices-herbs', label: 'Spices & Herbs', emoji: '🌶️' },
  { value: 'dry-fruits-nuts', label: 'Dry Fruits & Nuts', emoji: '🥜' },
  { value: 'honey-jaggery', label: 'Honey & Jaggery', emoji: '🍯' },
  { value: 'oils-ghee', label: 'Oils & Ghee', emoji: '🫙' },
]

export const DEMO_FARMS = [
  {
    id: 'demo-farm-01',
    farmName: 'Godavari Green Acres',
    city: 'Nashik',
    description:
      'Family vegetable and grape farm on the banks of the Godavari. Known for crisp onions and seedless grapes picked the morning they ship.',
    products: [
      { slug: 'onions', name: 'Onions', category: 'vegetables', unit: 'kg', price: 32, mrp: 40, stock: 450, image: 'onions',
        description: 'Firm, dry-skinned onions with a strong flavour. Cured in the field for longer shelf life. Store in a cool, airy place.' },
      { slug: 'grapes', name: 'Seedless Grapes (Black & Green)', category: 'fruits', unit: '500g', price: 65, mrp: 80, stock: 120, image: 'grapes',
        description: 'Sweet, juicy seedless grapes harvested in small lots. Wash just before eating and keep refrigerated.' },
      { slug: 'tomatoes', name: 'Farm Tomatoes', category: 'vegetables', unit: 'kg', price: 30, stock: 300, image: 'tomatoes',
        description: 'Vine-ripened tomatoes, ideal for curries, chutneys and salads.' },
      { slug: 'capsicum', name: 'Capsicum (Mixed Colours)', category: 'vegetables', unit: '500g', price: 55, mrp: 70, stock: 80, image: 'capsicum',
        description: 'Green, red and yellow bell peppers grown in a polyhouse. Crunchy and mildly sweet.' },
      { slug: 'coriander', name: 'Fresh Coriander', category: 'vegetables', unit: 'bunch', price: 15, stock: 4, image: 'coriander',
        description: 'Fragrant coriander (kothimbir) bunches, cut daily. Keep the roots in water to stay fresh longer.' },
    ],
  },
  {
    id: 'demo-farm-02',
    farmName: 'Indrayani Valley Farm',
    city: 'Pune',
    description:
      'A small farm in the Maval hills growing aromatic Indrayani rice in the monsoon and leafy vegetables through the winter.',
    products: [
      { slug: 'indrayani-rice', name: 'Indrayani Rice', category: 'grains-pulses', unit: 'kg', price: 85, mrp: 95, stock: 600, image: 'indrayani-rice',
        description: 'Aromatic, soft-cooking short-grain rice from the Maval region. Perfect for everyday meals and varan-bhaat.' },
      { slug: 'spinach', name: 'Spinach (Palak)', category: 'vegetables', unit: 'bunch', price: 20, stock: 60, image: 'spinach',
        description: 'Tender spinach leaves, harvested young. Great for palak paneer, dal and parathas.' },
      { slug: 'cauliflower', name: 'Cauliflower', category: 'vegetables', unit: 'piece', price: 35, stock: 90, image: 'cauliflower',
        description: 'Compact white cauliflower heads, about 600–800 g each.' },
      { slug: 'okra', name: 'Okra (Bhindi)', category: 'vegetables', unit: '500g', price: 35, stock: 75, image: 'okra',
        description: 'Tender, snap-fresh okra pods picked every other day.' },
      { slug: 'cabbage', name: 'Cabbage', category: 'vegetables', unit: 'piece', price: 30, stock: 110, image: 'cabbage',
        description: 'Tight green cabbage heads, about 1 kg each. Ideal for stir-fries and koshimbir.' },
    ],
  },
  {
    id: 'demo-farm-03',
    farmName: 'Konkan Coast Orchards',
    city: 'Ratnagiri',
    description:
      'Coastal orchard with mango, cashew and kokum trees growing in red laterite soil, a few kilometres from the sea.',
    products: [
      { slug: 'alphonso-mangoes', name: 'Alphonso Mangoes', category: 'fruits', unit: 'dozen', price: 950, mrp: 1100, stock: 40, image: 'alphonso-mangoes',
        description: 'Naturally ripened Alphonso (hapus) mangoes with rich aroma and saffron-coloured pulp. Packed in hay.' },
      { slug: 'cashews', name: 'Whole Cashews', category: 'dry-fruits-nuts', unit: '250g', price: 260, mrp: 300, stock: 150, image: 'cashews',
        description: 'Hand-processed whole cashew kernels from our own trees. Store in an airtight jar.' },
      { slug: 'kokum', name: 'Dried Kokum', category: 'spices-herbs', unit: '250g', price: 120, stock: 70, image: 'kokum',
        description: 'Sun-dried kokum rinds for sol kadhi, amti and fish curries. Adds a gentle tang.' },
      { slug: 'jackfruit', name: 'Jackfruit', category: 'fruits', unit: 'piece', price: 280, stock: 3, image: 'jackfruit',
        description: 'Whole ripe jackfruit, about 5–7 kg. Sweet golden bulbs; oil your knife before cutting.' },
    ],
  },
  {
    id: 'demo-farm-04',
    farmName: 'Vidarbha Citrus Grove',
    city: 'Nagpur',
    description:
      'Citrus orchard in the orange belt of Vidarbha, growing juicy oranges and sweet lime alongside a winter wheat crop.',
    products: [
      { slug: 'nagpur-oranges', name: 'Nagpur Oranges', category: 'fruits', unit: 'kg', price: 80, mrp: 100, stock: 350, image: 'nagpur-oranges',
        description: 'Loose-skinned, easy-to-peel oranges with a sweet-tangy taste. Rich in vitamin C.' },
      { slug: 'mosambi', name: 'Sweet Lime (Mosambi)', category: 'fruits', unit: 'kg', price: 70, stock: 200, image: 'mosambi',
        description: 'Mild, juicy sweet lime — perfect for fresh juice.' },
      { slug: 'lemons', name: 'Lemons', category: 'fruits', unit: 'dozen', price: 50, stock: 140, image: 'lemons',
        description: 'Thin-skinned, juicy lemons for nimbu pani, pickles and cooking.' },
      { slug: 'lokwan-wheat', name: 'Lokwan Wheat', category: 'grains-pulses', unit: 'kg', price: 42, mrp: 48, stock: 900, image: 'lokwan-wheat',
        description: 'Cleaned whole Lokwan wheat, ready to be milled into soft chapati atta.' },
    ],
  },
  {
    id: 'demo-farm-05',
    farmName: 'Tapi Banks Farm',
    city: 'Jalgaon',
    description:
      'Banana and vegetable farm in the fertile Tapi valley, also growing moong as a rotation crop.',
    products: [
      { slug: 'bananas', name: 'Jalgaon Bananas', category: 'fruits', unit: 'dozen', price: 60, stock: 250, image: 'bananas',
        description: 'Naturally ripened bananas from Jalgaon, the banana capital of Maharashtra.' },
      { slug: 'brinjal', name: 'Purple Brinjal (Vangi)', category: 'vegetables', unit: 'kg', price: 40, stock: 95, image: 'brinjal',
        description: 'Small, glossy brinjals ideal for bharli vangi and bhaji.' },
      { slug: 'chillies', name: 'Fresh Chillies (Mixed)', category: 'vegetables', unit: '250g', price: 25, stock: 85, image: 'chillies',
        description: 'A mix of hot and mild chillies for thecha, tadka and pickles.' },
      { slug: 'moong', name: 'Whole Moong', category: 'grains-pulses', unit: 'kg', price: 130, mrp: 145, stock: 220, image: 'moong',
        description: 'Clean green gram for usal, sprouts and khichdi.' },
    ],
  },
  {
    id: 'demo-farm-06',
    farmName: 'Bhima Valley Farms',
    city: 'Solapur',
    description:
      'Dryland farm growing pomegranates and custard apples, plus hardy millets that need very little water.',
    products: [
      { slug: 'pomegranates', name: 'Bhagwa Pomegranates', category: 'fruits', unit: 'kg', price: 150, mrp: 180, stock: 130, image: 'pomegranates',
        description: 'Deep red, sweet arils with soft seeds. Great for juice and salads.' },
      { slug: 'jowar', name: 'Jowar (Sorghum)', category: 'grains-pulses', unit: 'kg', price: 55, stock: 400, image: 'jowar',
        description: 'Whole white jowar for bhakri. Gluten-free and high in fibre.' },
      { slug: 'bajra', name: 'Bajra (Pearl Millet)', category: 'grains-pulses', unit: 'kg', price: 40, stock: 380, image: 'bajra',
        description: 'Whole bajra grain for winter bhakri and khichdi.' },
      { slug: 'sitaphal', name: 'Sitaphal (Custard Apple)', category: 'fruits', unit: 'kg', price: 110, stock: 2, image: 'sitaphal',
        description: 'Creamy, sweet custard apples. Ripen at room temperature, then refrigerate.' },
    ],
  },
  {
    id: 'demo-farm-07',
    farmName: 'Manjara Fields',
    city: 'Latur',
    description:
      'Pulse farm in the Marathwada dal belt. Pulses are cleaned and split in small batches at a local mill.',
    products: [
      { slug: 'toor-dal', name: 'Toor Dal', category: 'grains-pulses', unit: 'kg', price: 165, mrp: 180, stock: 500, image: 'toor-dal',
        description: 'Unpolished split pigeon peas for everyday varan and amti.' },
      { slug: 'chana-dal', name: 'Chana Dal', category: 'grains-pulses', unit: 'kg', price: 95, stock: 420, image: 'chana-dal',
        description: 'Split Bengal gram for puran poli, dal and snacks.' },
      { slug: 'masoor-dal', name: 'Masoor Dal', category: 'grains-pulses', unit: 'kg', price: 110, stock: 300, image: 'masoor-dal',
        description: 'Quick-cooking lentils, rich in protein.' },
      { slug: 'urad', name: 'Whole Urad', category: 'grains-pulses', unit: 'kg', price: 140, mrp: 155, stock: 0, image: 'urad',
        description: 'Whole black gram for dal makhani and idli-dosa batter.' },
    ],
  },
  {
    id: 'demo-farm-08',
    farmName: 'Panchganga Dairy Farm',
    city: 'Kolhapur',
    description:
      'Small dairy farm with desi cows and buffaloes, plus a sugarcane field and a traditional jaggery unit.',
    products: [
      { slug: 'cow-milk', name: 'Fresh Cow Milk', category: 'dairy-eggs', unit: 'litre', price: 64, stock: 120, image: 'cow-milk',
        description: 'Fresh, chilled cow milk collected every morning. Boil before use.' },
      { slug: 'paneer', name: 'Fresh Paneer', category: 'dairy-eggs', unit: '250g', price: 110, stock: 45, image: 'paneer',
        description: 'Soft paneer made the same day from full-cream milk.' },
      { slug: 'ghee', name: 'Desi Cow Ghee', category: 'oils-ghee', unit: '500g', price: 520, mrp: 600, stock: 60, image: 'ghee',
        description: 'Slow-cooked ghee with a rich, nutty aroma.' },
      { slug: 'curd', name: 'Set Curd (Dahi)', category: 'dairy-eggs', unit: '500g', price: 45, stock: 70, image: 'curd',
        description: 'Thick, mildly sour curd set overnight. Keep refrigerated.' },
      { slug: 'jaggery', name: 'Kolhapuri Jaggery', category: 'honey-jaggery', unit: 'kg', price: 75, mrp: 90, stock: 260, image: 'jaggery',
        description: 'Chemical-free golden jaggery made from our own sugarcane.' },
    ],
  },
]
