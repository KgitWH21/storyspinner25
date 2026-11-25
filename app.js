
// State Management
const state = {
    data: {
        characters: null,
        stories: null,
        music: null,
        art: null
    },
    currentTab: 'characters',
    generated: {
        characters: {},
        stories: {},
        music: {},
        tarot: {},
        art: {},
        prompt: {},
        codex: {}
    },
    locked: {
        characters: new Set(),
        stories: new Set(),
        music: new Set(),
        art: new Set(),
        prompt: new Set(),
        codex: new Set()
    },
    promptForm: 'Flash fiction',
    promptTone: '',
    codexIdea: '',
    codexTwists: []
};

// DOM Elements
const elements = {
    navButtons: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.content-section'),

    // Character Elements
    generateCharBtn: document.getElementById('generate-char'),
    copyCharBtn: document.getElementById('copy-char'),
    charResult: document.getElementById('char-result'),

    // Tarot Elements (Integrated in Character Tab)
    tarotLayout: document.getElementById('tarot-layout'),
    generateTarotBtn: document.getElementById('generate-tarot'),
    copyTarotBtn: document.getElementById('copy-tarot'),
    tarotResult: document.getElementById('tarot-result'),

    // Story Elements
    generateStoryBtn: document.getElementById('generate-story'),
    copyStoryBtn: document.getElementById('copy-story'),
    storyResult: document.getElementById('story-result'),

    // Music Elements
    generateMusicBtn: document.getElementById('generate-music'),
    copyMusicBtn: document.getElementById('copy-music'),
    musicResult: document.getElementById('music-result'),

    // Art Elements
    generateArtBtn: document.getElementById('generate-art'),
    copyArtBtn: document.getElementById('copy-art'),
    artResult: document.getElementById('art-result'),

    // Prompt Elements
    promptForm: document.getElementById('prompt-form'),
    promptTone: document.getElementById('prompt-tone'),
    generatePromptBtn: document.getElementById('generate-prompt'),
    copyPromptBtn: document.getElementById('copy-prompt'),
    savePromptBtn: document.getElementById('save-prompt'),
    promptResult: document.getElementById('prompt-result'),

    // Codex Elements
    codexIdea: document.getElementById('codex-idea'),
    generateCodexBtn: document.getElementById('generate-codex'),
    copyCodexBtn: document.getElementById('copy-codex'),
    saveCodexBtn: document.getElementById('save-codex'),
    codexResult: document.getElementById('codex-result'),

    // Favorites and shared
    saveCharBtn: document.getElementById('save-char'),
    exportFavoritesBtn: document.getElementById('export-favorites'),
    favoritesResult: document.getElementById('favorites-result'),
    toast: document.getElementById('toast')
};

// Utility Functions
const utils = {
    random: (array) => array[Math.floor(Math.random() * array.length)],

    toggleLock: (category, field) => {
        if (state.locked[category].has(field)) {
            state.locked[category].delete(field);
        } else {
            state.locked[category].add(field);
        }
        render[category](); // Re-render to update lock icon
        saveState();
    },

    copyToClipboard: (text) => {
        if (!text) {
            showToast('Nothing to copy yet.');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showToast('Could not copy-- try selecting the text instead.');
        });
    },

    formatOutput: (obj) => {
        if (!obj) return '';

        // Handle Tarot Object specifically
        if (obj.layoutName && obj.cards) {
            const lines = [`=== ${obj.layoutName} ===`];
            obj.cards.forEach(card => {
                lines.push(`[${card.slot}]: ${card.name} ${card.isReversed ? '(Reversed)' : ''}`);
                lines.push(`Keyword: ${card.keyword}`);
                lines.push(`Meaning: ${card.meaning}`);
                lines.push(''); // Empty line
            });
            return lines.join('\n');
        }

        // Handle Standard Objects
        return Object.entries(obj)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    }
};



const FAVORITES_KEY = 'storySpinnerFavorites';
const CRAFT_NOTES = [
    'Prefer specific, concrete, real-world details over generic ones.',
    'Vary your sentence structure.',
    'Show character through action, not explanation.',
    'Avoid clichés and repetitive phrasing.'
];
const TWIST_TYPES = [
    { key: 'pov_shift', label: 'POV shift' },
    { key: 'era_setting_shift', label: 'Era or setting' },
    { key: 'stakes_escalation', label: 'Stakes' },
    { key: 'genre_flip', label: 'Genre flip' },
    { key: 'structure_form', label: 'Structure' },
    { key: 'what_if', label: 'What if' }
];

let toastTimer;

function showToast(message) {
    const el = elements.toast || document.getElementById('toast');
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add('visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.classList.remove('visible');
        setTimeout(() => { el.hidden = true; }, 200);
    }, 1600);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function withArticle(phrase) {
    const first = (phrase || '').trim();
    const article = /^[aeiou]/i.test(first) ? 'an' : 'a';
    return `${article} ${first}`;
}

