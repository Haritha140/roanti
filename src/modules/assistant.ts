import { appState, onEvent, showToast } from '../main';

interface Message {
    role: 'user' | 'bot';
    content: string;
    timestamp: number;
}

const conversationHistory: Message[] = [];

// Comprehensive design knowledge base
const DESIGN_KNOWLEDGE: Record<string, string[]> = {
    color: [
        'For bedrooms, cooler tones like Soft Sage (#9CAF88) or Powder Blue (#B0C4DE) help create calm and promote restful sleep.',
        'An accent wall in a darker shade can add depth — try deep teal (#005F5F) or merlot (#73343A) opposite a window for a dramatic effect.',
        'Light colors make small rooms feel larger. Opt for off-whites like Alabaster (#F2F0EB) or Swiss Coffee (#DDD5C8) for compact spaces.',
        'For Indian homes, warm beige tones pair beautifully with wooden furniture and provide a welcoming atmosphere.',
        'The 60-30-10 color rule works perfectly: 60% primary wall color, 30% secondary/accent, and 10% pops of highlight color.',
    ],
    furniture: [
        'For a 12×15ft living room, an L-shaped sofa is optimal — it provides seating for 4-5 while leaving walkway space.',
        'Budget tip: Fabric sofas cost 30-40% less than leather but offer similar comfort. Choose stain-resistant polyester blends.',
        'A coffee table should be about two-thirds the length of your sofa and positioned 18 inches away for comfortable reach.',
        'Quality mattress is worth the investment — allocate 20-25% of your bedroom furniture budget to the mattress.',
    ],
    vastu: [
        'Master bedroom should ideally be in the south-west corner. Place the bed with the head pointing south or east.',
        'The kitchen stove should be in the south-east corner. The cook should face east while cooking.',
        'For Vastu-compliant living rooms, place heavy furniture in the south or west. Keep the north-east open and airy.',
    ],
    budget: [
        'For Indian homes, a renovation budget of ₹800-1200/sqft is considered mid-range and achieves excellent results.',
        'Buy furniture during end-of-season sales (January and July) for discounts of 20-40% on branded items.',
        'Save 15-20% by choosing local wood species like sheesham or rubber wood instead of imported teak for furniture.',
    ],
    lighting: [
        'Warm lighting (2700-3000K) in living rooms and bedrooms creates a cozy, inviting atmosphere perfect for Indian homes.',
        'Use 3-layer lighting: ambient (ceiling), task (focused), and accent (decorative) for a complete lighting design.',
    ],
    style: [
        'Scandinavian style focuses on functionality, light woods, neutral palettes, and decluttered spaces.',
        'Modern luxury combines clean lines with rich materials — think marble countertops, velvet upholstery, and metallic accents.',
    ],
    general: [
        'Start with the largest pieces (bed, sofa) and build around them. This establishes scale and prevents overcrowding.',
        'Leave at least 3 feet of walkway space in any room for comfortable movement.',
        'Indoor plants like Money Plant, Snake Plant, and Areca Palm purify air and add life to any room.',
    ],
};

