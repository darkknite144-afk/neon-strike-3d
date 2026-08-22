// ============================================================
// Characters.js - Player character definitions with unique skills
// ============================================================
const CHARACTERS = {

    // 1. VOLT - Speed demon with dash ability
    volt: {
        id: 'volt',
        name: 'VOLT',
        icon: '⚡',
        title: 'Speed Striker',
        description: 'Dash forward with superhuman speed. Low health but extreme mobility.',
        colorScheme: {
            primary: 0x00ddff,     // cyan
            secondary: 0x004466,
            skin: 0xffddaa,
            accent: 0x00ffff,
        },
        skill: {
            name: 'PHASE DASH',
            description: 'Instantly dash 8m in movement direction, becoming briefly invulnerable.',
            cooldown: 6,           // seconds
            duration: 0.4,
            type: 'dash',
        },
        stats: {
            health: 80,
            speed: 8,
            sprintSpeed: 13,
            weapon: 'smg',
        },
    },

    // 2. TITAN - Tanky bruiser with shield
    titan: {
        id: 'titan',
        name: 'TITAN',
        icon: '🛡',
        title: 'Heavy Guardian',
        description: 'Deploy an energy shield that blocks incoming damage. High health, slow movement.',
        colorScheme: {
            primary: 0xff8800,
            secondary: 0x442200,
            skin: 0xffcc99,
            accent: 0xffaa00,
        },
        skill: {
            name: 'BULWARK',
            description: 'Deploy a 150HP energy shield for 5 seconds that absorbs damage.',
            cooldown: 12,
            duration: 5,
            type: 'shield',
            shieldHP: 150,
        },
        stats: {
            health: 150,
            speed: 5.5,
            sprintSpeed: 8,
            weapon: 'shotgun',
        },
    },

    // 3. NOVA - Area damage specialist
    nova: {
        id: 'nova',
        name: 'NOVA',
        icon: '💥',
        title: 'Explosive Expert',
        description: 'Launch an energy grenade that explodes for area damage. Balanced stats.',
        colorScheme: {
            primary: 0xaa00ff,
            secondary: 0x330044,
            skin: 0xffddbb,
            accent: 0xff00ff,
        },
        skill: {
            name: 'NOVA BLAST',
            description: 'Launch an energy grenade dealing 60 AoE damage in a 5m radius.',
            cooldown: 8,
            duration: 0,
            type: 'grenade',
            damage: 60,
            radius: 5,
        },
        stats: {
            health: 100,
            speed: 7,
            sprintSpeed: 10,
            weapon: 'rifle',
        },
    },

    // 4. SPECTRE - Stealth sniper
    spectre: {
        id: 'spectre',
        name: 'SPECTRE',
        icon: '🎯',
        title: 'Shadow Marksman',
        description: 'Turn invisible for 3 seconds. Enemies lose track of you. Sniper-focused.',
        colorScheme: {
            primary: 0x00ff88,
            secondary: 0x004422,
            skin: 0xddeedd,
            accent: 0x00ff44,
        },
        skill: {
            name: 'GHOST CLOAK',
            description: 'Become invisible for 3 seconds. Enemy AI loses target lock.',
            cooldown: 10,
            duration: 3,
            type: 'cloak',
        },
        stats: {
            health: 90,
            speed: 6.5,
            sprintSpeed: 9.5,
            weapon: 'sniper',
        },
    },
};

// Character data for the selection screen
const CHARACTER_LIST = Object.values(CHARACTERS);