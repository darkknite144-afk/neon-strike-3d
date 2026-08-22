// ============================================================
// Main.js - Entry point, loading screen, character select, game loop
// ============================================================
const App = {
    game: null,
    selectedCharId: null,
    loadingProgress: 0,

    init() {
        this._updateLoading(10, 'Loading Three.js engine...');

        if (typeof THREE === 'undefined') {
            this._loadThreeFromCDN();
            return;
        }

        this._onThreeReady();
    },

    _loadThreeFromCDN() {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => this._onThreeReady();
        script.onerror = () => {
            document.getElementById('loadingText').textContent = 'ERROR: Cannot load Three.js. Check your connection.';
        };
        document.head.appendChild(script);
    },

    _onThreeReady() {
        this._updateLoading(40, 'Building game assets...');

        setTimeout(() => {
            this._updateLoading(70, 'Preparing operatives...');
            setTimeout(() => {
                this._updateLoading(100, 'Ready');
                setTimeout(() => this._showCharSelect(), 300);
            }, 300);
        }, 200);
    },

    _updateLoading(pct, text) {
        this.loadingProgress = pct;
        document.getElementById('loadingFill').style.width = pct + '%';
        if (text) document.getElementById('loadingText').textContent = text;
    },

    _showCharSelect() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('charSelect').style.display = 'flex';

        const grid = document.getElementById('charGrid');
        grid.innerHTML = '';

        for (const char of CHARACTER_LIST) {
            const card = document.createElement('div');
            card.className = 'charCard';
            card.dataset.charId = char.id;

            const avatarColor = '#' + char.colorScheme.primary.toString(16).padStart(6, '0');
            card.innerHTML = `
                <div class="charAvatar" style="background: ${avatarColor}33; border: 2px solid ${avatarColor};">${char.icon}</div>
                <div class="charName" style="color: ${avatarColor};">${char.name}</div>
                <div class="charSkill">${char.skill.name}</div>
                <div class="charDesc">${char.description}</div>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.charCard').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharId = char.id;
                document.getElementById('startGameBtn').disabled = false;
            });

            grid.appendChild(card);
        }

        document.getElementById('startGameBtn').addEventListener('click', () => {
            if (this.selectedCharId) this._startGame();
        });
    },

    _startGame() {
        document.getElementById('charSelect').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('mobileControls').style.display = 'block';
        document.getElementById('pauseBtn').style.display = 'flex';

        this.game = new Game();
        this.game.init(this.selectedCharId);

        document.getElementById('resumeBtn').onclick = () => this.game.togglePause();
        document.getElementById('quitBtn').onclick = () => this._quitToMenu();
        document.getElementById('restartBtn').onclick = () => this._restart();

        this._gameLoop();
    },

    _gameLoop() {
        if (this.game) {
            this.game.update();
            requestAnimationFrame(() => this._gameLoop());
        }
    },

    _quitToMenu() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'none';
        this._showCharSelect();
    },

    _restart() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'none';
        this._showCharSelect();
    },
};

// Boot
window.addEventListener('load', () => {
    App.init();
    window.addEventListener('resize', () => {
        if (App.game) App.game.onResize();
    });
});