function lowerStart(str) {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function formatStamp(iso) {
    const date = iso ? new Date(iso) : new Date();
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function getSelectedForm() {
    const select = elements.promptForm;
    if (!select) return { name: 'Flash fiction', length: '500-1,000 words' };
    const option = select.options[select.selectedIndex];
    return {
        name: select.value,
        length: (option && option.dataset.length) || ''
    };
}

function motivationClause(motivation) {
    const text = (motivation || '').trim();
    if (!text) return 'They want something they cannot name yet.';
    if (/\s/.test(text) && !/^to\s/i.test(text)) {
        return `They want to ${lowerStart(text)}.`;
    }
    return `They want ${lowerStart(text)}.`;
}

function buildCharacterLine(parts) {
    const who = withArticle(`${parts.descriptor} ${lowerStart(parts.occupation)}`);
    return `${who}. They are ${lowerStart(parts.trait)}, but ${lowerStart(parts.flaw)}. ${motivationClause(parts.motivation)}`;
}

function formLeadIn(form) {
    const name = form.name;
    const length = form.length;
    if (name === 'Microfiction') return `Write a microfiction piece (${length})`;
    if (name === 'Flash fiction') return `Write a flash fiction story (${length})`;
    if (name === 'Short story') return `Write a short story (${length})`;
    if (name === 'Poem') return `Write a poem (${length})`;
    if (name === 'Scene') return `Write a single scene (${length})`;
    if (name === 'Opening chapter') return `Write an opening chapter (${length})`;
    return `Write a ${lowerStart(name)} (${length})`;
}

function buildPromptText(fields) {
    const form = getSelectedForm();
    const tone = elements.promptTone ? elements.promptTone.value : '';
    const toneClause = tone ? ` in a ${tone} tone` : '';
    const lines = [
        `${formLeadIn(form)}${toneClause}.`,
        '',
        `Point of view: ${fields['POV']}`,
        `Genre: ${fields['Genre']}`,
        `Archetype: ${fields['Archetype']}`,
        '',
        `Character: ${fields['Character']}`,
        `Conflict: ${fields['Conflict']}`,
        `Theme: ${fields['Theme']}`,
        `Setting: ${fields['Setting']}`,
        `Sensory hook: ${fields['Sensory hook']}`,
        '',
        'Craft notes:',
        ...CRAFT_NOTES.map(note => `- ${note}`)
    ];
    return lines.join('\n');
}

function buildRevivalText(idea, twists) {
    const lines = [
        `Revive this idea: ${idea.trim()}`,
        '',
        'Apply these twists:'
    ];
    twists.forEach((twist, i) => {
        lines.push(`${i + 1}. ${twist.label}: ${twist.value}`);
    });
    lines.push('');
    lines.push('Keep the heart of the original idea, and let these twists change the approach.');
    lines.push('Craft notes:');
    CRAFT_NOTES.forEach(note => lines.push(`- ${note}`));
    return lines.join('\n');
}

function loadFavorites() {
    try {
        const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to read favorites', e);
        return [];
    }
}

function persistFavorites(items) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

function saveFavorite(type, text) {
    if (!text || !String(text).trim()) {
        showToast('Nothing to save yet.');
        return;
    }
    const items = loadFavorites();
    const trimmed = String(text).trim();
    if (items[0] && items[0].text === trimmed && items[0].type === type) {
        showToast('Already saved.');
        return;
    }
    items.unshift({
        id: `fav-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        text: trimmed,
        savedAt: new Date().toISOString()
    });
    persistFavorites(items);
    render.favorites();
    showToast('Saved to Favorites.');
}

function deleteFavorite(id) {
    const items = loadFavorites().filter(item => item.id !== id);
    persistFavorites(items);
    render.favorites();
    showToast('Removed.');
}

function exportFavorites() {
    const items = loadFavorites();
    if (!items.length) {
        showToast('No favorites to export yet.');
        return;
    }
    const parts = ['STORYSPINNER FAVORITES', `Exported ${formatStamp(new Date().toISOString())}`, ''];
    items.forEach(item => {
        parts.push(`--- ${item.type} | ${formatStamp(item.savedAt)} ---`);
        parts.push(item.text);
        parts.push('');
    });
    const blob = new Blob([parts.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'storyspinner-favorites.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Favorites exported.');
}

function populateToneSelect() {
    const select = elements.promptTone;
    const extras = state.data.stories && state.data.stories.prompt_extras;
    if (!select || !extras) return;
    const current = state.promptTone || select.value || '';
    select.innerHTML = '<option value="">Optional -- leave open</option>';
    extras.tones.forEach(tone => {
        const option = document.createElement('option');
        option.value = tone;
        option.textContent = tone;
        select.appendChild(option);
    });
    if ([...select.options].some(opt => opt.value === current)) {
        select.value = current;
    }
}

// Data Fetching
async function loadData() {
    try {
        const [charRes, storyRes, musicRes, artRes] = await Promise.all([
            fetch('character_elements.json'),
            fetch('story_elements.json'),
            fetch('music_elements.json'),
            fetch('art_elements.json')
        ]);

        state.data.characters = await charRes.json();
        state.data.stories = await storyRes.json();
        state.data.music = await musicRes.json();
        state.data.art = await artRes.json();

        populateToneSelect();

        // Populate Tarot Layouts
        if (state.data.characters.tarot_layouts) {
            const select = elements.tarotLayout;
            select.innerHTML = '';
            state.data.characters.tarot_layouts.forEach((layout, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = layout.name;
                select.appendChild(option);
            });
        }

        console.log('Data loaded:', state.data);
        restoreState();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load JSON data. Please ensure the files are in the correct directory.');
    }
}

// Generators
const generators = {
    characters: () => {
        const data = state.data.characters;
        const current = state.generated.characters;
        const locked = state.locked.characters;
        const newChar = { ...current };

        // Basic
        if (!locked.has('Race')) newChar['Race'] = utils.random(data.basic.race);
        if (!locked.has('Gender')) newChar['Gender'] = utils.random(data.basic.gender);
        if (!locked.has('Age')) {
            const ageRange = utils.random(data.basic.age_ranges);
            const specificAge = Math.floor(Math.random() * (ageRange.max - ageRange.min + 1)) + ageRange.min;
            newChar['Age'] = `${ageRange.name} (${specificAge})`;
        }
        if (!locked.has('Attracted To')) newChar['Attracted To'] = utils.random(data.basic['attracted to']);

        // Appearance
        if (!locked.has('Height')) newChar['Height'] = utils.random(data.appearance.height);
        if (!locked.has('Build')) newChar['Build'] = utils.random(data.appearance.build);
        if (!locked.has('Hair Color')) newChar['Hair Color'] = utils.random(data.appearance.hair_color);
        if (!locked.has('Hair Style')) newChar['Hair Style'] = utils.random(data.appearance.hair_style);
        if (!locked.has('Eye Color')) newChar['Eye Color'] = utils.random(data.appearance.eye_color);
        if (!locked.has('Skin Tone')) newChar['Skin Tone'] = utils.random(data.appearance.skin_tone);
        if (!locked.has('Dist. Feature')) newChar['Dist. Feature'] = utils.random(data.appearance.distinctive_features);

        // Personality
        if (!locked.has('PERSONALITY TRAIT 1')) newChar['PERSONALITY TRAIT 1'] = utils.random(data.personality.traits);
        if (!locked.has('PERSONALITY TRAIT 2')) newChar['PERSONALITY TRAIT 2'] = utils.random(data.personality.traits);
        if (!locked.has('Flaw')) newChar['Flaw'] = utils.random(data.personality.flaws);
        if (!locked.has('Value')) newChar['Value'] = utils.random(data.personality.values);
        if (!locked.has('Motivation')) newChar['Motivation'] = utils.random(data.personality.motivations);

        // Background
        if (!locked.has('Occupation')) newChar['Occupation'] = utils.random(data.background.occupation);
        if (!locked.has('Social Class')) newChar['Social Class'] = utils.random(data.background.social_class);
        if (!locked.has('Homeland')) newChar['Homeland'] = utils.random(data.background.homeland);
        if (!locked.has('Family')) newChar['Family'] = utils.random(data.background.family_status);
        if (!locked.has('National Heritage')) newChar['National Heritage'] = utils.random(data.CHARACTER_NATIONAL_HERITAGE);

        // Parents
        if (!locked.has('Mother Status')) {
            const status = Math.random() > 0.3 ? data.parent_status_alive : data.parent_status_deceased;
            newChar['Mother Status'] = utils.random(status);
        }
        if (!locked.has('Father Status')) {
            const status = Math.random() > 0.3 ? data.parent_status_alive : data.parent_status_deceased;
            newChar['Father Status'] = utils.random(status);
        }

        // Life Trauma
        if (!locked.has('Life Trauma 1')) newChar['Life Trauma 1'] = utils.random(data.PRIMARY_TRAUMATIC_EVENT);
        if (!locked.has('Life Trauma 2')) newChar['Life Trauma 2'] = utils.random(data.SECONDARY_TRAUMATIC_EVENT);

        if (!locked.has('Name Type')) newChar['Name Type'] = utils.random(data.CHARACTER_NAME_TYPE);

        // Abilities
        if (!locked.has('Skills')) {
            const s1 = utils.random(data.abilities.skills);
            let s2 = utils.random(data.abilities.skills);
            while (s1 === s2) s2 = utils.random(data.abilities.skills);
            newChar['Skills'] = `${s1}, ${s2}`;
        }
        if (!locked.has('Special Ability')) newChar['Special Ability'] = utils.random(data.abilities.special_abilities);
        if (!locked.has('Notable Equipment')) newChar['Notable Equipment'] = utils.random(data.abilities.equipment);

        // Relationships
        if (!locked.has('Relationship Status')) newChar['Relationship Status'] = utils.random(state.data.stories.character.relationship);
        if (!locked.has('Ally')) newChar['Ally'] = utils.random(data.relationships.allies);
        if (!locked.has('Enemy')) newChar['Enemy'] = utils.random(data.relationships.enemies);
        if (!locked.has('Organization')) newChar['Organization'] = utils.random(data.relationships.organizations);

        // Details
        if (!locked.has('Story Style')) newChar['Story Style'] = utils.random(data.STORY_DESCRIPTOR);
        if (!locked.has('Intimate Preference')) newChar['Intimate Preference'] = utils.random(data.SEX_KINK);
        if (!locked.has('Speech Patterns')) {
            const sp1 = utils.random(data.CHARACTER_SPEECH);
            let sp2 = utils.random(data.CHARACTER_SPEECH);
            while (sp1 === sp2) sp2 = utils.random(data.CHARACTER_SPEECH);
            newChar['Speech Patterns'] = `1. ${sp1}\n2. ${sp2}`;
        }

        // Story Hook
        if (!locked.has('Story Hook')) {
            const descriptor = utils.random(data.STORY_DESCRIPTOR);
            const event = utils.random(data.BASIC_EVENT);
            newChar['Story Hook'] = `A ${descriptor} ${event} begins the character's journey.`;
        }

        // Theory of Control
        if (!locked.has('Theory of Control')) {
            const theory = utils.random(state.data.stories.character.theories_of_control);
            newChar['Theory of Control'] = `${theory.title}: "${theory.statement}"`;
        }

        state.generated.characters = newChar;
        render.characters();
        saveState();
    },

    stories: () => {
        const data = state.data.stories;
        const current = state.generated.stories;
        const locked = state.locked.stories;
        const newStory = { ...current };

        // Plot
        if (!locked.has('Archetype')) newStory['Archetype'] = utils.random(data.plot.archetypes);
        if (!locked.has('Perspective')) newStory['Perspective'] = utils.random(data.plot.perspectives);
        if (!locked.has('Genre')) newStory['Genre'] = utils.random(data.plot.genres);
        if (!locked.has('Social Issue')) newStory['Social Issue'] = utils.random(data.plot.social_issues);
        if (!locked.has('Theme')) newStory['Theme'] = utils.random(data.plot.universal_human_questions);

        // Character Elements
        if (!locked.has('Protagonist Theory')) {
            const theory = utils.random(data.character.theories_of_control);
            newStory['Protagonist Theory'] = `${theory.title}: "${theory.statement}"`;
        }
        if (!locked.has('Protagonist Desc.')) newStory['Protagonist Desc.'] = utils.random(data.character.descriptors);
        if (!locked.has('Relationship')) newStory['Relationship'] = utils.random(data.character.relationship);

        // Story Summary
        if (!locked.has('Summary')) {
            const age = Math.floor(Math.random() * 121); // 0-120
            const gender = utils.random(data.character.gender);
            const race = utils.random(data.character.race);
            const endingDesc = utils.random(data.character.descriptors);

            // Ensure we have necessary parts if they weren't locked/generated in this cycle
            const genre = newStory['Genre'] || utils.random(data.plot.genres);
            const protagDesc = newStory['Protagonist Desc.'] || utils.random(data.character.descriptors);
            const relationship = newStory['Relationship'] || utils.random(data.character.relationship);

            newStory['Summary'] = `This is a ${genre}-themed story featuring a ${age}-year-old ${protagDesc} ${gender} ${race} with a relationship of ${relationship}. The ending is ${endingDesc}.`;
        }

        state.generated.stories = newStory;
        render.stories();
        saveState();
    },

    music: () => {
        const data = state.data.music;
        const current = state.generated.music;
        const locked = state.locked.music;
        const newMusic = { ...current };

        if (!locked.has('Style')) newMusic['Style'] = utils.random(data.styles);
        if (!locked.has('Genre')) newMusic['Genre'] = utils.random(data.genres);
        if (!locked.has('Emotion')) newMusic['Emotion'] = utils.random(data.emotions);
        if (!locked.has('High Inst.')) newMusic['High Inst.'] = utils.random(data.instrumentation_highs);
        if (!locked.has('Mid Inst.')) newMusic['Mid Inst.'] = utils.random(data.instrumentation_mids);
        if (!locked.has('Low Inst.')) newMusic['Low Inst.'] = utils.random(data.instrumentation_lows);
        if (!locked.has('Ear Candy')) newMusic['Ear Candy'] = utils.random(data.ear_candy);
        if (!locked.has('Vocal FX')) newMusic['Vocal FX'] = utils.random(data.vocal_effects);
        if (!locked.has('Chord Prog.')) newMusic['Chord Prog.'] = utils.random(data.chord_progressions);
        if (!locked.has('Melody Idea')) newMusic['Melody Idea'] = utils.random(data.melody_ideas);
        if (!locked.has('Ambience')) newMusic['Ambience'] = utils.random(data.ambience_ideas);

        state.generated.music = newMusic;
        render.music();
        saveState();
    },

    art: () => {
        const styles = state.data.art.styles;
        const current = state.generated.art;
        const locked = state.locked.art;
        const newArt = { ...current };

        const pickStyle = (other) => {
            let style = utils.random(styles);
            while (style === other) style = utils.random(styles);
            return style;
        };

        if (!locked.has('Style 1')) {
            newArt['Style 1'] = pickStyle(locked.has('Style 2') ? newArt['Style 2'] : null);
        }
        if (!locked.has('Style 2')) {
            newArt['Style 2'] = pickStyle(newArt['Style 1']);
        }

        state.generated.art = newArt;
        render.art();
        saveState();
    },

    tarot: () => {
        const layoutIndex = elements.tarotLayout.value;
        const layout = state.data.characters.tarot_layouts[layoutIndex];
        const cardsData = state.data.characters.tarot_cards;

        // Shuffle cards to ensure uniqueness
        const shuffled = [...cardsData].sort(() => 0.5 - Math.random());

        const arc = {
            layoutName: layout.name,
            cards: []
        };

        layout.slots.forEach((slotName, i) => {
            const card = shuffled[i];
            const isReversed = Math.random() < 0.5;
            arc.cards.push({
                slot: slotName,
                name: card.name,
                isReversed: isReversed,
                meaning: isReversed ? card.reversed : card.upright,
                keyword: card.keyword
            });
        });

        state.generated.tarot = arc;
        render.tarot();
        saveState();
    },

    prompt: () => {
        const story = state.data.stories;
        const chars = state.data.characters;
        const current = state.generated.prompt;
        const locked = state.locked.prompt;
        const extras = story.prompt_extras || { tones: [], sensory_hooks: [] };
        const next = { ...current };

        if (!locked.has('POV')) next['POV'] = utils.random(story.plot.perspectives);
        if (!locked.has('Genre')) next['Genre'] = utils.random(story.plot.genres);
        if (!locked.has('Archetype')) next['Archetype'] = utils.random(story.plot.archetypes);
        if (!locked.has('Character')) {
            next['Character'] = buildCharacterLine({
                descriptor: utils.random(story.character.descriptors),
                occupation: utils.random(chars.background.occupation),
                trait: utils.random(chars.personality.traits),
                flaw: utils.random(chars.personality.flaws),
                motivation: utils.random(chars.personality.motivations)
            });
        }
        if (!locked.has('Conflict')) next['Conflict'] = utils.random(chars.BASIC_EVENT);
        if (!locked.has('Theme')) next['Theme'] = utils.random(story.plot.universal_human_questions);
        if (!locked.has('Setting')) next['Setting'] = utils.random(chars.background.homeland);
        if (!locked.has('Sensory hook')) next['Sensory hook'] = utils.random(extras.sensory_hooks);

        next['Prompt'] = buildPromptText(next);
        state.generated.prompt = next;
        render.prompt();
        saveState();
    },

    codex: () => {
        const idea = (elements.codexIdea && elements.codexIdea.value || state.codexIdea || '').trim();
        if (!idea) {
            showToast('Paste or type an idea first.');
            return;
        }
        state.codexIdea = idea;

        const pools = state.data.stories.codex_spin;
        const locked = state.locked.codex;
        const current = state.codexTwists || [];
        const usedKeys = new Set();
        const nextTwists = [];

        for (let i = 0; i < 3; i++) {
            const field = `Twist ${i + 1}`;
            const existing = current[i];
            if (locked.has(field) && existing) {
                nextTwists.push(existing);
                usedKeys.add(existing.key);
            } else {
                nextTwists.push(null);
            }
        }

        for (let i = 0; i < 3; i++) {
            if (nextTwists[i]) continue;
            const available = TWIST_TYPES.filter(type => !usedKeys.has(type.key) && pools[type.key] && pools[type.key].length);
            const pool = available.length ? available : TWIST_TYPES.filter(type => pools[type.key] && pools[type.key].length);
            const type = utils.random(pool);
            usedKeys.add(type.key);
            nextTwists[i] = {
                field: `Twist ${i + 1}`,
                key: type.key,
                label: type.label,
                value: utils.random(pools[type.key])
            };
        }

        const generated = { Idea: idea };
        nextTwists.forEach((twist, i) => {
            generated[`Twist ${i + 1}`] = `${twist.label}: ${twist.value}`;
        });
        generated['Prompt'] = buildRevivalText(idea, nextTwists);

        state.codexTwists = nextTwists;
        state.generated.codex = generated;
        render.codex();
        saveState();
    }
};

// Rendering
const render = {
    createField: (key, value, category) => {
        const isLocked = state.locked[category].has(key);
        const div = document.createElement('div');
        div.className = 'field-group';
        div.innerHTML = `
            <span class="field-label">${key}</span>
            <span class="field-value">${value}</span>
            <button class="lock-btn ${isLocked ? 'locked' : ''}" title="${isLocked ? 'Unlock' : 'Lock'}">
                ${isLocked ? '🔒' : '🔓'}
            </button>
        `;

        div.querySelector('.lock-btn').addEventListener('click', () => {
            utils.toggleLock(category, key);
        });

        return div;
    },

    characters: () => {
        const container = elements.charResult;
        container.innerHTML = '';
        const data = state.generated.characters;

        if (Object.keys(data).length === 0) {
            container.innerHTML = '<div class="placeholder-text">Press Generate to create a character...</div>';
            return;
        }

        const sections = {
            'BASIC INFORMATION': ['Name', 'Race', 'Gender', 'Age'],
            'APPEARANCE': ['Height', 'Build', 'Hair Color', 'Hair Style', 'Eye Color', 'Skin Tone', 'Dist. Feature'],
            'PERSONALITY': ['PERSONALITY TRAIT 1', 'PERSONALITY TRAIT 2', 'Flaw', 'Value', 'Motivation'],
            'BACKGROUND': ['Attracted To', 'Occupation', 'Social Class', 'Homeland', 'Family', 'National Heritage', 'Mother Status', 'Father Status', 'Life Trauma 1', 'Life Trauma 2', 'Name Type'],
            'ABILITIES': ['Skills', 'Special Ability', 'Notable Equipment'],
            'RELATIONSHIPS': ['Relationship Status', 'Ally', 'Enemy', 'Organization'],
            'DETAILS': ['Story Style', 'Intimate Preference'],
            'SPEECH PATTERNS': ['Speech Patterns'],
            'STORY HOOK': ['Story Hook', 'Theory of Control']
        };

        for (const [sectionName, fields] of Object.entries(sections)) {
            const header = document.createElement('div');
            header.className = 'section-header';
            header.textContent = sectionName;
            container.appendChild(header);

            fields.forEach(field => {
                if (data[field]) {
                    let displayValue = data[field];
                    if (displayValue.includes('\n')) {
                        displayValue = displayValue.replace(/\n/g, '<br>');
                    }
                    container.appendChild(render.createField(field, displayValue, 'characters'));
                }
            });
        }
    },

    stories: () => {
        const container = elements.storyResult;
        container.innerHTML = '';
        const data = state.generated.stories;

        if (Object.keys(data).length === 0) {
            container.innerHTML = '<div class="placeholder-text">Press Spin Story to generate a plot...</div>';
            return;
        }

        // Display Summary first
        if (data['Summary']) {
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'story-summary';
            summaryDiv.textContent = data['Summary'];
            container.appendChild(summaryDiv);
            container.appendChild(document.createElement('hr')); // Separator
        }

        const fields = ['Archetype', 'Perspective', 'Genre', 'Social Issue', 'Theme', 'Protagonist Theory', 'Protagonist Desc.', 'Relationship'];

        fields.forEach(field => {
            if (data[field]) {
                container.appendChild(render.createField(field, data[field], 'stories'));
            }
        });
    },

    music: () => {
        const container = elements.musicResult;
        container.innerHTML = '';
        const data = state.generated.music;

        if (Object.keys(data).length === 0) {
            container.innerHTML = '<div class="placeholder-text">Press Generate to create a music prompt...</div>';
            return;
        }

        const fields = ['Style', 'Genre', 'Emotion', 'High Inst.', 'Mid Inst.', 'Low Inst.', 'Ear Candy', 'Vocal FX', 'Chord Prog.', 'Melody Idea', 'Ambience'];

        fields.forEach(field => {
            if (data[field]) {
                container.appendChild(render.createField(field, data[field], 'music'));
            }
        });
    },

    art: () => {
        const container = elements.artResult;
        container.innerHTML = '';
        const data = state.generated.art;

        if (!data || Object.keys(data).length === 0) {
            container.innerHTML = '<div class="placeholder-text">Press Spin Styles to get two art styles...</div>';
            return;
        }

        ['Style 1', 'Style 2'].forEach(field => {
            if (data[field]) {
                container.appendChild(render.createField(field, data[field], 'art'));
            }
        });
    },

    tarot: () => {
        const container = elements.tarotResult;
        container.innerHTML = '';
        const data = state.generated.tarot;

        if (!data || !data.cards) {
            container.innerHTML = '<div class="placeholder-text">Select a layout and Draw Arc...</div>';
            return;
        }

        const header = document.createElement('h3');
        header.textContent = data.layoutName;
        header.className = 'tarot-layout-title';
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'tarot-grid';

        data.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `tarot-card ${card.isReversed ? 'reversed' : ''}`;

            // Slot Header
            const slotHeader = document.createElement('div');
            slotHeader.className = 'tarot-slot-header';
            slotHeader.textContent = card.slot;
            cardEl.appendChild(slotHeader);

            // Card Details using field-group style
            const createTarotField = (label, value) => {
                const div = document.createElement('div');
                div.className = 'field-group tarot-field';
                div.innerHTML = `
                    <span class="field-label">${label}</span>
                    <span class="field-value">${value}</span>
                `;
                return div;
            };

            cardEl.appendChild(createTarotField('Card', `${card.name} ${card.isReversed ? '(Reversed)' : ''}`));
            cardEl.appendChild(createTarotField('Keyword', card.keyword));
            cardEl.appendChild(createTarotField('Meaning', card.meaning));

            grid.appendChild(cardEl);
        });

        container.appendChild(grid);
    },

    prompt: () => {
        const container = elements.promptResult;
        if (!container) return;
        container.innerHTML = '';
        const data = state.generated.prompt;

        if (!data || !data['Prompt']) {
            container.innerHTML = '<div class="placeholder-text">Pick a form and spin a prompt you can paste anywhere...</div>';
            return;
        }

        const fields = ['POV', 'Genre', 'Archetype', 'Character', 'Conflict', 'Theme', 'Setting', 'Sensory hook'];
        fields.forEach(field => {
            if (data[field]) {
                container.appendChild(render.createField(field, data[field], 'prompt'));
            }
        });

        const preview = document.createElement('div');
        preview.className = 'prompt-output';
        preview.id = 'prompt-output-text';
        preview.textContent = data['Prompt'];
        container.appendChild(preview);
    },

    codex: () => {
        const container = elements.codexResult;
        if (!container) return;
        container.innerHTML = '';
        const data = state.generated.codex;

        if (!data || !data['Prompt']) {
            container.innerHTML = '<div class="placeholder-text">Paste an old idea, then spin three twists to wake it up...</div>';
            return;
        }

        ['Twist 1', 'Twist 2', 'Twist 3'].forEach(field => {
            if (data[field]) {
                container.appendChild(render.createField(field, data[field], 'codex'));
            }
        });

        const preview = document.createElement('div');
        preview.className = 'prompt-output';
        preview.id = 'codex-output-text';
        preview.textContent = data['Prompt'];
        container.appendChild(preview);
    },

    favorites: () => {
        const container = elements.favoritesResult;
        if (!container) return;
        container.innerHTML = '';
        const items = loadFavorites();

        if (!items.length) {
            container.innerHTML = '<div class="placeholder-text">Saved prompts, revivals, and characters will land here...</div>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'favorite-item';
            card.dataset.id = item.id;

            const meta = document.createElement('div');
            meta.className = 'favorite-meta';
            const type = document.createElement('span');
            type.className = 'favorite-type';
            type.textContent = item.type;
            const when = document.createElement('span');
            when.textContent = formatStamp(item.savedAt);
            meta.appendChild(type);
            meta.appendChild(when);

            const body = document.createElement('div');
            body.className = 'favorite-text';
            body.textContent = item.text;

            const actions = document.createElement('div');
            actions.className = 'favorite-actions';
            const copyBtn = document.createElement('button');
            copyBtn.className = 'secondary-btn';
            copyBtn.type = 'button';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => utils.copyToClipboard(item.text));
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'secondary-btn';
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteFavorite(item.id));
            actions.appendChild(copyBtn);
            actions.appendChild(deleteBtn);

            card.appendChild(meta);
            card.appendChild(body);
            card.appendChild(actions);
            container.appendChild(card);
        });
    }
};

