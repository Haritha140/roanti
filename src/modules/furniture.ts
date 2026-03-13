import { appState, emitEvent, onEvent, showToast } from '../main';

interface ColorOption { name: string; hex: string; }
interface MaterialOption { name: string; type: string; priceMultiplier: number; texture: string; }
interface FurnitureItem {
    id: string; name: string; sku: string; category: string; roomTypes: string[];
    price: number; budgetPrice: number; dims: string;
    dimW: number; dimD: number; dimH: number;
    description: string; material: string; rating: number; reviews: number;
    colorOptions: ColorOption[]; selectedColor: string;
    materials: MaterialOption[]; selectedMaterial: string;
    image: string;
}

const UNIVERSAL_COLORS: ColorOption[] = [
    { name: 'Snow White', hex: '#FFFAFA' }, { name: 'Ivory', hex: '#FFFFF0' }, { name: 'Cream', hex: '#F5E6C8' },
    { name: 'Linen', hex: '#FAF0E6' }, { name: 'Alabaster', hex: '#F2F0EB' }, { name: 'Pearl', hex: '#EAE0C8' },
    { name: 'Light Grey', hex: '#D3D3D3' }, { name: 'Dove Grey', hex: '#B0B0B0' }, { name: 'Charcoal', hex: '#36454F' },
    { name: 'Graphite', hex: '#383838' }, { name: 'Slate', hex: '#708090' }, { name: 'Ash', hex: '#B2BEB5' },
    { name: 'Beige', hex: '#C8B89A' }, { name: 'Sand', hex: '#C2B280' }, { name: 'Caramel', hex: '#A0785A' },
    { name: 'Toffee', hex: '#755139' }, { name: 'Chocolate', hex: '#3C1414' }, { name: 'Walnut', hex: '#5C4033' },
    { name: 'Oak', hex: '#C4A882' }, { name: 'Maple', hex: '#D4A76A' }, { name: 'Teak', hex: '#8B6F47' },
    { name: 'Navy', hex: '#1B2A4A' }, { name: 'Steel Blue', hex: '#4682B4' }, { name: 'Dusty Blue', hex: '#6B8CA6' },
    { name: 'Powder Blue', hex: '#B0C4DE' }, { name: 'Olive', hex: '#556B2F' }, { name: 'Sage', hex: '#9CAF88' },
    { name: 'Forest', hex: '#228B22' }, { name: 'Emerald', hex: '#046A38' }, { name: 'Teal', hex: '#008080' },
    { name: 'Burgundy', hex: '#722F37' }, { name: 'Wine', hex: '#691932' }, { name: 'Dusty Rose', hex: '#DCAE96' },
    { name: 'Blush', hex: '#DE98AB' }, { name: 'Gold', hex: '#B8860B' }, { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Black', hex: '#1C1C1C' }, { name: 'Espresso', hex: '#3C2415' }, { name: 'Rust', hex: '#B7410E' },
    { name: 'Terracotta', hex: '#CC6B49' }, { name: 'Mauve', hex: '#915F6D' }, { name: 'Plum', hex: '#6B3A5B' },
];

const MATERIAL_OPTIONS: MaterialOption[] = [
    { name: 'Solid Wood', type: 'wood', priceMultiplier: 1.0, texture: '🪵' },
    { name: 'Leather', type: 'leather', priceMultiplier: 1.4, texture: '🐄' },
    { name: 'Fabric', type: 'fabric', priceMultiplier: 0.85, texture: '🧵' },
    { name: 'Metal', type: 'metal', priceMultiplier: 1.15, texture: '⚙️' },
    { name: 'Velvet', type: 'velvet', priceMultiplier: 1.3, texture: '✨' },
    { name: 'Matte', type: 'matte', priceMultiplier: 1.1, texture: '◻️' },
    { name: 'Glossy', type: 'glossy', priceMultiplier: 1.2, texture: '💎' },
];

function getColorsForCategory(category: string): ColorOption[] {
    const priorityMap: Record<string, string[]> = {
        sofa: ['Olive', 'Navy', 'Charcoal', 'Beige', 'Dusty Rose', 'Teal', 'Burgundy', 'Sage'],
        bed: ['Light Grey', 'Beige', 'Navy', 'Ivory', 'Walnut', 'Charcoal'],
        table: ['Walnut', 'Oak', 'Teak', 'Maple', 'Black', 'Espresso', 'Cream'],
        lighting: ['Gold', 'Black', 'Bronze', 'Ivory', 'Charcoal'],
        curtain: ['Ivory', 'Cream', 'Sage', 'Dusty Blue', 'Linen', 'Pearl', 'Blush'],
        storage: ['Ivory', 'Walnut', 'Oak', 'Black', 'Charcoal', 'Graphite'],
        decor: ['Beige', 'Navy', 'Gold', 'Rust', 'Forest', 'Emerald', 'Plum'],
        chair: ['Charcoal', 'Navy', 'Beige', 'Olive', 'Black', 'Teal'],
    };
    const priority = priorityMap[category] || [];
    const sorted = [...UNIVERSAL_COLORS].sort((a, b) => {
        const aP = priority.indexOf(a.name);
        const bP = priority.indexOf(b.name);
        if (aP >= 0 && bP >= 0) return aP - bP;
        if (aP >= 0) return -1;
        if (bP >= 0) return 1;
        return 0;
    });
    return sorted;
}

const IMG: Record<string, string> = {
    'l-sofa1': './furniture/sofa-lshape.png',
    'l-sofa2': './furniture/sofa-chesterfield.png',
    'l-sofa3': './furniture/sofa-scandinavian.png',
    'l-sofa4': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop&q=80',
    'l-recliner': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=400&fit=crop&q=80',
    'l-ctable': './furniture/coffee-table.png',
    'l-side': 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&h=400&fit=crop&q=80',
    'l-tvunit': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=400&fit=crop&q=80',
    'l-shelf': 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&h=400&fit=crop&q=80',
    'l-wshelf': 'https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=600&h=400&fit=crop&q=80',
    'l-lamp1': './furniture/floor-lamp.png',
    'l-curtain': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop&q=80',
    'l-rug': 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&h=400&fit=crop&q=80',
    'l-plant': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=400&fit=crop&q=80',
    'b-bed1': './furniture/king-bed.png',
    'b-bed2': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop&q=80',
    'b-night': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=400&fit=crop&q=80',
    'b-ward': 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&h=400&fit=crop&q=80',
    'b-lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=400&fit=crop&q=80',
    'b-dresser': 'https://images.unsplash.com/photo-1551298370-9d3d08a14e6e?w=600&h=400&fit=crop&q=80',
    'b-mirror': 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=400&fit=crop&q=80',
    'b-curtain': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop&q=80',
    'b-art': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&h=400&fit=crop&q=80',
    'b-rug': 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&h=400&fit=crop&q=80',
    'k-dtable': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop&q=80',
    'k-chairs': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=400&fit=crop&q=80',
    'k-barstools': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop&q=80',
    'k-cabinet': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&q=80',
    'k-island': 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=400&fit=crop&q=80',
    'k-pendant': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&h=400&fit=crop&q=80',
    'k-shelf': 'https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=600&h=400&fit=crop&q=80',
    'w-desk': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop&q=80',
    'w-chair': 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=400&fit=crop&q=80',
    'w-shelf': 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&h=400&fit=crop&q=80',
    'w-filing': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop&q=80',
    'w-lamp': 'https://images.unsplash.com/photo-1534105615256-13940a56ff44?w=600&h=400&fit=crop&q=80',
    'w-organizer': 'https://images.unsplash.com/photo-1598928506311-c55ez91a17d1?w=600&h=400&fit=crop&q=80',
};

const FURNITURE_DB: FurnitureItem[] = [
    // ===== LIVING ROOM =====
    { id: 'l-sofa1', name: 'KÖRNBERG Sectional Sofa', sku: 'KB-2450', category: 'sofa', roomTypes: ['living'], price: 45000, budgetPrice: 28000, dims: '250×160×85', dimW: 250, dimD: 160, dimH: 85, description: 'Premium fabric L-shaped sectional with reversible chaise & memory foam', material: 'Fabric', rating: 4.7, reviews: 342, colorOptions: getColorsForCategory('sofa'), selectedColor: '#556B2F', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['l-sofa1'] },
    { id: 'l-sofa2', name: 'ELDHUS Luxury Sofa', sku: 'EH-1890', category: 'sofa', roomTypes: ['living'], price: 65000, budgetPrice: 38000, dims: '220×90×80', dimW: 220, dimD: 90, dimH: 80, description: 'Classic tufted chesterfield with hand-stitched leather & rolled arms', material: 'Leather', rating: 4.9, reviews: 187, colorOptions: getColorsForCategory('sofa'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'leather', image: IMG['l-sofa2'] },
    { id: 'l-sofa3', name: 'VÄSTRA 3-Seater', sku: 'VS-1200', category: 'sofa', roomTypes: ['living'], price: 32000, budgetPrice: 18000, dims: '200×85×75', dimW: 200, dimD: 85, dimH: 75, description: 'Clean Scandinavian minimal sofa with oak legs', material: 'Fabric', rating: 4.5, reviews: 521, colorOptions: getColorsForCategory('sofa'), selectedColor: '#A9A9A9', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['l-sofa3'] },
    { id: 'l-sofa4', name: 'VILA Compact Sofa', sku: 'VL-0980', category: 'sofa', roomTypes: ['living'], price: 28000, budgetPrice: 16000, dims: '180×80×72', dimW: 180, dimD: 80, dimH: 72, description: 'Space-saving 2-seater with deep cushions, perfect for apartments', material: 'Fabric', rating: 4.4, reviews: 612, colorOptions: getColorsForCategory('sofa'), selectedColor: '#1B2A4A', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['l-sofa4'] },
    { id: 'l-recliner', name: 'LUGN Recliner Chair', sku: 'LN-0720', category: 'sofa', roomTypes: ['living'], price: 24000, budgetPrice: 14000, dims: '85×90×100', dimW: 85, dimD: 90, dimH: 100, description: 'Power recliner with USB charging & headrest adjustment', material: 'Leather', rating: 4.6, reviews: 289, colorOptions: getColorsForCategory('sofa'), selectedColor: '#36454F', materials: MATERIAL_OPTIONS, selectedMaterial: 'leather', image: IMG['l-recliner'] },
    { id: 'l-ctable', name: 'BJÖRK Coffee Table', sku: 'BJ-0880', category: 'table', roomTypes: ['living'], price: 12000, budgetPrice: 6000, dims: '110×60×42', dimW: 110, dimD: 60, dimH: 42, description: 'Solid oak top with powder-coated steel hairpin legs', material: 'Wood', rating: 4.6, reviews: 892, colorOptions: getColorsForCategory('table'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['l-ctable'] },
    { id: 'l-side', name: 'RUND Side Table', sku: 'RD-0380', category: 'table', roomTypes: ['living', 'bedroom'], price: 7000, budgetPrice: 3000, dims: '45×45×55', dimW: 45, dimD: 45, dimH: 55, description: 'Round side table with tempered glass top & brass legs', material: 'Metal', rating: 4.4, reviews: 267, colorOptions: getColorsForCategory('table'), selectedColor: '#B8860B', materials: MATERIAL_OPTIONS, selectedMaterial: 'glossy', image: IMG['l-side'] },
    { id: 'l-tvunit', name: 'STRÖM TV Console', sku: 'SM-1650', category: 'storage', roomTypes: ['living'], price: 25000, budgetPrice: 12000, dims: '180×45×55', dimW: 180, dimD: 45, dimH: 55, description: 'Modern floating TV unit with cable management system', material: 'Matte', rating: 4.4, reviews: 234, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte', image: IMG['l-tvunit'] },
    { id: 'l-shelf', name: 'HYLLA Bookshelf', sku: 'HY-0920', category: 'storage', roomTypes: ['living', 'workspace'], price: 18000, budgetPrice: 8000, dims: '90×35×180', dimW: 90, dimD: 35, dimH: 180, description: 'Open 5-tier bookshelf with solid pine & steel frame', material: 'Wood', rating: 4.5, reviews: 312, colorOptions: getColorsForCategory('storage'), selectedColor: '#C4A882', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['l-shelf'] },
    { id: 'l-wshelf', name: 'VÄGG Wall Shelves', sku: 'VG-0250', category: 'storage', roomTypes: ['living', 'workspace', 'kitchen'], price: 5500, budgetPrice: 2200, dims: '90×25×4', dimW: 90, dimD: 25, dimH: 4, description: 'Floating wooden shelves with invisible brackets, set of 3', material: 'Wood', rating: 4.3, reviews: 567, colorOptions: getColorsForCategory('storage'), selectedColor: '#8B6F47', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['l-wshelf'] },
    { id: 'l-lamp1', name: 'LYSA Arc Floor Lamp', sku: 'LY-0450', category: 'lighting', roomTypes: ['living', 'bedroom'], price: 8500, budgetPrice: 3500, dims: '40×40×180', dimW: 40, dimD: 40, dimH: 180, description: 'Arc floor lamp with dimmable warm LED & marble base', material: 'Metal', rating: 4.8, reviews: 156, colorOptions: getColorsForCategory('lighting'), selectedColor: '#1C1C1C', materials: MATERIAL_OPTIONS, selectedMaterial: 'metal', image: IMG['l-lamp1'] },
    { id: 'l-curtain', name: 'SILKE Sheer Curtains', sku: 'SK-0320', category: 'curtain', roomTypes: ['living', 'bedroom', 'workspace'], price: 6000, budgetPrice: 2500, dims: 'Full window', dimW: 150, dimD: 1, dimH: 260, description: 'Sheer curtains with thermal lining & blackout layer', material: 'Fabric', rating: 4.3, reviews: 678, colorOptions: getColorsForCategory('curtain'), selectedColor: '#FFFAF0', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['l-curtain'] },
    { id: 'l-rug', name: 'FÄLT Area Rug', sku: 'FT-0750', category: 'decor', roomTypes: ['living', 'bedroom'], price: 15000, budgetPrice: 5000, dims: '200×140', dimW: 200, dimD: 140, dimH: 2, description: 'Hand-tufted wool area rug with anti-slip backing', material: 'Fabric', rating: 4.6, reviews: 445, colorOptions: getColorsForCategory('decor'), selectedColor: '#D4B896', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['l-rug'] },
    { id: 'l-plant', name: 'GRÖN Decorative Plant', sku: 'GN-0150', category: 'decor', roomTypes: ['living', 'bedroom', 'workspace'], price: 3500, budgetPrice: 1200, dims: '30×30×90', dimW: 30, dimD: 30, dimH: 90, description: 'Artificial monstera in ceramic pot, dust-resistant coating', material: 'Ceramic', rating: 4.5, reviews: 890, colorOptions: getColorsForCategory('decor'), selectedColor: '#228B22', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte', image: IMG['l-plant'] },

    // ===== BEDROOM =====
    { id: 'b-bed1', name: 'DRÖM King Bed Frame', sku: 'DM-2200', category: 'bed', roomTypes: ['bedroom'], price: 55000, budgetPrice: 30000, dims: '200×180×40', dimW: 200, dimD: 180, dimH: 40, description: 'Upholstered king bed with hydraulic storage & USB charging', material: 'Fabric', rating: 4.8, reviews: 423, colorOptions: getColorsForCategory('bed'), selectedColor: '#6B6B6B', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['b-bed1'] },
    { id: 'b-bed2', name: 'NATT Queen Platform', sku: 'NT-1650', category: 'bed', roomTypes: ['bedroom'], price: 38000, budgetPrice: 20000, dims: '190×150×35', dimW: 190, dimD: 150, dimH: 35, description: 'Low platform bed, Japanese-inspired solid oak design', material: 'Wood', rating: 4.7, reviews: 298, colorOptions: getColorsForCategory('bed'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['b-bed2'] },
    { id: 'b-night', name: 'LUGN Nightstand', sku: 'LG-0480', category: 'table', roomTypes: ['bedroom'], price: 8000, budgetPrice: 3500, dims: '50×40×55', dimW: 50, dimD: 40, dimH: 55, description: 'Nightstand with soft-close drawer & wireless charging', material: 'Wood', rating: 4.6, reviews: 534, colorOptions: getColorsForCategory('table'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['b-night'] },
    { id: 'b-ward', name: 'GARDEROB Wardrobe', sku: 'GB-3200', category: 'storage', roomTypes: ['bedroom'], price: 45000, budgetPrice: 22000, dims: '180×60×210', dimW: 180, dimD: 60, dimH: 210, description: 'Sliding door wardrobe with full-length mirror & LED', material: 'Wood', rating: 4.5, reviews: 189, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['b-ward'] },
    { id: 'b-lamp', name: 'LJUS Bedside Lamp', sku: 'LJ-0180', category: 'lighting', roomTypes: ['bedroom'], price: 3500, budgetPrice: 1200, dims: '25×25×45', dimW: 25, dimD: 25, dimH: 45, description: 'Ceramic table lamp with linen shade & touch dimmer', material: 'Ceramic', rating: 4.7, reviews: 890, colorOptions: getColorsForCategory('lighting'), selectedColor: '#F5E6C8', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte', image: IMG['b-lamp'] },
    { id: 'b-dresser', name: 'SKÅP Dressing Table', sku: 'SP-1400', category: 'table', roomTypes: ['bedroom'], price: 22000, budgetPrice: 11000, dims: '120×50×75', dimW: 120, dimD: 50, dimH: 75, description: 'Dressing table with 3 drawers, integrated mirror bracket', material: 'Wood', rating: 4.5, reviews: 345, colorOptions: getColorsForCategory('table'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['b-dresser'] },
    { id: 'b-mirror', name: 'SPEGEL Standing Mirror', sku: 'SG-0350', category: 'decor', roomTypes: ['bedroom'], price: 9500, budgetPrice: 4000, dims: '60×4×170', dimW: 60, dimD: 4, dimH: 170, description: 'Full-length standing mirror with walnut frame', material: 'Wood', rating: 4.6, reviews: 456, colorOptions: getColorsForCategory('decor'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['b-mirror'] },
    { id: 'b-curtain', name: 'MÖRK Blackout Curtains', sku: 'MK-0280', category: 'curtain', roomTypes: ['bedroom'], price: 7500, budgetPrice: 3000, dims: 'Full window', dimW: 150, dimD: 1, dimH: 260, description: '100% blackout curtains with thermal insulation', material: 'Fabric', rating: 4.8, reviews: 734, colorOptions: getColorsForCategory('curtain'), selectedColor: '#1B2A4A', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['b-curtain'] },
    { id: 'b-art', name: 'KONST Wall Art Set', sku: 'KT-0220', category: 'decor', roomTypes: ['bedroom', 'living'], price: 5500, budgetPrice: 2000, dims: '60×45', dimW: 60, dimD: 3, dimH: 45, description: 'Abstract canvas art set of 3, gallery-quality print', material: 'Canvas', rating: 4.4, reviews: 567, colorOptions: getColorsForCategory('decor'), selectedColor: '#6366F1', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte', image: IMG['b-art'] },
    { id: 'b-rug', name: 'MJUK Bedroom Rug', sku: 'MJ-0550', category: 'decor', roomTypes: ['bedroom'], price: 12000, budgetPrice: 4500, dims: '160×120', dimW: 160, dimD: 120, dimH: 2, description: 'Ultra-soft shag rug, machine washable', material: 'Fabric', rating: 4.5, reviews: 389, colorOptions: getColorsForCategory('decor'), selectedColor: '#EAE0C8', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['b-rug'] },

    // ===== KITCHEN =====
    { id: 'k-dtable', name: 'MATSAL Dining Table', sku: 'MS-1800', category: 'table', roomTypes: ['kitchen'], price: 35000, budgetPrice: 15000, dims: '150×90×75', dimW: 150, dimD: 90, dimH: 75, description: '6-seater extendable table with butterfly leaf mechanism', material: 'Wood', rating: 4.6, reviews: 356, colorOptions: getColorsForCategory('table'), selectedColor: '#C4A882', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['k-dtable'] },
    { id: 'k-chairs', name: 'STOL Dining Chairs (×4)', sku: 'ST-0950', category: 'chair', roomTypes: ['kitchen'], price: 20000, budgetPrice: 10000, dims: '45×50×85', dimW: 45, dimD: 50, dimH: 85, description: 'Upholstered dining chairs with ergonomic backrest', material: 'Fabric', rating: 4.4, reviews: 445, colorOptions: getColorsForCategory('chair'), selectedColor: '#808080', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['k-chairs'] },
    { id: 'k-barstools', name: 'HÖG Bar Stools (×2)', sku: 'HG-0680', category: 'chair', roomTypes: ['kitchen'], price: 14000, budgetPrice: 6000, dims: '40×40×95', dimW: 40, dimD: 40, dimH: 95, description: 'Adjustable-height bar stools with footrest', material: 'Metal', rating: 4.3, reviews: 312, colorOptions: getColorsForCategory('chair'), selectedColor: '#1C1C1C', materials: MATERIAL_OPTIONS, selectedMaterial: 'metal', image: IMG['k-barstools'] },
    { id: 'k-cabinet', name: 'FÖRVAR Kitchen Cabinet', sku: 'FV-2800', category: 'storage', roomTypes: ['kitchen'], price: 42000, budgetPrice: 22000, dims: '200×60×90', dimW: 200, dimD: 60, dimH: 90, description: 'Modular kitchen cabinets with soft-close hinges', material: 'Wood', rating: 4.5, reviews: 189, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['k-cabinet'] },
    { id: 'k-island', name: 'MITT Kitchen Island', sku: 'MT-2200', category: 'table', roomTypes: ['kitchen'], price: 38000, budgetPrice: 18000, dims: '140×70×90', dimW: 140, dimD: 70, dimH: 90, description: 'Kitchen island with granite top & storage drawers', material: 'Wood', rating: 4.7, reviews: 178, colorOptions: getColorsForCategory('table'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['k-island'] },
    { id: 'k-pendant', name: 'GLOB Pendant Set (×3)', sku: 'GL-0560', category: 'lighting', roomTypes: ['kitchen'], price: 12000, budgetPrice: 4500, dims: '25×25×40', dimW: 25, dimD: 25, dimH: 40, description: 'Globe pendants with adjustable drop height & warm LED', material: 'Metal', rating: 4.8, reviews: 234, colorOptions: getColorsForCategory('lighting'), selectedColor: '#B8860B', materials: MATERIAL_OPTIONS, selectedMaterial: 'glossy', image: IMG['k-pendant'] },
    { id: 'k-shelf', name: 'VÄGG Storage Shelf', sku: 'VG-0350', category: 'storage', roomTypes: ['kitchen'], price: 8000, budgetPrice: 3000, dims: '90×25×4', dimW: 90, dimD: 25, dimH: 4, description: 'Floating kitchen shelf with invisible brackets', material: 'Wood', rating: 4.3, reviews: 567, colorOptions: getColorsForCategory('storage'), selectedColor: '#8B6F47', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['k-shelf'] },

    // ===== WORKSPACE =====
    { id: 'w-desk', name: 'ARBETE Executive Desk', sku: 'AB-1500', category: 'table', roomTypes: ['workspace'], price: 28000, budgetPrice: 12000, dims: '150×70×75', dimW: 150, dimD: 70, dimH: 75, description: 'L-shaped desk with cable tray & power hub', material: 'Wood', rating: 4.7, reviews: 423, colorOptions: getColorsForCategory('table'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['w-desk'] },
    { id: 'w-chair', name: 'KOMFORT Ergo Chair', sku: 'KF-0880', category: 'chair', roomTypes: ['workspace'], price: 22000, budgetPrice: 8000, dims: '65×65×120', dimW: 65, dimD: 65, dimH: 120, description: 'Full mesh ergonomic chair with 4D armrests & lumbar support', material: 'Mesh', rating: 4.9, reviews: 678, colorOptions: getColorsForCategory('chair'), selectedColor: '#1C1C1C', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric', image: IMG['w-chair'] },
    { id: 'w-shelf', name: 'PLAN Bookshelf', sku: 'PL-0900', category: 'storage', roomTypes: ['workspace'], price: 16000, budgetPrice: 7000, dims: '80×30×180', dimW: 80, dimD: 30, dimH: 180, description: 'Industrial-style bookshelf, metal frame & wood shelves', material: 'Wood', rating: 4.5, reviews: 345, colorOptions: getColorsForCategory('storage'), selectedColor: '#C4A882', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['w-shelf'] },
    { id: 'w-filing', name: 'ORDNING Filing Cabinet', sku: 'ON-0650', category: 'storage', roomTypes: ['workspace'], price: 12000, budgetPrice: 5000, dims: '40×50×65', dimW: 40, dimD: 50, dimH: 65, description: '3-drawer filing cabinet with lock & casters', material: 'Metal', rating: 4.3, reviews: 234, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte', image: IMG['w-filing'] },
    { id: 'w-lamp', name: 'FOKUS LED Desk Lamp', sku: 'FK-0220', category: 'lighting', roomTypes: ['workspace'], price: 4500, budgetPrice: 1800, dims: '20×20×50', dimW: 20, dimD: 20, dimH: 50, description: 'Adjustable LED lamp with 5 brightness levels & USB', material: 'Metal', rating: 4.6, reviews: 890, colorOptions: getColorsForCategory('lighting'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte', image: IMG['w-lamp'] },
    { id: 'w-organizer', name: 'STRUKTUR Wall Organizer', sku: 'SK-0180', category: 'storage', roomTypes: ['workspace'], price: 6500, budgetPrice: 2800, dims: '80×10×60', dimW: 80, dimD: 10, dimH: 60, description: 'Pegboard wall organizer with shelf & hook accessories', material: 'Wood', rating: 4.4, reviews: 412, colorOptions: getColorsForCategory('storage'), selectedColor: '#C4A882', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood', image: IMG['w-organizer'] },
];

let activeFilter = 'all';
let useBudgetPrices = false;
let expandedColorId: string | null = null;

export function initFurniture() {
    const gridEl = document.getElementById('furniture-grid')!;
    const filtersEl = document.getElementById('furniture-filters')!;
    const cartItemsEl = document.getElementById('cart-items')!;
    const cartTotalEl = document.getElementById('cart-total-amount')!;
    const roomLabel = document.getElementById('furniture-room-label')!;

    onEvent('roomTypeChanged', () => { renderFilters(); renderGrid(); updateRoomLabel(); });
    onEvent('budgetComplete', checkBudget);

    function updateRoomLabel() {
        const names: Record<string, string> = { living: 'Living Room', bedroom: 'Bedroom', kitchen: 'Kitchen', workspace: 'Workspace' };
        roomLabel.innerHTML = `Showing furniture for: <strong>${names[appState.roomType] || 'Living Room'}</strong>`;
    }

    function getFilteredItems() {
        let items = FURNITURE_DB.filter(f => f.roomTypes.includes(appState.roomType));
        if (activeFilter !== 'all') items = items.filter(f => f.category === activeFilter);
        return items;
    }

    function getCategories() {
        const items = FURNITURE_DB.filter(f => f.roomTypes.includes(appState.roomType));
        return ['all', ...Array.from(new Set(items.map(i => i.category)))];
    }

    function renderFilters() {
        const cats = getCategories();
        const labels: Record<string, string> = { all: '🏠 All', sofa: '🛋️ Seating', chair: '🪑 Chairs', table: '🪑 Tables', lighting: '💡 Lighting', curtain: '🪟 Curtains', decor: '🎨 Decor', storage: '📦 Storage', bed: '🛏️ Beds' };
        if (!cats.includes(activeFilter)) activeFilter = 'all';
        filtersEl.innerHTML = cats.map(c =>
            `<button class="furn-filter-btn ${c === activeFilter ? 'active' : ''}" data-cat="${c}">${labels[c] || c}</button>`
        ).join('');
        filtersEl.querySelectorAll('.furn-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => { activeFilter = btn.getAttribute('data-cat')!; renderFilters(); renderGrid(); });
        });
    }

    function renderStars(rating: number): string {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let s = '';
        for (let i = 0; i < full; i++) s += '★';
        if (half) s += '½';
        for (let i = full + (half ? 1 : 0); i < 5; i++) s += '☆';
        return s;
    }

    function renderGrid() {
        const items = getFilteredItems();
        gridEl.innerHTML = items.map(item => {
            const isAdded = appState.selectedFurniture.some(f => f.id === item.id);
            const price = useBudgetPrices ? item.budgetPrice : item.price;
            const matMultiplier = item.materials.find(m => m.type === item.selectedMaterial)?.priceMultiplier || 1;
            const finalPrice = Math.round(price * matMultiplier);
            const showExpanded = expandedColorId === item.id;
            const visibleColors = showExpanded ? item.colorOptions : item.colorOptions.slice(0, 8);
            const hasMore = item.colorOptions.length > 8 && !showExpanded;
            const currentMatName = item.materials.find(m => m.type === item.selectedMaterial)?.name || item.material;
            const currentMatTexture = item.materials.find(m => m.type === item.selectedMaterial)?.texture || '';
            const catIcon = { sofa: '🛋️', bed: '🛏️', table: '🪑', lighting: '💡', curtain: '🪟', storage: '📦', decor: '🎨', chair: '🪑' }[item.category] || '📦';

            return `<div class="furniture-card ${isAdded ? 'selected-card' : ''}" data-id="${item.id}">
        <div class="furniture-preview">
          <img src="${item.image}" alt="${item.name}" class="furniture-product-img" loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="furniture-img-fallback" style="display:none;">
            <span class="fallback-icon">${catIcon}</span>
            <span class="fallback-name">${item.name}</span>
          </div>
          <div class="furniture-color-tint" style="background:${item.selectedColor}; opacity:0.18; pointer-events:none; position:absolute; inset:0; mix-blend-mode:multiply; border-radius:inherit;"></div>
          <span class="furniture-sku">${item.sku}</span>
          <span class="furniture-badge">${item.category}</span>
        </div>
        <div class="furniture-info">
          <div class="furniture-rating">${renderStars(item.rating)} <span class="review-count">(${item.reviews})</span></div>
          <h4>${item.name}</h4>
          <div class="furniture-meta">
            <span>📐 ${item.dims} cm</span>
            <span>${currentMatTexture} ${currentMatName}</span>
          </div>
          <p class="furniture-desc">${item.description}</p>
          <div class="furniture-material-row">
            <span class="material-label">Material:</span>
            ${item.materials.map(m => `<button class="mat-btn ${item.selectedMaterial === m.type ? 'active' : ''}" data-id="${item.id}" data-mat="${m.type}" title="${m.name}">${m.texture}</button>`).join('')}
          </div>
          <div class="furniture-color-section">
            <span class="color-label">Color:</span>
            <div class="furniture-color-options">
              ${visibleColors.map(c => `<button class="furn-color-btn ${item.selectedColor === c.hex ? 'active' : ''}" data-id="${item.id}" data-hex="${c.hex}" title="${c.name}" style="background:${c.hex};"></button>`).join('')}
              ${hasMore ? `<button class="furn-color-more" data-id="${item.id}">+${item.colorOptions.length - 8}</button>` : ''}
              ${showExpanded ? `<button class="furn-color-less" data-id="${item.id}">Show less</button>` : ''}
              <input type="color" class="furn-custom-color" data-id="${item.id}" value="${item.selectedColor}" title="Custom color">
            </div>
          </div>
          <div class="furniture-price-row">
            <div class="furniture-price-info">
              <span class="furniture-price">₹${finalPrice.toLocaleString()}</span>
              <span class="furniture-price-note">${useBudgetPrices ? '💡 Budget price' : 'incl. taxes'}</span>
            </div>
            <button class="add-to-room-btn ${isAdded ? 'added' : ''}" data-id="${item.id}">${isAdded ? '✓ In Room' : '+ Add to Room'}</button>
          </div>
        </div>
      </div>`;
        }).join('');
        bindCardEvents();
    }

    function bindCardEvents() {
        gridEl.querySelectorAll('.furn-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')!, hex = btn.getAttribute('data-hex')!;
                const dbItem = FURNITURE_DB.find(f => f.id === id)!;
                dbItem.selectedColor = hex;
                const sel = appState.selectedFurniture.find(f => f.id === id);
                if (sel) { sel.color = hex; emitEvent('furnitureChanged', appState.selectedFurniture); }
                renderGrid();
            });
        });

        gridEl.querySelectorAll('.furn-custom-color').forEach(input => {
            (input as HTMLInputElement).addEventListener('input', () => {
                const id = (input as HTMLInputElement).getAttribute('data-id')!;
                const hex = (input as HTMLInputElement).value;
                const dbItem = FURNITURE_DB.find(f => f.id === id)!;
                dbItem.selectedColor = hex;
                const sel = appState.selectedFurniture.find(f => f.id === id);
                if (sel) { sel.color = hex; emitEvent('furnitureChanged', appState.selectedFurniture); }
                renderGrid();
            });
        });

        gridEl.querySelectorAll('.furn-color-more').forEach(btn => {
            btn.addEventListener('click', () => { expandedColorId = btn.getAttribute('data-id')!; renderGrid(); });
        });
        gridEl.querySelectorAll('.furn-color-less').forEach(btn => {
            btn.addEventListener('click', () => { expandedColorId = null; renderGrid(); });
        });

        gridEl.querySelectorAll('.mat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')!, mat = btn.getAttribute('data-mat')!;
                const dbItem = FURNITURE_DB.find(f => f.id === id)!;
                dbItem.selectedMaterial = mat;
                const sel = appState.selectedFurniture.find(f => f.id === id);
                if (sel) {
                    (sel as any).material = mat;
                    const basePrice = useBudgetPrices ? dbItem.budgetPrice : dbItem.price;
                    const multiplier = dbItem.materials.find(m => m.type === mat)?.priceMultiplier || 1;
                    sel.price = Math.round(basePrice * multiplier);
                    emitEvent('furnitureChanged', appState.selectedFurniture);
                }
                renderGrid(); renderCart();
            });
        });

        gridEl.querySelectorAll('.add-to-room-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')!;
                const item = FURNITURE_DB.find(f => f.id === id)!;
                const idx = appState.selectedFurniture.findIndex(f => f.id === id);
                const basePrice = useBudgetPrices ? item.budgetPrice : item.price;
                const matMultiplier = item.materials.find(m => m.type === item.selectedMaterial)?.priceMultiplier || 1;
                const finalPrice = Math.round(basePrice * matMultiplier);
                if (idx >= 0) {
                    appState.selectedFurniture.splice(idx, 1);
                    showToast(`Removed ${item.name}`, 'info');
                } else {
                    appState.selectedFurniture.push({ id: item.id, name: item.name, price: finalPrice, category: item.category, color: item.selectedColor, dims: item.dims });
                    showToast(`Added ${item.name} to room!`, 'success');
                }
                emitEvent('furnitureChanged', appState.selectedFurniture);
                renderGrid(); renderCart();
            });
        });
    }

    function renderCart() {
        if (appState.selectedFurniture.length === 0) {
            cartItemsEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">No items selected yet</p>';
        } else {
            cartItemsEl.innerHTML = appState.selectedFurniture.map(item =>
                `<div class="cart-item"><span>${item.name}</span><div style="display:flex;align-items:center;gap:8px;"><div style="width:14px;height:14px;border-radius:50%;background:${item.color};border:1px solid rgba(255,255,255,0.2);"></div><span style="color:var(--text-secondary);">₹${item.price.toLocaleString()}</span><button class="cart-item-remove" data-id="${item.id}">✕</button></div></div>`
            ).join('');
            cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id')!;
                    const idx = appState.selectedFurniture.findIndex(f => f.id === id);
                    if (idx >= 0) appState.selectedFurniture.splice(idx, 1);
                    emitEvent('furnitureChanged', appState.selectedFurniture);
                    renderGrid(); renderCart();
                });
            });
        }
        const total = appState.selectedFurniture.reduce((s, f) => s + f.price, 0);
        cartTotalEl.textContent = `₹${total.toLocaleString()}`;
    }

    function checkBudget() {
        const furnitureTotal = appState.selectedFurniture.reduce((s, f) => s + f.price, 0);
        const furnitureBudget = appState.budget * 0.35;
        if (furnitureTotal > furnitureBudget) {
            useBudgetPrices = true;
            showToast('Budget is tight! Showing budget-friendly alternatives.', 'info');
            const sugEl = document.getElementById('budget-suggestions')!;
            const sugText = document.getElementById('budget-suggestion-text')!;
            const altItems = document.getElementById('budget-alt-items')!;
            sugEl.style.display = 'block';
            sugText.textContent = `Your furniture total (₹${furnitureTotal.toLocaleString()}) exceeds the recommended furniture budget of ₹${Math.round(furnitureBudget).toLocaleString()}.`;
            altItems.innerHTML = appState.selectedFurniture.map(f => {
                const db = FURNITURE_DB.find(d => d.id === f.id);
                if (!db) return '';
                const saving = db.price - db.budgetPrice;
                return `<div class="budget-alt-item"><span>${f.name}</span><span>₹${db.price.toLocaleString()} → <strong style="color:var(--success);">₹${db.budgetPrice.toLocaleString()}</strong> (Save ₹${saving.toLocaleString()})</span></div>`;
            }).join('');
            renderGrid();
        }
    }

    renderFilters(); renderGrid(); renderCart(); updateRoomLabel();
}

export function getFurnitureDB() { return FURNITURE_DB; }
