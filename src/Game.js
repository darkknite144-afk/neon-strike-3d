// ============================================================
// Game.js - Core game loop, player controller, camera, skills, HUD
// ============================================================
class Game {

    constructor() {
        this.scene = null; this.renderer = null; this.camera = null; this.clock = null;
        this.player = null; this.weaponSystem = null; this.enemyManager = null;
        this.arena = null; this.effects = null; this.running = false; this.paused = false;

        this.selectedChar = null; this.charConfig = null; this.playerModel = null;
        this.health = 100; this.maxHealth = 100; this.shield = 0; this.maxShield = 50;
        this.score = 0; this.kills = 0; this.wave = 0;
        this.isCloaked = false; this.cloakTimer = 0; this.dashTimer = 0;
        this.dashVelocity = new THREE.Vector3(); this.isDashing = false;
        this.skillCooldown = 0; this.skillActive = false; this.skillTimer = 0;
        this.shieldMesh = null; this.lastDamageTime = 0; this.velocityY = 0;
        this.isGrounded = true; this.playerVelocity = new THREE.Vector3();
        this.cameraYaw = 0; this.cameraPitch = 0.5; this.cameraDistance = 5.5;
        this.ambientLight = null; this.dirLight = null;
        this.frameTimes = []; this.fps = 60;
        this.interWaveTimer = 0; this.waitingForNextWave = false;
    }

    init(characterId) {
        this.selectedChar = characterId;
        this.charConfig = CHARACTERS[characterId];
        this.maxHealth = this.charConfig.stats.health;
        this.health = this.maxHealth;
        this.maxShield = this.charConfig.id === 'titan' ? 50 : 0;
        this.shield = 0;

        this._setupRenderer(); this._setupScene(); this._setupLights();
        this._setupPlayer(); this._setupArena(); this._setupWeaponSystem();
        this._setupEnemyManager(); this._setupEffects();
        InputManager.init();

        this.clock = new THREE.Clock();
        this.running = true; this.paused = false;
        this.wave = 1; this.waitingForNextWave = true; this.interWaveTimer = 3;
    }