export function initAssistant() {
    // IMPORTANT: Match HTML id="ai-assistant-toggle"
    const toggleBtn = document.getElementById('ai-assistant-toggle')!;
    const assistantEl = document.getElementById('ai-assistant')!;
    const closeBtn = document.getElementById('ai-close')!;
    const messagesEl = document.getElementById('ai-messages')!;
    const inputEl = document.getElementById('ai-input') as HTMLInputElement;
    const sendBtn = document.getElementById('ai-send')!;

    if (!toggleBtn || !assistantEl) {
        console.warn('Assistant: toggle or panel not found');
        return;
    }

    let isOpen = false;

    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        assistantEl.style.display = isOpen ? 'flex' : 'none';
        toggleBtn.style.display = isOpen ? 'none' : 'flex';
        if (isOpen && conversationHistory.length === 0) addWelcomeMessage();
    });

    closeBtn?.addEventListener('click', () => {
        isOpen = false;
        assistantEl.style.display = 'none';
        toggleBtn.style.display = 'flex';
    });

    sendBtn?.addEventListener('click', sendMessage);
    inputEl?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const msg = btn.getAttribute('data-msg') || btn.textContent || '';
            if (inputEl) inputEl.value = msg;
            sendMessage();
        });
    });

    // Listen for state changes to offer proactive tips
    onEvent('imageUploaded', () => {
        if (isOpen) {
            setTimeout(() => addBotMessage(generateContextualTip('image_uploaded')), 1000);
        }
    });

    function addWelcomeMessage() {
        const room = appState.roomType || 'living';
        const names: Record<string, string> = { living: 'Living Room', bedroom: 'Bedroom', kitchen: 'Kitchen', workspace: 'Workspace' };
        addBotMessage(`Hello! 👋 I'm your AI design assistant for **GruhaBuddy**.

I can help you with:
• **Color selection** — choosing the perfect palette for your ${names[room] || 'room'}
• **Furniture advice** — picking the right pieces for your space
• **Budget planning** — optimizing costs without compromising quality
• **Vastu guidance** — aligning your design with traditional principles
• **Style tips** — achieving your preferred design aesthetic

Ask me anything! For example:
- "What colors work best for my bedroom?"
- "How should I arrange furniture?"
- "Is my budget enough?"
- "Give me Vastu tips"`);
    }

    function sendMessage() {
        if (!inputEl) return;
        const text = inputEl.value.trim();
        if (!text) return;
        inputEl.value = '';

        addUserMessage(text);
        showTypingIndicator();

        const delay = 400 + Math.random() * 400;
        setTimeout(() => {
            removeTypingIndicator();
            const response = generateResponse(text);
            addBotMessage(response);
        }, delay);
    }

    function generateResponse(input: string): string {
        const lower = input.toLowerCase();
        const { budget, roomType, selectedFurniture, colors, roomDimensions, lighting, style, designTheme } = appState;
        const area = roomDimensions.length * roomDimensions.width;
        const furnitureTotal = selectedFurniture.reduce((s, f) => s + f.price, 0);
        const roomNames: Record<string, string> = { living: 'Living Room', bedroom: 'Bedroom', kitchen: 'Kitchen', workspace: 'Workspace' };
        const roomName = roomNames[roomType] || 'room';

        // GREETING
        if (/^(hi|hello|hey|namaste|hii)[\s!.,]*$/i.test(lower)) {
            return `Hey there! 😊 Welcome to GruhaBuddy AI.

I'm here to help you design a beautiful ${roomName}. What would you like help with? Colors, furniture, budget, Vastu tips, or specific design advice for your ${roomDimensions.length}×${roomDimensions.width}ft space.`;
        }

        // COLOR-RELATED
        if (containsAny(lower, ['color', 'colour', 'paint', 'wall', 'shade', 'palette', 'tone'])) {
            return `Here's personalized color advice for your **${roomName}**:

🎨 **Current palette:**
• Primary Wall: **${colors.primaryWall}**
• Accent Wall: **${colors.accentWall}**
• Ceiling: **${colors.ceiling}**
• Furniture Color: **${colors.furniture}**

💡 **Tips:**
• The 60-30-10 rule: 60% dominant wall color, 30% secondary, 10% accent
• ${lighting === 'warm' ? 'Warm lighting amplifies warm tones — great for cozy vibes!' : lighting === 'cool' ? 'Cool lighting works best with blues, grays, and whites.' : 'Neutral lighting is versatile and works with any palette.'}
• ${area < 150 ? 'Light colors make small rooms feel larger.' : 'Your room size allows bold accent walls!'}

**Try:** Click a color rec card (Primary/Accent/Ceiling/Furniture), then pick from the 120+ color palette below to apply it.`;
        }

        // FURNITURE-RELATED
        if (containsAny(lower, ['furniture', 'sofa', 'table', 'chair', 'bed', 'desk', 'wardrobe'])) {
            if (selectedFurniture.length > 0) {
                return `Your **current furniture selection** (${selectedFurniture.length} items):

${selectedFurniture.map(f => `• **${f.name}** — ₹${f.price.toLocaleString()}`).join('\n')}

💰 **Total:** ₹${furnitureTotal.toLocaleString()} of ₹${budget.toLocaleString()} budget (${Math.round(furnitureTotal / budget * 100)}%)
${furnitureTotal > budget * 0.35 ? '\n⚠️ Furniture spending exceeds 35% of budget. Consider budget alternatives.' : '\n✅ Furniture spending is within range.'}`;
            }
            return `For a **${area} sq ft ${roomName}**, I recommend:

🛋️ Essential pieces vary by room type. Browse the **Furniture** section (Step 3) where each item has **42 color options** and **5 material choices** (Wood, Leather, Fabric, Matte, Glossy).

**Sizing tip:** ${area < 120 ? 'Choose compact furniture under 200cm.' : area > 250 ? 'Go for larger statement pieces.' : 'Standard sizes work perfectly for your space.'}`;
        }

        // BUDGET-RELATED
        if (containsAny(lower, ['budget', 'cost', 'price', 'money', 'expensive', 'cheap', 'afford', 'save'])) {
            return `**Budget Analysis** for your ${roomName}:

💰 Budget: ₹${budget.toLocaleString()}
📐 Area: ${area} sq ft (₹${Math.round(budget / area).toLocaleString()}/sq ft)
🛋️ Furniture selected: ₹${furnitureTotal.toLocaleString()}
📊 Remaining: ₹${(budget - furnitureTotal).toLocaleString()}

**Recommended allocation:**
• Paint: ~₹${Math.round(budget * 0.15).toLocaleString()} (15%)
• Furniture: ~₹${Math.round(budget * 0.35).toLocaleString()} (35%)
• Lighting: ~₹${Math.round(budget * 0.1).toLocaleString()} (10%)
• Labour: ~₹${Math.round(budget * 0.15).toLocaleString()} (15%)

${budget < 50000 ? '💡 Tight budget: Focus on paint (biggest visual impact) first.' : budget > 200000 ? '💎 Premium budget! Explore luxury materials.' : '✅ Good mid-range budget for quality furniture.'}`;
        }

        // VASTU-RELATED
        if (containsAny(lower, ['vastu', 'vaasthu', 'direction', 'feng shui'])) {
            const vastuMap: Record<string, string> = {
                living: '🧭 **Living Room Vastu:**\n• Heavy furniture in South/West\n• Electronics in South-East\n• Keep North-East clutter-free\n• Seating should face North or East',
                bedroom: '🧭 **Bedroom Vastu:**\n• Bed in South-West, head pointing South/East\n• Mirror NOT facing the bed\n• Wardrobe in South/West wall',
                kitchen: '🧭 **Kitchen Vastu:**\n• Stove in South-East\n• Cook facing East\n• Sink in North-East',
                workspace: '🧭 **Workspace Vastu:**\n• Desk facing East or North\n• Bookshelf in South/West\n• Sit with solid wall behind you',
            };
            return `${vastuMap[roomType] || vastuMap.living}\n\n*Enable Vastu compliance in the Budget section (Step 4) for optimized layouts.*`;
        }

        // STYLE-RELATED
        if (containsAny(lower, ['style', 'theme', 'modern', 'scandinavian', 'industrial', 'boho', 'japandi', 'minimalist'])) {
            return `Your current theme: **${designTheme || 'scandinavian'}**

You can change the design theme in the **Colors** section (Step 2) — click one of the theme cards (Scandinavian, Modern Luxury, Boho Chic, Industrial, or Japandi). The colors and style will update automatically.

**Style guide:**
• **Scandinavian**: Light woods, neutral palette, minimal
• **Modern Luxury**: Rich materials, bold accents, elegant
• **Boho Chic**: Earth tones, eclectic, layered textures
• **Industrial**: Gray + metal, raw, urban loft
• **Japandi**: Natural + zen, intentional, serene`;
        }

        // HOW TO USE
        if (containsAny(lower, ['how', 'help', 'guide', 'steps', 'tutorial', 'start', 'what can'])) {
            return `**Quick Guide:**

1️⃣ **Upload** — Upload your room photo or try the demo
2️⃣ **Colors** — Pick colors, use presets, or choose a design theme
3️⃣ **Furniture** — Browse & add furniture (42 colors, 5 materials each)
4️⃣ **Budget** — Set budget, room dimensions, preferences
5️⃣ **AI Design** — Click "Generate AI Design" to see transformation
6️⃣ **3D View** — Explore your room in interactive 3D

💡 Complete all steps, then generate the AI design!`;
        }

        // THANK YOU
        if (containsAny(lower, ['thank', 'thanks', 'great', 'awesome', 'perfect'])) {
            return `You're welcome! 😊 Ask me anything else about colors, furniture, budget, or Vastu. I'm here to help!`;
        }

        // FALLBACK
        const topic = detectTopic(lower);
        const knowledge = DESIGN_KNOWLEDGE[topic] || DESIGN_KNOWLEDGE.general;
        const tip = knowledge[Math.floor(Math.random() * knowledge.length)];

        return `💡 ${tip}

For your ${roomName} (${area} sq ft, ₹${budget.toLocaleString()} budget):
${budget / area > 2000 ? 'You can afford premium finishes!' : budget / area > 500 ? 'Great range for quality furniture and lighting.' : 'Focus on paint and soft furnishings for maximum impact.'}

Ask me about **colors**, **furniture**, **budget**, **Vastu**, or **style** for more specific advice!`;
    }

    function containsAny(text: string, keywords: string[]): boolean {
        return keywords.some(k => text.includes(k));
    }

    function detectTopic(text: string): string {
        if (containsAny(text, ['color', 'paint', 'shade'])) return 'color';
        if (containsAny(text, ['furniture', 'sofa', 'table'])) return 'furniture';
        if (containsAny(text, ['vastu', 'direction'])) return 'vastu';
        if (containsAny(text, ['budget', 'cost', 'price'])) return 'budget';
        if (containsAny(text, ['light', 'lamp'])) return 'lighting';
        if (containsAny(text, ['style', 'theme', 'modern'])) return 'style';
        return 'general';
    }

    function generateContextualTip(event: string): string {
        if (event === 'image_uploaded') {
            return `📸 Room image uploaded! Now:
1. Choose your **colors** (Step 2)
2. Select **furniture** (Step 3)
3. Set **budget & preferences** (Step 4)
4. Click **"Generate AI Design"** (Step 5)

I'll be here to help! 🎨`;
        }
        return '';
    }

    function addBotMessage(content: string) {
        conversationHistory.push({ role: 'bot', content, timestamp: Date.now() });
        const div = document.createElement('div');
        div.className = 'ai-message bot';
        div.innerHTML = `<span class="msg-avatar">🤖</span><div class="msg-content">${formatMarkdown(content)}</div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addUserMessage(content: string) {
        conversationHistory.push({ role: 'user', content, timestamp: Date.now() });
        const div = document.createElement('div');
        div.className = 'ai-message user';
        div.innerHTML = `<span class="msg-avatar">👤</span><div class="msg-content">${content}</div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'ai-message bot typing-msg';
        div.innerHTML = `<span class="msg-avatar">🤖</span><div class="msg-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function removeTypingIndicator() {
        const typing = messagesEl.querySelector('.typing-msg');
        if (typing) typing.remove();
    }

    function formatMarkdown(text: string): string {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }
}