// Persistence
function saveState() {
    const toSave = {
        currentTab: state.currentTab,
        generated: state.generated,
        locked: {
            characters: Array.from(state.locked.characters),
            stories: Array.from(state.locked.stories),
            music: Array.from(state.locked.music),
            art: Array.from(state.locked.art),
            prompt: Array.from(state.locked.prompt),
            codex: Array.from(state.locked.codex)
        },
        tarotLayoutIndex: elements.tarotLayout ? elements.tarotLayout.value : undefined,
        promptForm: elements.promptForm ? elements.promptForm.value : state.promptForm,
        promptTone: elements.promptTone ? elements.promptTone.value : state.promptTone,
        codexIdea: elements.codexIdea ? elements.codexIdea.value : state.codexIdea,
        codexTwists: state.codexTwists
    };
    localStorage.setItem('storySpinnerState', JSON.stringify(toSave));
}

function restoreState() {
    const saved = localStorage.getItem('storySpinnerState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.currentTab = parsed.currentTab || 'characters';
            state.generated = {
                characters: {},
                stories: {},
                music: {},
                tarot: {},
                art: {},
                prompt: {},
                codex: {},
                ...(parsed.generated || {})
            };

            if (parsed.locked) {
                state.locked.characters = new Set(parsed.locked.characters);
                state.locked.stories = new Set(parsed.locked.stories);
                state.locked.music = new Set(parsed.locked.music);
                state.locked.art = new Set(parsed.locked.art || []);
                state.locked.prompt = new Set(parsed.locked.prompt || []);
                state.locked.codex = new Set(parsed.locked.codex || []);
            }

            if (parsed.tarotLayoutIndex !== undefined && elements.tarotLayout && elements.tarotLayout.options.length > 0) {
                elements.tarotLayout.value = parsed.tarotLayoutIndex;
            }

            state.promptForm = parsed.promptForm || state.promptForm;
            state.promptTone = parsed.promptTone || '';
            state.codexIdea = parsed.codexIdea || '';
            state.codexTwists = parsed.codexTwists || [];

            if (elements.promptForm && state.promptForm) {
                elements.promptForm.value = state.promptForm;
            }
            if (elements.promptTone && state.promptTone) {
                elements.promptTone.value = state.promptTone;
            }
            if (elements.codexIdea) {
                elements.codexIdea.value = state.codexIdea;
            }

            // Restore UI
            switchTab(state.currentTab);
            render.characters();
            render.stories();
            render.music();
            render.art();
            render.tarot();
            render.prompt();
            render.codex();
            render.favorites();
        } catch (e) {
            console.error('Failed to restore state', e);
        }
    } else {
        // Default to characters tab if no state
        switchTab('characters');
        render.favorites();
    }
}