    _setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: CONFIG.RENDERER.antialias, powerPreference: CONFIG.RENDERER.powerPreference });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(CONFIG.RENDERER.pixelRatio);
        this.renderer.shadowMap.enabled = CONFIG.RENDERER.shadowMapEnabled;
        this.renderer.setClearColor(CONFIG.WORLD.fogColor, 1);
    }

    _setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(CONFIG.WORLD.fogColor, CONFIG.WORLD.fogNear, CONFIG.WORLD.fogFar);
        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.fov, window.innerWidth / window.innerHeight, CONFIG.CAMERA.near, CONFIG.CAMERA.far);
    }

    _setupLights() {
        this.ambientLight = new THREE.AmbientLight(0x404060, 1.2);
        this.scene.add(this.ambientLight);
        this.dirLight = new THREE.DirectionalLight(0x8899ff, 0.8);
        this.dirLight.position.set(20, 30, 10);
        this.scene.add(this.dirLight);
        const fillLight = new THREE.DirectionalLight(0xff66aa, 0.3);
        fillLight.position.set(-15, 10, -10);
        this.scene.add(fillLight);
    }

    _setupPlayer() {
        this.playerModel = AssetFactory.createCharacterModel(this.charConfig.colorScheme);
        this.scene.add(this.playerModel);
        this.playerModel.position.set(0, 0, 0);
        this.player = { position: this.playerModel.position, isCloaked: false };
    }

    _setupArena() { this.arena = new Arena(this.scene); this.arena.build(); }
    _setupWeaponSystem() { this.weaponSystem = new WeaponSystem(this); this.weaponSystem.setWeapon(this.charConfig.stats.weapon); }
    _setupEnemyManager() { this.enemyManager = new EnemyManager(this.scene, this); }
    _setupEffects() { this.effects = new EffectsManager(this.scene); }

    update() {
        const dt = Math.min(this.clock.getDelta(), 0.05);
        if (!this.running || this.paused) { this._render(); return; }
        this._updateFPS(dt); this._updateInput(dt); this._updatePlayer(dt);
        this._updateCamera(dt); this._updateWeapon(dt); this._updateSkills(dt);
        this._updateEnemies(dt); this._updateEffects(dt); this._updatePickups(dt);
        this._updateWaves(dt); this._updateHUD(); this._checkPause();
        InputManager.lateUpdate(); this._render();
    }

    _render() { this.renderer.render(this.scene, this.camera); }

    _updateFPS(dt) {
        this.frameTimes.push(dt);
        if (this.frameTimes.length > 30) this.frameTimes.shift();
        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.fps = Math.round(1 / avg);
    }

    _updateInput(dt) {
        const lookX = InputManager.look.deltaX * CONFIG.CAMERA.sensitivity;
        const lookY = InputManager.look.deltaY * CONFIG.CAMERA.sensitivity;
        this.cameraYaw -= lookX;
        this.cameraPitch += lookY;
        this.cameraPitch = Math.max(CONFIG.CAMERA.minPolar, Math.min(CONFIG.CAMERA.maxPolar, this.cameraPitch));
        if (InputManager.isKeyDown('ArrowLeft')) this.cameraYaw += 2 * dt;
        if (InputManager.isKeyDown('ArrowRight')) this.cameraYaw -= 2 * dt;
    }

    _updatePlayer(dt) {
        const moveInput = InputManager.getKeyboardMove() || InputManager.move;
        const speed = this.charConfig.stats.speed;
        const sprintSpeed = this.charConfig.stats.sprintSpeed;

        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false; this.isCloaked = false;
                this.player.isCloaked = false; this._setModelOpacity(1.0);
            }
            const newPos = this.playerModel.position.clone().add(this.dashVelocity.clone().multiplyScalar(dt * 20));
            const resolved = this.arena.resolveCollision(newPos, CONFIG.PLAYER.radius);
            this.playerModel.position.copy(resolved);
            return;
        }

        const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
        const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
        let moveDir = new THREE.Vector3();
        moveDir.addScaledVector(forward, moveInput.y);
        moveDir.addScaledVector(right, moveInput.x);

        const isSprinting = InputManager.isKeyDown('ShiftLeft') || (moveInput.y > 0.5 && !InputManager.aim);
        const currentSpeed = isSprinting ? sprintSpeed : speed * (InputManager.aim ? CONFIG.PLAYER.aimSlowdown : 1);
        moveDir.normalize().multiplyScalar(currentSpeed);

        const newPos = this.playerModel.position.clone().addScaledVector(moveDir, dt);
        const resolved = this.arena.resolveCollision(newPos, CONFIG.PLAYER.radius);
        this.playerModel.position.copy(resolved);

        if (InputManager.jumpPressed && this.isGrounded) {
            this.velocityY = CONFIG.WORLD.gravity * -0.4;
            this.isGrounded = false;
        }
        if (!this.isGrounded || this.velocityY !== 0) {
            this.velocityY += CONFIG.WORLD.gravity * dt;
            this.playerModel.position.y += this.velocityY * dt;
            if (this.playerModel.position.y <= 0) {
                this.playerModel.position.y = 0; this.velocityY = 0; this.isGrounded = true;
            }
        }

        if (moveDir.lengthSq() > 0.01) {
            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetAngle - this.playerModel.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.playerModel.rotation.y += diff * dt * 10;
        } else if (InputManager.aim || InputManager.fire) {
            const camAngle = this.cameraYaw + Math.PI;
            let diff = camAngle - this.playerModel.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.playerModel.rotation.y += diff * dt * 15;
        }

        const parts = this.playerModel.userData.parts;
        if (parts) {
            const moving = moveDir.lengthSq() > 0.5;
            const phase = performance.now() * 0.01;
            const swing = moving ? Math.sin(phase * (isSprinting ? 1.5 : 1)) * 0.4 : 0;
            parts.leftLeg.rotation.x = swing; parts.rightLeg.rotation.x = -swing;
            parts.leftArm.rotation.x = -swing * 0.5; parts.rightArm.rotation.x = swing * 0.5;
        }

        if (performance.now() / 1000 - this.lastDamageTime > CONFIG.PLAYER.healthRegenDelay && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + CONFIG.PLAYER.healthRegenRate * dt);
        }
    }

    _updateCamera(dt) {
        const offset = new THREE.Vector3(
            Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
            Math.sin(this.cameraPitch),
            Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
        ).multiplyScalar(this.cameraDistance);
        const targetPos = this.playerModel.position.clone();
        targetPos.y += CONFIG.CAMERA.height;
        this.camera.position.lerp(targetPos.clone().add(offset), 0.15);
        const lookTarget = this.playerModel.position.clone();
        lookTarget.y += 1.2;
        this.camera.lookAt(lookTarget);
    }

    _updateWeapon(dt) {
        this.weaponSystem.update(dt);
        const w = this.weaponSystem.getWeaponConfig();
        if (InputManager.fire || InputManager.firePressed) {
            if (w.auto || InputManager.firePressed) { this._fireWeapon(); }
            else if (w.auto) { this._fireWeapon(); }
        }
        if (InputManager.reloadPressed) { this.weaponSystem.startReload(); }
    }

    _fireWeapon() {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const muzzlePos = this.playerModel.position.clone();
        muzzlePos.y += 1.2;
        muzzlePos.add(camDir.clone().multiplyScalar(0.8));
        if (this.weaponSystem.recoilOffset > 0) { this.cameraPitch -= this.weaponSystem.recoilOffset; }
        this.weaponSystem.fire(muzzlePos, camDir);
    }

    _updateSkills(dt) {
        if (this.skillCooldown > 0) this.skillCooldown -= dt;
        if (this.skillActive) {
            this.skillTimer -= dt;
            if (this.skillTimer <= 0) this._endSkill();
        }
        if (InputManager.skillPressed && this.skillCooldown <= 0) this._activateSkill();
        if (this.isCloaked && !this.isDashing) {
            this.cloakTimer -= dt;
            if (this.cloakTimer <= 0) {
                this.isCloaked = false; this.player.isCloaked = false; this._setModelOpacity(1.0);
            }
        }
        if (this.shieldMesh && this.skillActive && this.charConfig.skill.type === 'shield') {
            this.shieldMesh.position.copy(this.playerModel.position);
            this.shieldMesh.position.y += 1;
            this.shieldMesh.rotation.y += dt * 0.5;
        }
    }

    _activateSkill() {
        const skill = this.charConfig.skill;
        this.skillCooldown = skill.cooldown;
        this.skillActive = true;
        this.skillTimer = skill.duration;
        switch (skill.type) {
            case 'dash':
                const moveInput = InputManager.getKeyboardMove() || InputManager.move;
                let dashDir;
                if (moveInput.x !== 0 || moveInput.y !== 0) {
                    const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
                    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
                    dashDir = new THREE.Vector3();
                    dashDir.addScaledVector(forward, moveInput.y);
                    dashDir.addScaledVector(right, moveInput.x);
                    dashDir.normalize();
                } else {
                    dashDir = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
                }
                this.dashVelocity = dashDir; this.dashTimer = skill.duration;
                this.isDashing = true; this.isCloaked = true; this.player.isCloaked = true;
                this._setModelOpacity(0.3); this.showNotify('PHASE DASH!');
                break;
            case 'shield':
                const shieldGeo = new THREE.SphereGeometry(1.8, 16, 12);
                const shieldMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.25, wireframe: true });
                this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
                this.shieldMesh.position.copy(this.playerModel.position);
                this.shieldMesh.position.y += 1;
                this.scene.add(this.shieldMesh);
                this.shield = skill.shieldHP;
                this.showNotify('BULWARK ACTIVE');
                break;
            case 'grenade':
                this._launchGrenade();
                this.skillActive = false; this.skillTimer = 0;
                break;
            case 'cloak':
                this.isCloaked = true; this.player.isCloaked = true;
                this.cloakTimer = skill.duration;
                this._setModelOpacity(0.15);
                this.showNotify('GHOST CLOAK');
                break;
        }
    }

    _endSkill() {
        this.skillActive = false; this.skillTimer = 0;
        if (this.shieldMesh) {
            this.scene.remove(this.shieldMesh);
            this.shieldMesh.geometry.dispose();
            this.shieldMesh.material.dispose();
            this.shieldMesh = null; this.shield = 0;
        }
    }

    _launchGrenade() {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const startPos = this.playerModel.position.clone();
        startPos.y += 1.2;
        startPos.add(camDir.clone().multiplyScalar(1));
        const grenadeGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const grenadeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const grenade = new THREE.Mesh(grenadeGeo, grenadeMat);
        grenade.position.copy(startPos);
        this.scene.add(grenade);
        const targetPos = startPos.clone().add(camDir.clone().multiplyScalar(15));
        targetPos.y = 0;
        const startTime = performance.now();
        const duration = 800;
        const self = this;
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const t = elapsed / duration;
            if (t >= 1) {
                self.scene.remove(grenade);
                grenade.geometry.dispose(); grenade.material.dispose();
                self.effects.spawnExplosion(targetPos, 1.5);
                const radius = self.charConfig.skill.radius;
                const damage = self.charConfig.skill.damage;
                for (const e of self.enemyManager.enemies) {
                    const dist = e.model.position.distanceTo(targetPos);
                    if (dist < radius) {
                        self.enemyManager.damageEnemy(e, damage * (1 - dist / radius), e.model.position.clone());
                    }
                }
                return;
            }
            grenade.position.lerpVectors(startPos, targetPos, t);
            grenade.position.y = startPos.y + 5 * Math.sin(t * Math.PI);
            requestAnimationFrame(animate);
        };
        animate();
        this.showNotify('NOVA BLAST!');
    }

    _setModelOpacity(opacity) {
        this.playerModel.traverse(obj => {
            if (obj.material) {
                obj.material.transparent = opacity < 1;
                obj.material.opacity = opacity;
            }
        });
    }

    _updateEnemies(dt) { this.enemyManager.update(dt, this.playerModel.position); }
    _updateEffects(dt) { this.effects.update(dt); }

    _updatePickups(dt) {
        const result = this.arena.updatePickups(dt, this.playerModel.position);
        if (result === 'health') { this.health = Math.min(this.maxHealth, this.health + 30); this.showNotify('+30 HEALTH'); }
        else if (result === 'ammo') { this.weaponSystem.addAmmo(60); this.showNotify('+AMMO'); }
    }

    _updateWaves(dt) {
        if (this.waitingForNextWave) {
            this.interWaveTimer -= dt;
            if (this.interWaveTimer <= 0) {
                this.waitingForNextWave = false;
                this.enemyManager.startWave(this.wave);
                this._showWaveAnnounce('WAVE ' + this.wave);
            }
        }
    }

    _updateHUD() {
        const healthPct = (this.health / this.maxHealth) * 100;
        document.getElementById('healthBar').style.width = healthPct + '%';
        document.getElementById('scorePanel').innerHTML = '<span class="label">SCORE</span><br>' + this.score;
        document.getElementById('wavePanel').innerHTML = '<span style="font-size:0.6em;color:#aaa;">WAVE</span><br>' + this.wave;
        document.getElementById('fpsPanel').textContent = this.fps + ' FPS';
        document.getElementById('ammoText').textContent = this.weaponSystem.getAmmo();
        document.getElementById('ammoMax').textContent = '/' + this.weaponSystem.getReserveAmmo();
        document.getElementById('weaponName').textContent = this.weaponSystem.getWeaponConfig().name;
        const skillBar = document.getElementById('skillBar');
        const skillLabel = document.getElementById('skillLabel');
        const skillBtn = document.getElementById('skillBtn');
        if (this.skillCooldown > 0) {
            const pct = (1 - this.skillCooldown / this.charConfig.skill.cooldown) * 100;
            skillBar.style.width = pct + '%';
            skillLabel.textContent = 'SKILL ' + Math.ceil(this.skillCooldown) + 's';
            skillBtn.classList.remove('ready');
        } else {
            skillBar.style.width = '100%';
            skillLabel.textContent = this.charConfig.skill.name + ' READY';
            skillBtn.classList.add('ready');
        }
    }

    _checkPause() { if (InputManager.pausePressed) this.togglePause(); }

    takeDamage(amount) {
        if (this.isDashing || this.isCloaked) return;
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, amount);
            this.shield -= absorbed; amount -= absorbed;
            if (this.shield <= 0) this._endSkill();
        }
        if (amount <= 0) return;
        this.health -= amount;
        this.lastDamageTime = performance.now() / 1000;
        const vignette = document.getElementById('damageVignette');
        vignette.style.opacity = '1';
        setTimeout(() => { vignette.style.opacity = '0'; }, 150);
        if (this.health <= 0) { this.health = 0; this._gameOver(); }
    }

    addScore(amount) { this.score += amount; }
    addKill() { this.kills++; }

    showHitMarker() {
        const marker = document.getElementById('hitMarker');
        marker.classList.add('show');
        setTimeout(() => marker.classList.remove('show'), 100);
    }

    showKillFeed(msg) {
        const feed = document.getElementById('killFeed');
        const div = document.createElement('div');
        div.className = 'killMsg';
        div.textContent = msg;
        feed.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    showNotify(msg) {
        const el = document.getElementById('notify');
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1500);
    }

    _showWaveAnnounce(text) {
        const el = document.getElementById('waveAnnounce');
        el.textContent = text;
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
    }

    spawnPickup(position) {
        const type = Math.random() < 0.5 ? 'health' : 'ammo';
        this.arena.spawnPickup(position, type);
    }

    onWaveCleared() {
        this.wave++;
        this.waitingForNextWave = true;
        this.interWaveTimer = CONFIG.WAVES.interWaveDelay;
        this.showNotify('WAVE CLEARED! Next wave in ' + CONFIG.WAVES.interWaveDelay + 's');
        this.score += 500;
    }

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pauseScreen').style.display = this.paused ? 'flex' : 'none';
    }

    _gameOver() {
        this.running = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('finalKills').textContent = this.kills;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    destroy() {
        this.running = false;
        if (this.enemyManager) this.enemyManager.clearAll();
        if (this.effects) this.effects.clear();
        if (this.arena) this.arena.clearPickups();
        if (this.shieldMesh) { this.scene.remove(this.shieldMesh); this.shieldMesh = null; }
        if (this.playerModel) { this.scene.remove(this.playerModel); this.playerModel = null; }
        if (this.renderer) this.renderer.dispose();
    }

    onResize() {
        if (this.camera) { this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); }
        if (this.renderer) this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}