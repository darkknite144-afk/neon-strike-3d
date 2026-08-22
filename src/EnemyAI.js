// ============================================================
// EnemyAI.js - Enemy spawning, behavior, and AI
// ============================================================
class EnemyManager {

    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.enemies = [];
        this.spawnTimer = 0;
        this.waveActive = false;
        this.toSpawn = 0;
        this.waveNumber = 0;
    }

    startWave(num) {
        this.waveNumber = num;
        this.toSpawn = CONFIG.WAVES.baseCount + (num - 1) * CONFIG.WAVES.countGrowth;
        this.spawnTimer = 0;
        this.waveActive = true;
    }

    update(dt, playerPos) {
        if (this.waveActive && this.toSpawn > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.enemies.length < CONFIG.WAVES.maxConcurrent) {
                this._spawnEnemy(playerPos);
                this.toSpawn--;
                this.spawnTimer = CONFIG.WAVES.spawnInterval;
            }
        }

        if (this.waveActive && this.toSpawn === 0 && this.enemies.length === 0) {
            this.waveActive = false;
            this.game.onWaveCleared();
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            this._updateEnemy(e, dt, playerPos);
        }
    }

    _spawnEnemy(playerPos) {
        let type = 'grunt';
        const r = Math.random();
        if (this.waveNumber >= 3 && r < 0.2) type = 'tank';
        else if (this.waveNumber >= 2 && r < 0.4) type = 'runner';
        else if (this.waveNumber >= 5 && r < 0.1) type = 'brute';

        const model = AssetFactory.createEnemyModel(type);
        const config = CONFIG.ENEMIES[type];

        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 15;
        const x = Math.max(-CONFIG.WORLD.size + 5, Math.min(CONFIG.WORLD.size - 5, playerPos.x + Math.cos(angle) * dist));
        const z = Math.max(-CONFIG.WORLD.size + 5, Math.min(CONFIG.WORLD.size - 5, playerPos.z + Math.sin(angle) * dist));

        model.position.set(x, 0, z);

        const enemy = {
            model: model,
            type: type,
            config: config,
            health: config.health,
            maxHealth: config.health,
            velocity: new THREE.Vector3(),
            fireTimer: Math.random() * config.fireRate,
            attackCooldown: 0,
            hurtFlash: 0,
            walkPhase: Math.random() * Math.PI * 2,
            isDead: false,
            lastSeenPlayer: 0,
            alerted: false,
        };

        this.scene.add(model);
        this.enemies.push(enemy);
    }

    _updateEnemy(enemy, dt, playerPos) {
        if (enemy.isDead) return;

        const model = enemy.model;
        const config = enemy.config;
        const distToPlayer = model.position.distanceTo(playerPos);

        const playerCloaked = this.game.player.isCloaked;

        if (!playerCloaked || distToPlayer < 2) {
            enemy.alerted = true;
        }

        if (enemy.alerted) {
            if (distToPlayer > config.range * 0.6) {
                const dir = new THREE.Vector3().subVectors(playerPos, model.position).setY(0).normalize();
                const speed = config.speed;
                model.position.x += dir.x * speed * dt;
                model.position.z += dir.z * speed * dt;

                const targetAngle = Math.atan2(dir.x, dir.z);
                model.rotation.y = this._lerpAngle(model.rotation.y, targetAngle, dt * 5);

                enemy.walkPhase += dt * speed * 1.5;
                const parts = model.userData.parts;
                if (parts) {
                    const swing = Math.sin(enemy.walkPhase) * 0.3;
                    parts.leftLeg.rotation.x = swing;
                    parts.rightLeg.rotation.x = -swing;
                    parts.leftArm.rotation.x = -swing * 0.5;
                    parts.rightArm.rotation.x = swing * 0.5;
                }
            } else if (distToPlayer < config.range) {
                const dir = new THREE.Vector3().subVectors(playerPos, model.position).setY(0).normalize();
                model.rotation.y = this._lerpAngle(model.rotation.y, Math.atan2(dir.x, dir.z), dt * 4);

                enemy.fireTimer -= dt;
                if (enemy.fireTimer <= 0) {
                    this._enemyShoot(enemy, playerPos);
                    enemy.fireTimer = config.fireRate;
                }
            }
        }

        const limit = CONFIG.WORLD.size - 2;
        model.position.x = Math.max(-limit, Math.min(limit, model.position.x));
        model.position.z = Math.max(-limit, Math.min(limit, model.position.z));

        if (enemy.hurtFlash > 0) {
            enemy.hurtFlash -= dt;
            const parts = model.userData.parts;
            if (parts) {
                const flash = enemy.hurtFlash > 0 ? 0xff0000 : config.color;
                parts.body.material.color.setHex(flash);
            }
        }
    }

    _enemyShoot(enemy, playerPos) {
        const config = enemy.config;
        const muzzlePos = enemy.model.position.clone();
        muzzlePos.y = 1.2;

        const spread = 0.05;
        const dir = new THREE.Vector3().subVectors(playerPos, muzzlePos).normalize();
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.z += (Math.random() - 0.5) * spread;
        dir.normalize();

        const hitPos = muzzlePos.clone().add(dir.clone().multiplyScalar(config.range));

        const player = this.game.player;
        const playerCenter = player.position.clone();
        playerCenter.y += 1.0;
        const distToPlayer = muzzlePos.distanceTo(playerCenter);

        if (distToPlayer < config.range) {
            const toPlayer = new THREE.Vector3().subVectors(playerCenter, muzzlePos).normalize();
            const dot = toPlayer.dot(dir);
            if (dot > 0.95) {
                const damage = config.damage * (0.7 + Math.random() * 0.3);
                this.game.takeDamage(damage);
                this.game.effects.spawnHitSpark(playerCenter, 0xff4400);
            }
        }

        this.game.effects.spawnBulletTrail(muzzlePos, hitPos, 0xff4400);
        this.game.effects.spawnMuzzleFlash(muzzlePos);
    }

    _lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    }

    damageEnemy(enemy, damage, hitPoint) {
        enemy.health -= damage;
        enemy.hurtFlash = 0.1;
        enemy.alerted = true;

        if (enemy.health <= 0 && !enemy.isDead) {
            this.killEnemy(enemy, hitPoint);
            return true;
        }
        return false;
    }

    killEnemy(enemy, hitPoint) {
        if (enemy.isDead) return;
        enemy.isDead = true;

        this.game.effects.spawnExplosion(enemy.model.position.clone(), enemy.config.scale);
        this.game.addScore(enemy.config.score);
        this.game.addKill();
        this.game.showKillFeed('You eliminated ' + enemy.config.name);

        if (Math.random() < 0.25) {
            this.game.spawnPickup(enemy.model.position.clone());
        }

        this.scene.remove(enemy.model);
        const idx = this.enemies.indexOf(enemy);
        if (idx >= 0) this.enemies.splice(idx, 1);

        enemy.model.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }

    checkHits(origin, direction, range) {
        let closestDist = range;
        let hitEnemy = null;
        let hitPoint = null;

        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.isDead) continue;

            const center = e.model.position.clone();
            center.y += 1.0;
            const radius = 0.5 * e.config.scale;

            const oc = new THREE.Vector3().subVectors(origin, center);
            const a = direction.dot(direction);
            const b = 2 * oc.dot(direction);
            const c = oc.dot(oc) - radius * radius;
            const disc = b * b - 4 * a * c;

            if (disc >= 0) {
                const t = (-b - Math.sqrt(disc)) / (2 * a);
                if (t > 0 && t < closestDist) {
                    closestDist = t;
                    hitEnemy = e;
                    hitPoint = origin.clone().add(direction.clone().multiplyScalar(t));
                }
            }
        }

        return { enemy: hitEnemy, point: hitPoint, distance: closestDist };
    }

    clearAll() {
        for (const e of this.enemies) {
            this.scene.remove(e.model);
            e.model.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
        this.enemies = [];
        this.waveActive = false;
        this.toSpawn = 0;
    }

    getAliveCount() { return this.enemies.length; }
}