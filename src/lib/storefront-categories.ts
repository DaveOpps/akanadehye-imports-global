// Curated storefront categories — umbrella headings, each containing subgroups
// of links that map to product slugs. Used by:
//   - CategoryRail: shows the umbrella icons under the navbar
//   - MegaMenu: shows umbrella on left, subgroups expanded on hover
//
// Slug convention:
//   - If the slug matches a dummyjson category, real products will appear.
//   - Otherwise (placeholder slug), the listing renders a "category coming soon"
//     empty state — wire up your own catalog later and the URLs already work.

export type SubItem = { label: string; slug: string };
export type SubGroup = { title: string; items: SubItem[] };

export type UmbrellaCategory = {
  label: string;
  primarySlug: string;   // where clicking the umbrella tile goes
  icon: string;          // icon key for <CategoryIcon name=... />
  blurb?: string;        // optional one-line teaser shown in the mega-menu header
  groups: SubGroup[];    // subcategory groups
};

export const UMBRELLA_CATEGORIES: UmbrellaCategory[] = [
  {
    label: "Supermarket",
    primarySlug: "groceries",
    icon: "basket",
    blurb: "Pantry staples, drinks, snacks and household essentials.",
    groups: [
      {
        title: "Pantry",
        items: [
          { label: "Food & Grain", slug: "food-grain" },
          { label: "Rice & Grains", slug: "rice-grains" },
          { label: "Cooking Oils", slug: "cooking-oils" },
          { label: "Sauces & Condiments", slug: "sauces" },
          { label: "Spices & Seasoning", slug: "spices" },
          { label: "Pasta & Noodles", slug: "pasta" },
          { label: "Baking", slug: "baking" },
        ],
      },
      {
        title: "Drinks",
        items: [
          { label: "Soft Drinks", slug: "soft-drinks" },
          { label: "Water", slug: "water" },
          { label: "Juices", slug: "juices" },
          { label: "Tea & Coffee", slug: "tea-coffee" },
          { label: "Energy Drinks", slug: "energy-drinks" },
        ],
      },
      {
        title: "Snacks & Confectionery",
        items: [
          { label: "Biscuits", slug: "biscuits" },
          { label: "Crisps", slug: "crisps" },
          { label: "Chocolate", slug: "chocolate" },
          { label: "Nuts & Seeds", slug: "nuts" },
        ],
      },
      {
        title: "Frozen & Dairy",
        items: [
          { label: "Frozen Meat", slug: "frozen-meat" },
          { label: "Frozen Vegetables", slug: "frozen-vegetables" },
          { label: "Milk & Cream", slug: "milk" },
          { label: "Cheese & Yogurt", slug: "dairy" },
          { label: "Eggs", slug: "eggs" },
        ],
      },
      {
        title: "Household",
        items: [
          { label: "Cleaning Supplies", slug: "cleaning" },
          { label: "Laundry", slug: "laundry" },
          { label: "Paper Products", slug: "paper-products" },
          { label: "All Groceries", slug: "groceries" },
        ],
      },
    ],
  },

  {
    label: "Phones & Tablets",
    primarySlug: "smartphones",
    icon: "phone",
    blurb: "Latest smartphones, tablets, and mobile accessories.",
    groups: [
      {
        title: "Mobile Phones",
        items: [
          { label: "Smartphones", slug: "smartphones" },
          { label: "Feature Phones", slug: "feature-phones" },
          { label: "Refurbished Phones", slug: "refurbished-phones" },
        ],
      },
      {
        title: "Tablets",
        items: [
          { label: "All Tablets", slug: "tablets" },
          { label: "iPad", slug: "ipad" },
          { label: "Android Tablets", slug: "android-tablets" },
          { label: "E-Readers", slug: "e-readers" },
        ],
      },
      {
        title: "Accessories",
        items: [
          { label: "Cases & Covers", slug: "mobile-accessories" },
          { label: "Chargers & Cables", slug: "chargers-cables" },
          { label: "Power Banks", slug: "power-banks" },
          { label: "Headphones & Earbuds", slug: "headphones" },
          { label: "Bluetooth Devices", slug: "bluetooth" },
          { label: "Screen Protectors", slug: "screen-protectors" },
          { label: "Memory Cards", slug: "memory-cards" },
        ],
      },
      {
        title: "Wearables",
        items: [
          { label: "Smart Watches", slug: "smart-watches" },
          { label: "Fitness Trackers", slug: "fitness-trackers" },
        ],
      },
    ],
  },

  {
    label: "Computing",
    primarySlug: "laptops",
    icon: "laptop",
    blurb: "Laptops, desktops, monitors and everything you need to work.",
    groups: [
      {
        title: "Laptops",
        items: [
          { label: "All Laptops", slug: "laptops" },
          { label: "Gaming Laptops", slug: "gaming-laptops" },
          { label: "Ultraportables", slug: "ultraportables" },
          { label: "2-in-1 Convertibles", slug: "2in1-laptops" },
          { label: "Workstations", slug: "workstations" },
        ],
      },
      {
        title: "Desktops & Monitors",
        items: [
          { label: "Desktop PCs", slug: "desktop-pcs" },
          { label: "All-in-One PCs", slug: "all-in-one-pcs" },
          { label: "Monitors", slug: "monitors" },
        ],
      },
      {
        title: "Computer Accessories",
        items: [
          { label: "Keyboards & Mice", slug: "keyboards-mice" },
          { label: "Printers", slug: "printers" },
          { label: "Scanners", slug: "scanners" },
          { label: "External Hard Drives", slug: "external-hdds" },
          { label: "Flash Drives", slug: "flash-drives" },
          { label: "UPS & Surge Protectors", slug: "ups" },
          { label: "Networking", slug: "networking" },
        ],
      },
      {
        title: "Software",
        items: [
          { label: "Operating Systems", slug: "operating-systems" },
          { label: "Office Suites", slug: "office-suites" },
          { label: "Security", slug: "security-software" },
        ],
      },
    ],
  },

  {
    label: "Electronics",
    primarySlug: "electronics",
    icon: "tv",
    blurb: "Audio, TVs, cameras and home entertainment.",
    groups: [
      {
        title: "Home Audio",
        items: [
          { label: "Speakers", slug: "speakers" },
          { label: "Bluetooth Speakers", slug: "bluetooth-speakers" },
          { label: "Outdoor Speakers", slug: "outdoor-speakers" },
          { label: "Soundbars", slug: "soundbars" },
          { label: "Home Theatre Systems", slug: "home-theatre" },
          { label: "Compact Radios", slug: "radios" },
        ],
      },
      {
        title: "Televisions",
        items: [
          { label: "All TVs", slug: "tvs" },
          { label: "Smart TVs", slug: "smart-tvs" },
          { label: 'TVs up to 32"', slug: "tvs-32" },
          { label: 'TVs 43" – 50"', slug: "tvs-43" },
          { label: 'TVs 55" – 65"', slug: "tvs-55" },
          { label: 'TVs 65" and above', slug: "tvs-65-plus" },
          { label: "DVD & Blu-Ray Players", slug: "dvd-players" },
        ],
      },
      {
        title: "Cameras",
        items: [
          { label: "Digital Cameras", slug: "digital-cameras" },
          { label: "Action Cameras", slug: "action-cameras" },
          { label: "Camcorders", slug: "camcorders" },
          { label: "Lenses", slug: "lenses" },
          { label: "Tripods", slug: "tripods" },
          { label: "Surveillance Cameras", slug: "surveillance" },
        ],
      },
      {
        title: "Projectors & VR",
        items: [
          { label: "Projectors", slug: "projectors" },
          { label: "VR Headsets", slug: "vr-headsets" },
        ],
      },
      {
        title: "Gadgets & Smart Devices",
        items: [
          { label: "Electronics & Gadgets", slug: "electronics-gadgets" },
          { label: "Smart Accessories", slug: "smart-accessories" },
          { label: "RGB & Wireless", slug: "rgb-wireless" },
        ],
      },
    ],
  },

  {
    label: "Appliances",
    primarySlug: "appliances",
    icon: "fridge",
    blurb: "Kitchen, laundry, and home appliances.",
    groups: [
      {
        title: "Large Appliances",
        items: [
          { label: "Refrigerators", slug: "refrigerators" },
          { label: "Freezers", slug: "freezers" },
          { label: "Chest Freezers", slug: "chest-freezers" },
          { label: "Washing Machines", slug: "washing-machines" },
          { label: "Dryers", slug: "dryers" },
          { label: "Dishwashers", slug: "dishwashers" },
          { label: "Gas Cookers", slug: "gas-cookers" },
          { label: "Electric Cookers", slug: "electric-cookers" },
        ],
      },
      {
        title: "Small Appliances",
        items: [
          { label: "Blenders", slug: "blenders" },
          { label: "Mixers", slug: "mixers" },
          { label: "Food Processors", slug: "food-processors" },
          { label: "Juicers", slug: "juicers" },
          { label: "Coffee Makers", slug: "coffee-makers" },
          { label: "Kettles & Toasters", slug: "kettles-toasters" },
          { label: "Microwaves", slug: "microwaves" },
          { label: "Rice Cookers", slug: "rice-cookers" },
          { label: "Air Fryers", slug: "air-fryers" },
          { label: "Irons", slug: "irons" },
          { label: "Vacuums", slug: "vacuums" },
        ],
      },
      {
        title: "Climate Control",
        items: [
          { label: "Air Conditioners", slug: "air-conditioners" },
          { label: "Fans", slug: "fans" },
          { label: "Heaters", slug: "heaters" },
          { label: "Humidifiers", slug: "humidifiers" },
          { label: "Air Purifiers", slug: "air-purifiers" },
          { label: "Water Dispensers", slug: "water-dispensers" },
        ],
      },
    ],
  },

  {
    label: "Health & Beauty",
    primarySlug: "beauty",
    icon: "sparkle",
    blurb: "Skincare, fragrance, wellness and personal care.",
    groups: [
      {
        title: "Beauty",
        items: [
          { label: "Makeup", slug: "beauty" },
          { label: "Skin Care", slug: "skin-care" },
          { label: "Hair Care", slug: "hair-care" },
          { label: "Nail Care", slug: "nail-care" },
          { label: "Body Care", slug: "body-care" },
        ],
      },
      {
        title: "Fragrance",
        items: [
          { label: "All Fragrances", slug: "fragrances" },
          { label: "Perfumes for Her", slug: "perfumes-women" },
          { label: "Perfumes for Him", slug: "perfumes-men" },
          { label: "Unisex Fragrances", slug: "perfumes-unisex" },
        ],
      },
      {
        title: "Personal Care",
        items: [
          { label: "Oral Care", slug: "oral-care" },
          { label: "Shaving & Grooming", slug: "shaving" },
          { label: "Deodorants", slug: "deodorants" },
          { label: "Feminine Hygiene", slug: "feminine-hygiene" },
        ],
      },
      {
        title: "Health & Wellness",
        items: [
          { label: "Vitamins & Supplements", slug: "supplements" },
          { label: "First Aid", slug: "first-aid" },
          { label: "Medical Equipment", slug: "medical-equipment" },
          { label: "Massage & Aromatherapy", slug: "massage" },
        ],
      },
    ],
  },

  {
    label: "Fashion",
    primarySlug: "mens-shirts",
    icon: "shirt",
    blurb: "Wardrobe staples and standout pieces for every occasion.",
    groups: [
      {
        title: "Men",
        items: [
          { label: "Shirts", slug: "mens-shirts" },
          { label: "T-Shirts & Polos", slug: "mens-tshirts" },
          { label: "Trousers & Jeans", slug: "mens-trousers" },
          { label: "Suits & Blazers", slug: "mens-suits" },
          { label: "Shoes", slug: "mens-shoes" },
          { label: "Sneakers", slug: "mens-sneakers" },
          { label: "Watches", slug: "mens-watches" },
          { label: "Bags & Wallets", slug: "mens-bags" },
        ],
      },
      {
        title: "Women",
        items: [
          { label: "Dresses", slug: "womens-dresses" },
          { label: "Tops & Blouses", slug: "tops" },
          { label: "Trousers & Jeans", slug: "womens-trousers" },
          { label: "Skirts", slug: "skirts" },
          { label: "Shoes & Heels", slug: "womens-shoes" },
          { label: "Handbags", slug: "womens-bags" },
          { label: "Jewellery", slug: "womens-jewellery" },
          { label: "Watches", slug: "womens-watches" },
          { label: "Lingerie", slug: "lingerie" },
        ],
      },
      {
        title: "Children",
        items: [
          { label: "Boys", slug: "boys-clothing" },
          { label: "Girls", slug: "girls-clothing" },
          { label: "School Uniforms", slug: "school-uniforms" },
          { label: "Kids Shoes", slug: "kids-shoes" },
        ],
      },
      {
        title: "Accessories",
        items: [
          { label: "Bags & Accessories", slug: "bags-accessories" },
          { label: "Footwear", slug: "footwear" },
          { label: "Sunglasses", slug: "sunglasses" },
          { label: "Belts", slug: "belts" },
          { label: "Hats & Caps", slug: "hats" },
          { label: "Scarves", slug: "scarves" },
        ],
      },
    ],
  },

  {
    label: "Home & Living",
    primarySlug: "furniture",
    icon: "home",
    blurb: "Furniture, decor, and pieces that make a house a home.",
    groups: [
      {
        title: "Furniture",
        items: [
          { label: "Living Room", slug: "furniture-living" },
          { label: "Bedroom", slug: "furniture-bedroom" },
          { label: "Dining Room", slug: "furniture-dining" },
          { label: "Office", slug: "furniture-office" },
          { label: "Outdoor", slug: "furniture-outdoor" },
          { label: "All Furniture", slug: "furniture" },
        ],
      },
      {
        title: "Decor",
        items: [
          { label: "Wall Art", slug: "wall-art" },
          { label: "Mirrors", slug: "mirrors" },
          { label: "Clocks", slug: "clocks" },
          { label: "Vases", slug: "vases" },
          { label: "Candles", slug: "candles" },
          { label: "Rugs & Mats", slug: "rugs" },
          { label: "All Decor", slug: "home-decoration" },
        ],
      },
      {
        title: "Kitchen & Dining",
        items: [
          { label: "Drinkware & Tumblers", slug: "drinkware-tumblers" },
          { label: "Home & Cleaning", slug: "home-cleaning" },
          { label: "Cookware", slug: "cookware" },
          { label: "Bakeware", slug: "bakeware" },
          { label: "Cutlery & Utensils", slug: "cutlery" },
          { label: "Glassware", slug: "glassware" },
          { label: "Storage", slug: "kitchen-storage" },
          { label: "All Kitchen", slug: "kitchen-accessories" },
        ],
      },
      {
        title: "Bedding & Bath",
        items: [
          { label: "Furniture & Bedding", slug: "furniture-bedding" },
          { label: "Bed Linen", slug: "bed-linen" },
          { label: "Pillows & Duvets", slug: "pillows-duvets" },
          { label: "Towels", slug: "towels" },
          { label: "Bath Mats", slug: "bath-mats" },
        ],
      },
      {
        title: "Lighting",
        items: [
          { label: "Ceiling Lights", slug: "ceiling-lights" },
          { label: "Lamps", slug: "lamps" },
          { label: "Outdoor Lighting", slug: "outdoor-lighting" },
          { label: "Bulbs", slug: "bulbs" },
        ],
      },
    ],
  },

  {
    label: "Sports & Outdoors",
    primarySlug: "sports-accessories",
    icon: "dumbbell",
    blurb: "Gear up for fitness, sport and adventure.",
    groups: [
      {
        title: "Sports",
        items: [
          { label: "Football", slug: "football" },
          { label: "Basketball", slug: "basketball" },
          { label: "Tennis", slug: "tennis" },
          { label: "Cricket", slug: "cricket" },
          { label: "Boxing", slug: "boxing" },
          { label: "Swimming", slug: "swimming" },
          { label: "All Sports Gear", slug: "sports-accessories" },
        ],
      },
      {
        title: "Fitness",
        items: [
          { label: "Gym Equipment", slug: "gym-equipment" },
          { label: "Weights", slug: "weights" },
          { label: "Yoga & Pilates", slug: "yoga-pilates" },
          { label: "Cardio Machines", slug: "cardio" },
        ],
      },
      {
        title: "Outdoor",
        items: [
          { label: "Camping", slug: "camping" },
          { label: "Hiking", slug: "hiking" },
          { label: "Cycling", slug: "cycling" },
          { label: "Fishing", slug: "fishing" },
        ],
      },
      {
        title: "Vehicles",
        items: [
          { label: "Bicycles", slug: "bicycles" },
          { label: "Motorcycles", slug: "motorcycle" },
          { label: "Scooters", slug: "scooters" },
          { label: "Cars & Trucks", slug: "vehicle" },
        ],
      },
    ],
  },

  {
    label: "Baby & Kids",
    primarySlug: "baby-products",
    icon: "baby",
    blurb: "Baby gear, toys, and everything your little ones need.",
    groups: [
      {
        title: "Baby Care",
        items: [
          { label: "Diapers", slug: "diapers" },
          { label: "Baby Food", slug: "baby-food" },
          { label: "Bottles & Feeding", slug: "baby-feeding" },
          { label: "Baby Skincare", slug: "baby-skincare" },
          { label: "Baby Clothes", slug: "baby-clothes" },
        ],
      },
      {
        title: "Gear",
        items: [
          { label: "Strollers", slug: "strollers" },
          { label: "Car Seats", slug: "car-seats" },
          { label: "Baby Carriers", slug: "baby-carriers" },
        ],
      },
      {
        title: "Nursery",
        items: [
          { label: "Cribs & Cots", slug: "cribs" },
          { label: "Baby Mattresses", slug: "baby-mattresses" },
          { label: "Nursery Bedding", slug: "nursery-bedding" },
        ],
      },
      {
        title: "Toys",
        items: [
          { label: "Action Figures", slug: "action-figures" },
          { label: "Dolls", slug: "dolls" },
          { label: "Building Blocks", slug: "building-blocks" },
          { label: "Educational Toys", slug: "educational-toys" },
          { label: "Outdoor Toys", slug: "outdoor-toys" },
        ],
      },
    ],
  },

  {
    label: "Gaming",
    primarySlug: "gaming",
    icon: "gamepad",
    blurb: "Consoles, games and accessories for every platform.",
    groups: [
      {
        title: "PlayStation",
        items: [
          { label: "PS5 Consoles", slug: "ps5-consoles" },
          { label: "PS5 Games", slug: "ps5-games" },
          { label: "PS5 Accessories", slug: "ps5-accessories" },
          { label: "PS4 Games", slug: "ps4-games" },
          { label: "PS4 Accessories", slug: "ps4-accessories" },
        ],
      },
      {
        title: "Xbox",
        items: [
          { label: "Xbox Series X/S", slug: "xbox-series" },
          { label: "Xbox Games", slug: "xbox-games" },
          { label: "Xbox Accessories", slug: "xbox-accessories" },
        ],
      },
      {
        title: "Nintendo",
        items: [
          { label: "Nintendo Switch", slug: "nintendo-switch" },
          { label: "Switch Games", slug: "switch-games" },
          { label: "Switch Accessories", slug: "switch-accessories" },
        ],
      },
      {
        title: "PC & Mobile Gaming",
        items: [
          { label: "Gaming Mice", slug: "gaming-mice" },
          { label: "Gaming Keyboards", slug: "gaming-keyboards" },
          { label: "Gaming Headsets", slug: "gaming-headsets" },
          { label: "Gaming Chairs", slug: "gaming-chairs" },
          { label: "Mobile Controllers", slug: "mobile-controllers" },
        ],
      },
    ],
  },

  {
    label: "Other categories",
    primarySlug: "other",
    icon: "cart",
    blurb: "Books, pets, auto, garden, and more.",
    groups: [
      {
        title: "Books, Music & Media",
        items: [
          { label: "Fiction", slug: "fiction-books" },
          { label: "Non-Fiction", slug: "nonfiction-books" },
          { label: "Children's Books", slug: "childrens-books" },
          { label: "Textbooks", slug: "textbooks" },
          { label: "Musical Instruments", slug: "musical-instruments" },
          { label: "CDs & Vinyl", slug: "cds-vinyl" },
        ],
      },
      {
        title: "Pet Supplies",
        items: [
          { label: "Dog Food & Toys", slug: "dog-supplies" },
          { label: "Cat Food & Litter", slug: "cat-supplies" },
          { label: "Bird Supplies", slug: "bird-supplies" },
          { label: "Fish & Aquarium", slug: "fish-supplies" },
        ],
      },
      {
        title: "Auto & Tools",
        items: [
          { label: "Car Accessories", slug: "car-accessories" },
          { label: "Car Care", slug: "car-care" },
          { label: "Tyres", slug: "tyres" },
          { label: "Power Tools", slug: "power-tools" },
          { label: "Hand Tools", slug: "hand-tools" },
        ],
      },
      {
        title: "Garden & Outdoor",
        items: [
          { label: "Garden Tools", slug: "garden-tools" },
          { label: "Outdoor Furniture", slug: "outdoor-furniture" },
          { label: "BBQ & Grills", slug: "bbq" },
          { label: "Plants", slug: "plants" },
        ],
      },
      {
        title: "Services",
        items: [
          { label: "Airtime & Data", slug: "airtime" },
          { label: "Bill Payments", slug: "bill-payments" },
          { label: "Gift Cards", slug: "gift-cards" },
        ],
      },
      {
        title: "Industrial & Wholesale",
        items: [
          { label: "Storage & Packaging", slug: "storage-packaging" },
          { label: "Industrial Supplies", slug: "industrial" },
          { label: "Wholesale", slug: "wholesale" },
        ],
      },
    ],
  },

  {
    label: "Building & Security",
    primarySlug: "building-security",
    icon: "door",
    blurb: "Security doors, gates, building materials and construction supplies.",
    groups: [
      {
        title: "Security Doors & Gates",
        items: [
          { label: "Security Doors & Gates", slug: "security-doors-gates" },
          { label: "Entry Doors", slug: "entry-doors" },
          { label: "Steel Doors", slug: "steel-doors" },
          { label: "Iron Gates", slug: "iron-gates" },
        ],
      },
      {
        title: "Building Materials",
        items: [
          { label: "Building Materials", slug: "building-materials" },
          { label: "Floor Coatings & Epoxy", slug: "floor-coatings" },
          { label: "Construction Supplies", slug: "construction-supplies" },
          { label: "Waterproofing", slug: "waterproofing" },
        ],
      },
    ],
  },

  {
    label: "Machinery & Equipment",
    primarySlug: "machinery-equipment",
    icon: "cog",
    blurb: "Agricultural machinery, food processing equipment and industrial machines.",
    groups: [
      {
        title: "Agricultural Machinery",
        items: [
          { label: "Agricultural Machinery", slug: "agricultural-machinery" },
          { label: "Corn Shellers", slug: "corn-shellers" },
          { label: "Grain Mills & Grinders", slug: "grain-mills" },
          { label: "Farm Equipment", slug: "farm-equipment" },
        ],
      },
      {
        title: "Food Processing Machines",
        items: [
          { label: "Food Processing Machines", slug: "food-processing-machines" },
          { label: "Noodle & Pasta Machines", slug: "noodle-machines" },
          { label: "Packaging Machines", slug: "packaging-machines" },
          { label: "Cup Sealing Machines", slug: "sealing-machines" },
        ],
      },
    ],
  },
];

