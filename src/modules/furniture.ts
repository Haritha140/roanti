import * as THREE from 'three';
import { appState, emitEvent, onEvent, showToast } from '../main';

interface ColorOption { name: string; hex: string; }
interface MaterialOption { name: string; type: string; priceMultiplier: number; texture: string; }
interface FurnitureItem {
    id: string; name: string; sku: string; category: string; roomTypes: string[];
    price: number; budgetPrice: number; dims: string;
    dimW: number; dimD: number; dimH: number; // cm
    description: string; material: string; rating: number; reviews: number;
    colorOptions: ColorOption[]; selectedColor: string;
    materials: MaterialOption[]; selectedMaterial: string;
}

// 40 color options
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

const FURNITURE_DB: FurnitureItem[] = [
    // LIVING ROOM
    { id: 'l-sofa1', name: 'KÖRNBERG L-Shaped Sofa', sku: 'KB-2450', category: 'sofa', roomTypes: ['living'], price: 45000, budgetPrice: 28000, dims: '250×160×85', dimW: 250, dimD: 160, dimH: 85, description: 'Premium fabric L-shaped sofa with reversible chaise & memory foam cushions', material: 'Fabric', rating: 4.7, reviews: 342, colorOptions: getColorsForCategory('sofa'), selectedColor: '#556B2F', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'l-sofa2', name: 'ELDHUS Chesterfield Sofa', sku: 'EH-1890', category: 'sofa', roomTypes: ['living'], price: 65000, budgetPrice: 38000, dims: '220×90×80', dimW: 220, dimD: 90, dimH: 80, description: 'Classic tufted chesterfield with hand-stitched leather & rolled arms', material: 'Leather', rating: 4.9, reviews: 187, colorOptions: getColorsForCategory('sofa'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'leather' },
    { id: 'l-sofa3', name: 'VÄSTRA 3-Seater', sku: 'VS-1200', category: 'sofa', roomTypes: ['living'], price: 32000, budgetPrice: 18000, dims: '200×85×75', dimW: 200, dimD: 85, dimH: 75, description: 'Clean Scandinavian minimal sofa with oak legs', material: 'Fabric', rating: 4.5, reviews: 521, colorOptions: getColorsForCategory('sofa'), selectedColor: '#A9A9A9', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'l-ctable', name: 'BJÖRK Coffee Table', sku: 'BJ-0880', category: 'table', roomTypes: ['living'], price: 12000, budgetPrice: 6000, dims: '110×60×42', dimW: 110, dimD: 60, dimH: 42, description: 'Solid oak coffee table with powder-coated steel hairpin legs', material: 'Wood', rating: 4.6, reviews: 892, colorOptions: getColorsForCategory('table'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'l-tvunit', name: 'STRÖM TV Console', sku: 'SM-1650', category: 'storage', roomTypes: ['living'], price: 25000, budgetPrice: 12000, dims: '180×45×55', dimW: 180, dimD: 45, dimH: 55, description: 'Modern floating TV unit with integrated cable management system', material: 'Matte', rating: 4.4, reviews: 234, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte' },
    { id: 'l-lamp1', name: 'LYSA Arc Floor Lamp', sku: 'LY-0450', category: 'lighting', roomTypes: ['living', 'bedroom'], price: 8500, budgetPrice: 3500, dims: '40×40×180', dimW: 40, dimD: 40, dimH: 180, description: 'Tall arc floor lamp with dimmable warm LED & marble base', material: 'Metal', rating: 4.8, reviews: 156, colorOptions: getColorsForCategory('lighting'), selectedColor: '#1C1C1C', materials: MATERIAL_OPTIONS, selectedMaterial: 'metal' },
    { id: 'l-curtain', name: 'SILKE Sheer Curtains', sku: 'SK-0320', category: 'curtain', roomTypes: ['living', 'bedroom', 'workspace'], price: 6000, budgetPrice: 2500, dims: 'Full window', dimW: 150, dimD: 1, dimH: 260, description: 'Elegant sheer curtains with thermal lining & blackout layer', material: 'Fabric', rating: 4.3, reviews: 678, colorOptions: getColorsForCategory('curtain'), selectedColor: '#FFFAF0', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'l-rug', name: 'FÄLT Area Rug', sku: 'FT-0750', category: 'decor', roomTypes: ['living', 'bedroom'], price: 15000, budgetPrice: 5000, dims: '200×140', dimW: 200, dimD: 140, dimH: 2, description: 'Hand-tufted wool area rug with anti-slip backing', material: 'Fabric', rating: 4.6, reviews: 445, colorOptions: getColorsForCategory('decor'), selectedColor: '#D4B896', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'l-shelf', name: 'HYLLA Bookshelf', sku: 'HY-0920', category: 'storage', roomTypes: ['living', 'workspace'], price: 18000, budgetPrice: 8000, dims: '90×35×180', dimW: 90, dimD: 35, dimH: 180, description: 'Open 5-tier bookshelf with solid pine & steel frame', material: 'Wood', rating: 4.5, reviews: 312, colorOptions: getColorsForCategory('storage'), selectedColor: '#C4A882', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'l-side', name: 'RUND Side Table', sku: 'RD-0380', category: 'table', roomTypes: ['living', 'bedroom'], price: 7000, budgetPrice: 3000, dims: '45×45×55', dimW: 45, dimD: 45, dimH: 55, description: 'Round side table with tempered glass top & brass legs', material: 'Metal', rating: 4.4, reviews: 267, colorOptions: getColorsForCategory('table'), selectedColor: '#B8860B', materials: MATERIAL_OPTIONS, selectedMaterial: 'glossy' },
    // BEDROOM
    { id: 'b-bed1', name: 'DRÖM King Bed Frame', sku: 'DM-2200', category: 'bed', roomTypes: ['bedroom'], price: 55000, budgetPrice: 30000, dims: '200×180×40', dimW: 200, dimD: 180, dimH: 40, description: 'Upholstered king bed with hydraulic storage & USB charging', material: 'Fabric', rating: 4.8, reviews: 423, colorOptions: getColorsForCategory('bed'), selectedColor: '#6B6B6B', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'b-bed2', name: 'NATT Queen Platform', sku: 'NT-1650', category: 'bed', roomTypes: ['bedroom'], price: 38000, budgetPrice: 20000, dims: '190×150×35', dimW: 190, dimD: 150, dimH: 35, description: 'Low platform bed, Japanese-inspired solid oak design', material: 'Wood', rating: 4.7, reviews: 298, colorOptions: getColorsForCategory('bed'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'b-night', name: 'LUGN Nightstand', sku: 'LG-0480', category: 'table', roomTypes: ['bedroom'], price: 8000, budgetPrice: 3500, dims: '50×40×55', dimW: 50, dimD: 40, dimH: 55, description: 'Bedside nightstand with soft-close drawer & wireless charging top', material: 'Wood', rating: 4.6, reviews: 534, colorOptions: getColorsForCategory('table'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'b-ward', name: 'GARDEROB Wardrobe', sku: 'GB-3200', category: 'storage', roomTypes: ['bedroom'], price: 45000, budgetPrice: 22000, dims: '180×60×210', dimW: 180, dimD: 60, dimH: 210, description: 'Sliding door wardrobe with full-length mirror & LED interior', material: 'Wood', rating: 4.5, reviews: 189, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'b-lamp', name: 'LJUS Bedside Lamp', sku: 'LJ-0180', category: 'lighting', roomTypes: ['bedroom'], price: 3500, budgetPrice: 1200, dims: '25×25×45', dimW: 25, dimD: 25, dimH: 45, description: 'Ceramic table lamp with linen shade & touch dimmer', material: 'Ceramic', rating: 4.7, reviews: 890, colorOptions: getColorsForCategory('lighting'), selectedColor: '#F5E6C8', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte' },
    // KITCHEN
    { id: 'k-dtable', name: 'MATSAL Dining Table', sku: 'MS-1800', category: 'table', roomTypes: ['kitchen'], price: 35000, budgetPrice: 15000, dims: '150×90×75', dimW: 150, dimD: 90, dimH: 75, description: '6-seater extendable dining table with butterfly leaf mechanism', material: 'Wood', rating: 4.6, reviews: 356, colorOptions: getColorsForCategory('table'), selectedColor: '#C4A882', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'k-chairs', name: 'STOL Dining Chairs (×4)', sku: 'ST-0950', category: 'sofa', roomTypes: ['kitchen'], price: 20000, budgetPrice: 10000, dims: '45×50×85', dimW: 45, dimD: 50, dimH: 85, description: 'Upholstered dining chairs with ergonomic backrest, stackable', material: 'Fabric', rating: 4.4, reviews: 445, colorOptions: getColorsForCategory('sofa'), selectedColor: '#808080', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'k-pendant', name: 'GLOB Pendant Set (×3)', sku: 'GL-0560', category: 'lighting', roomTypes: ['kitchen'], price: 12000, budgetPrice: 4500, dims: '25×25×40', dimW: 25, dimD: 25, dimH: 40, description: 'Modern globe pendants with adjustable drop height & warm LED', material: 'Metal', rating: 4.8, reviews: 234, colorOptions: getColorsForCategory('lighting'), selectedColor: '#B8860B', materials: MATERIAL_OPTIONS, selectedMaterial: 'glossy' },
    { id: 'k-shelf', name: 'VÄGG Wall Shelf', sku: 'VG-0350', category: 'storage', roomTypes: ['kitchen'], price: 8000, budgetPrice: 3000, dims: '90×25×4', dimW: 90, dimD: 25, dimH: 4, description: 'Floating kitchen shelf, solid pine with invisible brackets', material: 'Wood', rating: 4.3, reviews: 567, colorOptions: getColorsForCategory('storage'), selectedColor: '#8B6F47', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    // WORKSPACE
    { id: 'w-desk', name: 'ARBETE Executive Desk', sku: 'AB-1500', category: 'table', roomTypes: ['workspace'], price: 28000, budgetPrice: 12000, dims: '150×70×75', dimW: 150, dimD: 70, dimH: 75, description: 'Large L-shaped desk with integrated cable tray & power hub', material: 'Wood', rating: 4.7, reviews: 423, colorOptions: getColorsForCategory('table'), selectedColor: '#5C4033', materials: MATERIAL_OPTIONS, selectedMaterial: 'wood' },
    { id: 'w-chair', name: 'KOMFORT Ergo Chair', sku: 'KF-0880', category: 'sofa', roomTypes: ['workspace'], price: 22000, budgetPrice: 8000, dims: '65×65×120', dimW: 65, dimD: 65, dimH: 120, description: 'Full mesh ergonomic chair with 4D armrests & lumbar support', material: 'Mesh', rating: 4.9, reviews: 678, colorOptions: getColorsForCategory('sofa'), selectedColor: '#1C1C1C', materials: MATERIAL_OPTIONS, selectedMaterial: 'fabric' },
    { id: 'w-lamp', name: 'FOKUS LED Desk Lamp', sku: 'FK-0220', category: 'lighting', roomTypes: ['workspace'], price: 4500, budgetPrice: 1800, dims: '20×20×50', dimW: 20, dimD: 20, dimH: 50, description: 'Adjustable LED desk lamp with 5 brightness levels & USB port', material: 'Metal', rating: 4.6, reviews: 890, colorOptions: getColorsForCategory('lighting'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte' },
    { id: 'w-filing', name: 'ORDNING Filing Cabinet', sku: 'ON-0650', category: 'storage', roomTypes: ['workspace'], price: 12000, budgetPrice: 5000, dims: '40×50×65', dimW: 40, dimD: 50, dimH: 65, description: '3-drawer filing cabinet with lock & smooth-glide casters', material: 'Metal', rating: 4.3, reviews: 234, colorOptions: getColorsForCategory('storage'), selectedColor: '#F5F5F0', materials: MATERIAL_OPTIONS, selectedMaterial: 'matte' },
];

let activeFilter = 'all';
let useBudgetPrices = false;
let expandedColorId: string | null = null;

// 3D preview renderers stored per card
const miniRenderers: Map<string, { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; angle: number; isDragging: boolean; lastX: number; }> = new Map();

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
        const labels: Record<string, string> = { all: '🏠 All', sofa: '🛋️ Seating', table: '🪑 Tables', lighting: '💡 Lighting', curtain: '🪟 Curtains', decor: '🎨 Decor', storage: '📦 Storage', bed: '🛏️ Beds' };
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
        // Dispose old renderers
        miniRenderers.forEach(r => { r.renderer.dispose(); });
        miniRenderers.clear();

        const items = getFilteredItems();
        gridEl.innerHTML = items.map(item => {
            const isAdded = appState.selectedFurniture.some(f => f.id === item.id);
            const price = useBudgetPrices ? item.budgetPrice : item.price;
            const matMultiplier = item.materials.find(m => m.type === item.selectedMaterial)?.priceMultiplier || 1;
            const finalPrice = Math.round(price * matMultiplier);
            const showExpanded = expandedColorId === item.id;
            const visibleColors = showExpanded ? item.colorOptions : item.colorOptions.slice(0, 8);
            const hasMore = item.colorOptions.length > 8 && !showExpanded;

            return `<div class="furniture-card ${isAdded ? 'selected-card' : ''}" data-id="${item.id}">
        <div class="furniture-preview">
          <canvas id="fcanvas-${item.id}" width="400" height="280"></canvas>
          <span class="furniture-sku">${item.sku}</span>
          <span class="furniture-badge">${item.category}</span>
          <span class="rotate-hint">↻ Drag to rotate</span>
        </div>
        <div class="furniture-info">
          <div class="furniture-rating">${renderStars(item.rating)} <span class="review-count">(${item.reviews})</span></div>
          <h4>${item.name}</h4>
          <div class="furniture-meta">
            <span>📐 ${item.dims} cm</span>
            <span>${item.materials.find(m => m.type === item.selectedMaterial)?.texture || ''} ${item.materials.find(m => m.type === item.selectedMaterial)?.name || item.material}</span>
          </div>
          <p class="furniture-desc">${item.description}</p>
          <div class="furniture-material-row">
            <span class="material-label">Material:</span>
            ${item.materials.map(m => `<button class="mat-btn ${item.selectedMaterial === m.type ? 'active' : ''}" data-id="${item.id}" data-mat="${m.type}" title="${m.name}">${m.texture} ${m.name}</button>`).join('')}
          </div>
          <div class="furniture-color-section">
            <span class="color-label">Color (${item.colorOptions.length} options):</span>
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

        // Create 3D previews
        items.forEach(item => init3DPreview(item));

        // Event bindings
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

    function init3DPreview(item: FurnitureItem) {
        const canvas = document.getElementById(`fcanvas-${item.id}`) as HTMLCanvasElement;
        if (!canvas) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(400, 280);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1230);

        const camera = new THREE.PerspectiveCamera(40, 400 / 280, 0.1, 100);
        camera.position.set(2, 1.5, 2);
        camera.lookAt(0, 0.3, 0);

        // Studio 3-point lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        // Key light (warm)
        const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
        keyLight.position.set(3, 5, 3);
        keyLight.castShadow = true;
        scene.add(keyLight);

        // Fill light (cool blue)
        const fillLight = new THREE.DirectionalLight(0x8090ff, 0.4);
        fillLight.position.set(-3, 3, -1);
        scene.add(fillLight);

        // Rim/back light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(0, 2, -4);
        scene.add(rimLight);

        // Hemisphere light for subtle environment
        const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x202040, 0.3);
        scene.add(hemiLight);

        // Floor
        const floorGeo = new THREE.PlaneGeometry(5, 5);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x151a42, roughness: 0.85, metalness: 0.05 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        scene.add(floor);

        // Build furniture model
        const group = buildFurnitureModel(item);
        scene.add(group);

        const state = { renderer, scene, camera, angle: 0, isDragging: false, lastX: 0 };
        miniRenderers.set(item.id, state);

        // Drag to rotate
        canvas.addEventListener('mousedown', (e) => { state.isDragging = true; state.lastX = e.clientX; });
        canvas.addEventListener('touchstart', (e) => { state.isDragging = true; state.lastX = e.touches[0].clientX; }, { passive: true });
        window.addEventListener('mouseup', () => { miniRenderers.forEach(s => s.isDragging = false); });
        window.addEventListener('touchend', () => { miniRenderers.forEach(s => s.isDragging = false); });
        canvas.addEventListener('mousemove', (e) => {
            if (!state.isDragging) return;
            state.angle += (e.clientX - state.lastX) * 0.01;
            state.lastX = e.clientX;
        });
        canvas.addEventListener('touchmove', (e) => {
            if (!state.isDragging) return;
            state.angle += (e.touches[0].clientX - state.lastX) * 0.01;
            state.lastX = e.touches[0].clientX;
        }, { passive: true });

        // Animate
        function animate() {
            if (!miniRenderers.has(item.id)) return;
            requestAnimationFrame(animate);
            if (!state.isDragging) state.angle += 0.005;
            const r = 2.5;
            camera.position.x = Math.sin(state.angle) * r;
            camera.position.z = Math.cos(state.angle) * r;
            camera.position.y = 1.5;
            camera.lookAt(0, 0.3, 0);
            renderer.render(scene, camera);
        }
        animate();
    }

    function buildFurnitureModel(item: FurnitureItem): THREE.Group {
        const g = new THREE.Group();
        const color = new THREE.Color(item.selectedColor);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });

        // PBR material adjustments per material type
        if (item.selectedMaterial === 'leather') {
            mat.roughness = 0.25; mat.metalness = 0.08;
            // Subtle sheen for leather look
            mat.color.offsetHSL(0, 0.05, -0.02);
        } else if (item.selectedMaterial === 'metal') {
            mat.roughness = 0.15; mat.metalness = 0.75;
        } else if (item.selectedMaterial === 'glossy') {
            mat.roughness = 0.08; mat.metalness = 0.35;
        } else if (item.selectedMaterial === 'velvet') {
            mat.roughness = 0.95; mat.metalness = 0;
        } else if (item.selectedMaterial === 'wood') {
            mat.roughness = 0.55; mat.metalness = 0;
        } else if (item.selectedMaterial === 'fabric') {
            mat.roughness = 0.75; mat.metalness = 0;
        }

        switch (item.category) {
            case 'sofa': buildSofa3D(g, mat, item); break;
            case 'table': buildTable3D(g, mat, item); break;
            case 'bed': buildBed3D(g, mat, item); break;
            case 'lighting': buildLamp3D(g, item); break;
            case 'storage': buildStorage3D(g, mat, item); break;
            case 'curtain': buildCurtain3D(g, item); break;
            case 'decor': buildDecor3D(g, item); break;
        }

        // Add subtle shadow beneath
        const shadowGeo = new THREE.PlaneGeometry(2.5, 2.5);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.001;
        g.add(shadow);

        return g;
    }

    // Helper: create rounded box (beveled edges)
    function roundedBox(w: number, h: number, d: number, r: number, segments: number = 2): THREE.BufferGeometry {
        const shape = new THREE.Shape();
        const hw = w / 2 - r, hh = h / 2 - r;
        shape.moveTo(-hw, -h / 2);
        shape.lineTo(hw, -h / 2);
        shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
        shape.lineTo(w / 2, hh);
        shape.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
        shape.lineTo(-hw, h / 2);
        shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
        shape.lineTo(-w / 2, -hh);
        shape.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
        return new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: r * 0.5, bevelSize: r * 0.3, bevelSegments: segments });
    }

    function buildSofa3D(g: THREE.Group, mat: THREE.MeshStandardMaterial, item: FurnitureItem) {
        const w = Math.min(item.dimW / 100, 2.2), d = Math.min(item.dimD / 100, 0.9), h = Math.min(item.dimH / 100, 0.9);
        const isLeather = item.selectedMaterial === 'leather';

        // Base frame (slightly darker)
        const baseMat = mat.clone(); baseMat.color.offsetHSL(0, 0, -0.12);
        const baseGeo = roundedBox(w, h * 0.22, d * 0.95, 0.03);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.rotation.x = Math.PI / 2;
        base.position.set(0, h * 0.11, d * 0.475);
        base.castShadow = true;
        g.add(base);

        // Seat cushions (rounded, puffy look)
        const cushMat = mat.clone();
        if (isLeather) { cushMat.roughness = 0.2; cushMat.metalness = 0.1; }
        cushMat.color.offsetHSL(0, 0, 0.04);
        const nc = item.id.includes('sofa1') ? 3 : item.id.includes('sofa2') ? 2 : 2;
        const cw = (w - 0.24) / nc;
        for (let i = 0; i < nc; i++) {
            const cushGeo = roundedBox(cw - 0.04, 0.12, d * 0.7, 0.025, 3);
            const cush = new THREE.Mesh(cushGeo, cushMat);
            cush.rotation.x = Math.PI / 2;
            cush.position.set(-w / 2 + 0.12 + cw * i + cw / 2, h * 0.28, d * 0.35);
            cush.castShadow = true;
            g.add(cush);

            // Leather tufting buttons
            if (isLeather) {
                for (let tx = -1; tx <= 1; tx++) {
                    for (let tz = -1; tz <= 1; tz++) {
                        const btn = new THREE.Mesh(
                            new THREE.SphereGeometry(0.012, 8, 8),
                            new THREE.MeshStandardMaterial({ color: cushMat.color.clone().offsetHSL(0, 0, -0.15), metalness: 0.3, roughness: 0.4 })
                        );
                        btn.position.set(
                            -w / 2 + 0.12 + cw * i + cw / 2 + tx * (cw * 0.25),
                            h * 0.35,
                            d * 0.35 + tz * (d * 0.18)
                        );
                        g.add(btn);
                    }
                }
            }
        }

        // Backrest (rounded top)
        const backMat = mat.clone(); backMat.color.offsetHSL(0, 0, -0.04);
        if (isLeather) { backMat.roughness = 0.22; backMat.metalness = 0.1; }
        const backGeo = roundedBox(w, h * 0.42, 0.14, 0.03, 3);
        const back = new THREE.Mesh(backGeo, backMat);
        back.rotation.x = Math.PI / 2;
        back.position.set(0, h * 0.5, 0.07);
        back.castShadow = true;
        g.add(back);

        // Back pillows
        for (let i = 0; i < nc; i++) {
            const pillowMat = mat.clone(); pillowMat.color.offsetHSL(0, 0.02, 0.08);
            if (isLeather) { pillowMat.roughness = 0.2; }
            const pillGeo = roundedBox(cw * 0.7, h * 0.28, 0.1, 0.03, 3);
            const pill = new THREE.Mesh(pillGeo, pillowMat);
            pill.rotation.x = Math.PI / 2;
            pill.position.set(-w / 2 + 0.12 + cw * i + cw / 2, h * 0.52, 0.18);
            g.add(pill);
        }

        // Arms (rounded)
        const armMat = mat.clone(); armMat.color.offsetHSL(0, 0, -0.08);
        if (isLeather) { armMat.roughness = 0.2; }
        [-1, 1].forEach(side => {
            const armGeo = roundedBox(0.1, h * 0.35, d * 0.9, 0.025, 3);
            const arm = new THREE.Mesh(armGeo, armMat);
            arm.rotation.x = Math.PI / 2;
            arm.position.set(side * (w / 2 - 0.05), h * 0.35, d * 0.45);
            arm.castShadow = true;
            g.add(arm);
        });

        // Legs (metal / wood)
        const legMat = new THREE.MeshStandardMaterial({
            color: isLeather ? 0x1a1a1a : 0x8B6F47,
            metalness: isLeather ? 0.7 : 0.1,
            roughness: isLeather ? 0.2 : 0.5
        });
        [[-w / 2 + 0.08, 0.08], [w / 2 - 0.08, 0.08], [-w / 2 + 0.08, d - 0.08], [w / 2 - 0.08, d - 0.08]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.1, 8), legMat);
            leg.position.set(lx, 0.05, lz);
            leg.castShadow = true;
            g.add(leg);
        });
    }

    function buildTable3D(g: THREE.Group, mat: THREE.MeshStandardMaterial, item: FurnitureItem) {
        const w = Math.min(item.dimW / 100, 1.5), d = Math.min(item.dimD / 100, 0.9), h = Math.min(item.dimH / 100, 0.8);
        const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mat);
        top.position.y = h; g.add(top);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.3 });
        [[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06], [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h - 0.02), legMat);
            leg.position.set(lx, h / 2, lz); g.add(leg);
        });
    }

    function buildBed3D(g: THREE.Group, mat: THREE.MeshStandardMaterial, _item: FurnitureItem) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 2.0), mat);
        frame.position.y = 0.2; g.add(frame);

        const mMat = new THREE.MeshStandardMaterial({ color: 0xF0EDE8, roughness: 0.9 });
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.9), mMat);
        mattress.position.y = 0.44; g.add(mattress);

        const hbMat = mat.clone(); hbMat.color.offsetHSL(0, 0, -0.1);
        const hb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.08), hbMat);
        hb.position.set(0, 0.7, -0.96); g.add(hb);

        const pMat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.85 });
        [-0.45, 0.45].forEach(px => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.35), pMat);
            p.position.set(px, 0.59, -0.65); g.add(p);
        });
    }

    function buildLamp3D(g: THREE.Group, item: FurnitureItem) {
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
        if (item.id.includes('lamp1') || item.id.includes('arc')) {
            g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.03), poleMat));
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6), poleMat);
            pole.position.y = 0.8; g.add(pole);
            const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xF5E6C8, side: THREE.DoubleSide, emissive: 0xF5D49A, emissiveIntensity: 0.3 }));
            shade.position.y = 1.6; g.add(shade);
        } else {
            g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.03), new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.4, metalness: 0.3 })));
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3), new THREE.MeshStandardMaterial({ color: 0xB87333 }));
            pole.position.y = 0.15; g.add(pole);
            const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xF5E6C8, side: THREE.DoubleSide, emissive: 0xF5D49A, emissiveIntensity: 0.3 }));
            shade.position.y = 0.34; g.add(shade);
        }
    }

    function buildStorage3D(g: THREE.Group, mat: THREE.MeshStandardMaterial, item: FurnitureItem) {
        if (item.id.includes('tvunit') || item.id.includes('tv')) {
            g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.4), mat), { position: new THREE.Vector3(0, 0.2, 0) }));
            const tv = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.04), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            tv.position.set(0, 0.8, 0); g.add(tv);
            const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.65), new THREE.MeshStandardMaterial({ color: 0x1a1a4a, emissive: 0x1a1a4a, emissiveIntensity: 0.15 }));
            screen.position.set(0, 0.8, 0.025); g.add(screen);
        } else if (item.id.includes('shelf') || item.id.includes('book')) {
            [-0.43, 0.43].forEach(sx => {
                const side = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.8, 0.3), mat);
                side.position.set(sx, 0.9, 0); g.add(side);
            });
            for (let i = 0; i < 5; i++) {
                const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.3), mat);
                shelf.position.set(0, 0.02 + i * 0.44, 0); g.add(shelf);
            }
        } else if (item.id.includes('ward')) {
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 0.6), mat);
            body.position.y = 1.05; g.add(body);
            const divMat = mat.clone(); divMat.color.offsetHSL(0, 0, -0.05);
            const div = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.05, 0.62), divMat);
            div.position.y = 1.05; g.add(div);
        } else {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.5), mat);
            body.position.y = 0.33; g.add(body);
        }
    }

    function buildCurtain3D(g: THREE.Group, item: FurnitureItem) {
        const color = new THREE.Color(item.selectedColor);
        const curtMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
        const l = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.5), curtMat);
        l.position.set(-0.5, 0.75, 0); g.add(l);
        const r = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.5), curtMat);
        r.position.set(0.5, 0.75, 0); g.add(r);
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5), new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.7 }));
        rod.rotation.z = Math.PI / 2; rod.position.y = 1.5; g.add(rod);
    }

    function buildDecor3D(g: THREE.Group, item: FurnitureItem) {
        if (item.id.includes('rug')) {
            const rug = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.4), new THREE.MeshStandardMaterial({ color: new THREE.Color(item.selectedColor), roughness: 0.95, side: THREE.DoubleSide }));
            rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; g.add(rug);
        }
    }

    function renderCart() {
        if (appState.selectedFurniture.length === 0) {
            cartItemsEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">No items selected yet</p>';
        } else {
            cartItemsEl.innerHTML = appState.selectedFurniture.map(item =>
                `<div class="cart-item"><span>${item.name}</span><div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--text-secondary);">₹${item.price.toLocaleString()}</span><button class="cart-item-remove" data-id="${item.id}">✕</button></div></div>`
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
            sugText.textContent = `Your furniture total (₹${furnitureTotal.toLocaleString()}) exceeds the recommended furniture budget of ₹${Math.round(furnitureBudget).toLocaleString()}. Here are budget-friendly alternatives:`;
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