// Event Listeners
function switchTab(tabId) {
    state.currentTab = tabId;

    elements.navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    elements.sections.forEach(section => {
        section.classList.toggle('active', section.id === tabId);
    });

    saveState();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Re-select elements to ensure they exist
    elements.navButtons = document.querySelectorAll('.nav-btn');
    elements.sections = document.querySelectorAll('.content-section');
    elements.generateCharBtn = document.getElementById('generate-char');
    elements.copyCharBtn = document.getElementById('copy-char');
    elements.charResult = document.getElementById('char-result');
    elements.tarotLayout = document.getElementById('tarot-layout');
    elements.generateTarotBtn = document.getElementById('generate-tarot');
    elements.copyTarotBtn = document.getElementById('copy-tarot');
    elements.tarotResult = document.getElementById('tarot-result');
    elements.generateStoryBtn = document.getElementById('generate-story');
    elements.copyStoryBtn = document.getElementById('copy-story');
    elements.storyResult = document.getElementById('story-result');
    elements.generateMusicBtn = document.getElementById('generate-music');
    elements.copyMusicBtn = document.getElementById('copy-music');
    elements.musicResult = document.getElementById('music-result');
    elements.generateArtBtn = document.getElementById('generate-art');
    elements.copyArtBtn = document.getElementById('copy-art');
    elements.artResult = document.getElementById('art-result');
    elements.promptForm = document.getElementById('prompt-form');
    elements.promptTone = document.getElementById('prompt-tone');
    elements.generatePromptBtn = document.getElementById('generate-prompt');
    elements.copyPromptBtn = document.getElementById('copy-prompt');
    elements.savePromptBtn = document.getElementById('save-prompt');
    elements.promptResult = document.getElementById('prompt-result');
    elements.codexIdea = document.getElementById('codex-idea');
    elements.generateCodexBtn = document.getElementById('generate-codex');
    elements.copyCodexBtn = document.getElementById('copy-codex');
    elements.saveCodexBtn = document.getElementById('save-codex');
    elements.codexResult = document.getElementById('codex-result');
    elements.saveCharBtn = document.getElementById('save-char');
    elements.exportFavoritesBtn = document.getElementById('export-favorites');
    elements.favoritesResult = document.getElementById('favorites-result');
    elements.toast = document.getElementById('toast');

    // Attach Event Listeners
    if (elements.navButtons) {
        elements.navButtons.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
    }

    if (elements.generateCharBtn) elements.generateCharBtn.addEventListener('click', generators.characters);
    if (elements.spinStoryBtn) elements.spinStoryBtn.addEventListener('click', generators.stories); // Note: ID in HTML is generate-story, but elements key was generateStoryBtn. Let's fix this mapping below.
    if (elements.generateStoryBtn) elements.generateStoryBtn.addEventListener('click', generators.stories);
    if (elements.generateMusicBtn) elements.generateMusicBtn.addEventListener('click', generators.music);
    if (elements.generateArtBtn) elements.generateArtBtn.addEventListener('click', generators.art);
    if (elements.generateTarotBtn) elements.generateTarotBtn.addEventListener('click', generators.tarot);
    if (elements.generatePromptBtn) elements.generatePromptBtn.addEventListener('click', generators.prompt);
    if (elements.generateCodexBtn) elements.generateCodexBtn.addEventListener('click', generators.codex);

    if (elements.copyCharBtn) elements.copyCharBtn.addEventListener('click', () => {
        const text = utils.formatOutput(state.generated.characters);
        if (text) utils.copyToClipboard(text);
    });

    if (elements.copyStoryBtn) elements.copyStoryBtn.addEventListener('click', () => {
        const text = utils.formatOutput(state.generated.stories);
        if (text) utils.copyToClipboard(text);
    });

    if (elements.copyMusicBtn) elements.copyMusicBtn.addEventListener('click', () => {
        const text = utils.formatOutput(state.generated.music);
        if (text) utils.copyToClipboard(text);
    });

    if (elements.copyArtBtn) elements.copyArtBtn.addEventListener('click', () => {
        const text = utils.formatOutput(state.generated.art);
        if (text) utils.copyToClipboard(text);
    });

    if (elements.copyTarotBtn) elements.copyTarotBtn.addEventListener('click', () => {
        const text = utils.formatOutput(state.generated.tarot);
        if (text) utils.copyToClipboard(text);
    });

    if (elements.copyPromptBtn) elements.copyPromptBtn.addEventListener('click', () => {
        utils.copyToClipboard(state.generated.prompt && state.generated.prompt['Prompt']);
    });

    if (elements.copyCodexBtn) elements.copyCodexBtn.addEventListener('click', () => {
        utils.copyToClipboard(state.generated.codex && state.generated.codex['Prompt']);
    });

    if (elements.savePromptBtn) elements.savePromptBtn.addEventListener('click', () => {
        saveFavorite('Story prompt', state.generated.prompt && state.generated.prompt['Prompt']);
    });

    if (elements.saveCodexBtn) elements.saveCodexBtn.addEventListener('click', () => {
        saveFavorite('Codex spin', state.generated.codex && state.generated.codex['Prompt']);
    });

    if (elements.saveCharBtn) elements.saveCharBtn.addEventListener('click', () => {
        saveFavorite('Character', utils.formatOutput(state.generated.characters));
    });

    if (elements.exportFavoritesBtn) elements.exportFavoritesBtn.addEventListener('click', exportFavorites);

    if (elements.promptForm) {
        elements.promptForm.addEventListener('change', () => {
            state.promptForm = elements.promptForm.value;
            if (state.generated.prompt && state.generated.prompt['Prompt']) {
                state.generated.prompt['Prompt'] = buildPromptText(state.generated.prompt);
                render.prompt();
            }
            saveState();
        });
    }

    if (elements.promptTone) {
        elements.promptTone.addEventListener('change', () => {
            state.promptTone = elements.promptTone.value;
            if (state.generated.prompt && state.generated.prompt['Prompt']) {
                state.generated.prompt['Prompt'] = buildPromptText(state.generated.prompt);
                render.prompt();
            }
            saveState();
        });
    }

    if (elements.codexIdea) {
        elements.codexIdea.addEventListener('input', () => {
            state.codexIdea = elements.codexIdea.value;
            saveState();
        });
    }

    // Load Data
    loadData();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    }
});

// Update generators to check for data
const originalGenerators = { ...generators };
Object.keys(generators).forEach(key => {
    const original = generators[key];
    generators[key] = () => {
        const needsCharacters = key === 'tarot' || key === 'prompt' || key === 'codex';
        const needsStories = key === 'prompt' || key === 'codex' || key === 'stories';
        const dataKey = needsCharacters ? 'characters' : (needsStories ? 'stories' : key);
        if (!state.data[dataKey] || (needsStories && !state.data.stories) || (key === 'prompt' && !state.data.characters)) {
            showToast('Data is still loading-- try again in a moment.');
            return;
        }
        original();
    };
});
