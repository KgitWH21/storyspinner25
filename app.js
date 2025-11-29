
// State Management
const state = {
    data: {
        characters: null,
        stories: null,
        music: null
    },
    currentTab: 'characters',
    generated: {
        characters: {},
        stories: {},
        music: {},
        tarot: {}
    },
    locked: {
        characters: new Set(),
        stories: new Set(),
        music: new Set()
    }
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
    musicResult: document.getElementById('music-result')
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
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
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

// Data Fetching
async function loadData() {
    try {
        const [charRes, storyRes, musicRes] = await Promise.all([
            fetch('character_elements.json'),
            fetch('story_elements.json'),
            fetch('music_elements.json')
        ]);

        state.data.characters = await charRes.json();
        state.data.stories = await storyRes.json();
        state.data.music = await musicRes.json();

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
        if (!locked.has('Trait')) newChar['Trait'] = utils.random(data.personality.traits);
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
            'PERSONALITY': ['Trait', 'Flaw', 'Value', 'Motivation'],
            'BACKGROUND': ['Attracted To', 'Occupation', 'Social Class', 'Homeland', 'Family', 'National Heritage', 'Mother Status', 'Father Status', 'Name Type'],
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
            music: Array.from(state.locked.music)
        },
        tarotLayoutIndex: elements.tarotLayout.value
    };
    localStorage.setItem('storySpinnerState', JSON.stringify(toSave));
}

function restoreState() {
    const saved = localStorage.getItem('storySpinnerState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.currentTab = parsed.currentTab || 'characters';
            state.generated = parsed.generated || state.generated;

            if (parsed.locked) {
                state.locked.characters = new Set(parsed.locked.characters);
                state.locked.stories = new Set(parsed.locked.stories);
                state.locked.music = new Set(parsed.locked.music);
            }

            if (parsed.tarotLayoutIndex !== undefined && elements.tarotLayout.options.length > 0) {
                elements.tarotLayout.value = parsed.tarotLayoutIndex;
            }

            // Restore UI
            switchTab(state.currentTab);
            render.characters();
            render.stories();
            render.music();
            render.tarot();
        } catch (e) {
            console.error('Failed to restore state', e);
        }
    } else {
        // Default to characters tab if no state
        switchTab('characters');
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
    if (elements.generateTarotBtn) elements.generateTarotBtn.addEventListener('click', generators.tarot);

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

    if (elements.copyTarotBtn) elements.copyTarotBtn.addEventListener('click', () => {
        const text = utils.formatOutput(state.generated.tarot);
        if (text) utils.copyToClipboard(text);
    });

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
        if (!state.data[key === 'tarot' ? 'characters' : key]) {
            alert('Data not loaded yet. Please wait...');
            return;
        }
        original();
    };
});