// Flat list still used by CategoryRail — derived from the umbrellas so it stays in sync.
export const STOREFRONT_CATEGORIES = UMBRELLA_CATEGORIES.map((u) => ({
  label: u.label,
  slug: u.primarySlug,
  icon: u.icon,
}));

/**
 * Find the umbrella that owns a given category slug. Looks at both the umbrella's
 * primarySlug and every subcategory item slug. Returns undefined if no match.
 */
export function findUmbrellaForSlug(slug: string | undefined): UmbrellaCategory | undefined {
  if (!slug) return undefined;
  return UMBRELLA_CATEGORIES.find(
    (u) =>
      u.primarySlug === slug ||
      u.groups.some((g) => g.items.some((i) => i.slug === slug))
  );
}

/**
 * Resolve a category slug to its display label by walking the umbrella tree.
 * Falls back to a humanized version of the slug if it's not in our static map.
 */
export function findCategoryLabel(slug: string | undefined): string {
  if (!slug) return "All products";
  for (const u of UMBRELLA_CATEGORIES) {
    if (u.primarySlug === slug) return u.label;
    for (const g of u.groups) {
      const hit = g.items.find((i) => i.slug === slug);
      if (hit) return hit.label;
    }
  }
  // Fallback: turn the slug into a Title Case label (e.g. "rice-grains" → "Rice Grains")
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
