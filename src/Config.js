// ============================================================
// Config.js - Game configuration and constants
// ============================================================
const CONFIG = {
    // Renderer settings - tuned for low-RAM mobile
    RENDERER: {
        antialias: false,        // Off for performance on mobile
        powerPreference: 'high-performance',
        pixelRatio: Math.min(window.devicePixelRatio, 1.5), // Cap pixel ratio
        shadowMapEnabled: false,  // Disabled for performance - using baked look
        maxFPS: 60,
    },

    // World
    WORLD: {
        size: 80,               // Arena half-size
        groundColor: 0x1a1a2e,
        fogColor: 0x0a0a1a,
        fogNear: 30,
        fogFar: 90,
        gravity: -22,
    },

    // Player defaults
    PLAYER: {
        height: 1.7,
        radius: 0.4,
        moveSpeed: 7,
        sprintSpeed: 11,
        jumpForce: 8,
        maxHealth: 100,
        healthRegenDelay: 5,    // seconds after damage
        healthRegenRate: 8,     // per second
        maxShield: 50,
        aimSlowdown: 0.5,
    },

    // Camera
    CAMERA: {
        fov: 70,
        near: 0.1,
        far: 120,
        distance: 5.5,
        height: 2.2,
        sensitivity: 0.0035,
        minPolar: 0.3,
        maxPolar: Math.PI - 0.3,
    },

    // Weapons
    WEAPONS: {
        rifle: {
            name: 'RIFLE',
            damage: 18,
            fireRate: 0.1,       // seconds between shots
            magSize: 30,
            reloadTime: 1.8,
            range: 100,
            spread: 0.015,
            auto: true,
            recoil: 0.008,
            muzzleFlash: true,
        },
        shotgun: {
            name: 'SHOTGUN',
            damage: 12,          // per pellet
            pellets: 6,
            fireRate: 0.7,
            magSize: 8,
            reloadTime: 2.5,
            range: 35,
            spread: 0.08,
            auto: false,
            recoil: 0.03,
        },
        smg: {
            name: 'SMG',
            damage: 12,
            fireRate: 0.06,
            magSize: 40,
            reloadTime: 1.5,
            range: 60,
            spread: 0.03,
            auto: true,
            recoil: 0.005,
        },
        sniper: {
            name: 'SNIPER',
            damage: 80,
            fireRate: 1.2,
            magSize: 5,
            reloadTime: 3.0,
            range: 200,
            spread: 0.001,
            auto: false,
            recoil: 0.05,
        },
    },

    // Enemy types
    ENEMIES: {
        grunt: {
            name: 'Grunt',
            health: 40,
            speed: 3,
            damage: 8,
            fireRate: 1.2,
            range: 40,
            score: 100,
            color: 0xff4444,
            scale: 1.0,
        },
        runner: {
            name: 'Runner',
            health: 25,
            speed: 6,
            damage: 5,
            fireRate: 0.8,
            range: 30,
            score: 150,
            color: 0xffaa00,
            scale: 0.85,
        },
        tank: {
            name: 'Tank',
            health: 120,
            speed: 2,
            damage: 15,
            fireRate: 1.5,
            range: 50,
            score: 300,
            color: 0x8800ff,
            scale: 1.4,
        },
        brute: {
            name: 'Brute',
            health: 200,
            speed: 1.5,
            damage: 25,
            fireRate: 2.0,
            range: 35,
            score: 500,
            color: 0xff0066,
            scale: 1.6,
        },
    },

    // Wave system
    WAVES: {
        baseCount: 5,
        countGrowth: 2,        // added per wave
        spawnInterval: 1.5,     // seconds between spawns
        interWaveDelay: 5,      // seconds between waves
        maxConcurrent: 12,
    },

    // Effects
    EFFECTS: {
        muzzleFlashDuration: 0.05,
        bulletTrailDuration: 0.08,
        hitSparkDuration: 0.3,
        explosionDuration: 0.6,
        bloodParticleCount: 6,
    },

    // Performance
    PERFORMANCE: {
        maxEnemies: 20,
        maxBullets: 100,
        maxEffects: 50,
        cullDistance: 100,
        targetFPS: 60,
    },

    // Mobile detection
    isMobile: /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent),
    isTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
};