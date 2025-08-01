document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // --- Game Constants ---
    const GRID_WIDTH = 20;
    const GRID_HEIGHT = 20;

    const COLORS = [
        { name: 'Violet', hex: '#9400D3' },
        { name: 'Indigo', hex: '#4B0082' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Green', hex: '#00FF00' },
        { name: 'Yellow', hex: '#FFFF00' },
        { name: 'Orange', hex: '#FF7F00' },
        { name: 'Red', hex: '#FF0000' },
        { name: 'White', hex: '#FFFFFF' }
    ];

    const TETROMINOES = {
        'I': [[1, 1, 1, 1]],
        'J': [[1, 0, 0], [1, 1, 1]],
        'L': [[0, 0, 1], [1, 1, 1]],
        'O': [[1, 1], [1, 1]],
        'S': [[0, 1, 1], [1, 1, 0]],
        'T': [[0, 1, 0], [1, 1, 1]],
        'Z': [[1, 1, 0], [0, 1, 1]]
    };
    const PIECES = 'IJLOSTZ';

    // --- DOM Elements ---
    const homeScreen = document.getElementById('home-screen');
    const btnStart = document.getElementById('btn-start');
    const gameOverScreen = document.getElementById('game-over-screen');
    const btnRestart = document.getElementById('btn-restart');
    const btnGameOverHome = document.getElementById('btn-game-over-home');
    const finalScoreEl = document.getElementById('final-score');
    const btnPause = document.getElementById('btn-pause');
    const pauseScreen = document.getElementById('pause-screen');
    const btnResume = document.getElementById('btn-resume');
    const btnPauseHome = document.getElementById('btn-pause-home');
    const btnPauseRestart = document.getElementById('btn-pause-restart');
    const currentScoreEl = document.getElementById('current-score');
    const highScoreEl = document.getElementById('high-score');
    const btnOpenColorPicker = document.getElementById('btn-open-color-picker');
    const colorPickerModal = document.getElementById('color-picker-modal');
    const colorPalette = document.getElementById('color-palette');

    // --- Game State ---
    let grid;
    let activePiece;
    let blockColor;
    let score;
    let highScore;
    let gameOver;
    let isPaused;
    let animationFrameId;
    let isFlipped = false;
    let scoreSinceLastFlip = 0;

    // --- Sizing ---
    let boardSize;
    let cellSize;
    let boardOffset;

    // --- Game Loop Timing ---
    let lastTime = 0;
    let dropCounter = 0;
    let dropInterval = 1000; // 1 second

    function setupCanvas() {
        const appContainer = document.getElementById('app-container');
        const containerRect = appContainer.getBoundingClientRect();
        canvas.width = containerRect.width;
        canvas.height = containerRect.height;

        const headerHeight = containerRect.height * 0.1;
        const controlsHeight = containerRect.height * 0.25;
        const gameAreaHeight = canvas.height - headerHeight - controlsHeight;
        
        // Define padding for the grid
        const GRID_PADDING_X = 20; // Padding from left and right
        const GRID_PADDING_BOTTOM = 50; // Increased padding from bottom

        const gameAreaWidth = canvas.width - (GRID_PADDING_X * 2); // Subtract padding from width
        const gameAreaHeightWithPadding = gameAreaHeight - GRID_PADDING_BOTTOM; // Subtract padding from height

        const boardPixelSize = Math.min(gameAreaWidth, gameAreaHeightWithPadding);

        cellSize = boardPixelSize / GRID_WIDTH;
        boardSize = { width: boardPixelSize, height: boardPixelSize };
        boardOffset = {
            x: GRID_PADDING_X + (gameAreaWidth - boardPixelSize) / 2, // Center horizontally with padding
            y: headerHeight + (gameAreaHeightWithPadding - boardPixelSize) / 2 // Center vertically with padding
        };

    }

    function init() {
        grid = Array(GRID_HEIGHT).fill(0).map(() => Array(GRID_WIDTH).fill(0));
        pauseScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        score = 0;
        isPaused = false;
        gameOver = false;
        isFlipped = false;
        scoreSinceLastFlip = 0;
        let highScoreFromStorage = localStorage.getItem('tetrisHighScore');
        highScore = parseInt(highScoreFromStorage || '0', 10);
        highScoreEl.textContent = highScore;
        currentScoreEl.textContent = score;
        lastTime = 0;
        dropInterval = 1000;
        setupCanvas();
    }

    function updateStatus() {
        currentScoreEl.textContent = score;
        if (score > highScore) {
            highScoreEl.textContent = score;
        }
    }

    // --- Drawing Functions ---

    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();
        drawBlocks();
        drawGhostPiece();
    }

    function roundRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        return ctx;
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_WIDTH; i++) {
            ctx.beginPath();
            ctx.moveTo(boardOffset.x + i * cellSize, boardOffset.y);
            ctx.lineTo(boardOffset.x + i * cellSize, boardOffset.y + boardSize.height);
            ctx.stroke();
        }
        for (let i = 0; i <= GRID_HEIGHT; i++) {
            ctx.beginPath();
            ctx.moveTo(boardOffset.x, boardOffset.y + i * cellSize);
            ctx.lineTo(boardOffset.x + boardSize.width, boardOffset.y + i * cellSize);
            ctx.stroke();
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        roundRect(ctx, boardOffset.x, boardOffset.y, boardSize.width, boardSize.height, 10);
        ctx.stroke();
    }

    function drawBlocks() {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value === 1) {
                    const blockX = boardOffset.x + x * cellSize;
                    const blockY = boardOffset.y + y * cellSize;
                    ctx.fillStyle = blockColor;
                    ctx.fillRect(blockX, blockY, cellSize, cellSize);
                    ctx.strokeRect(blockX, blockY, cellSize, cellSize);
                }
            });
        });
        if (activePiece) {
            activePiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value === 1) {
                        const blockX = boardOffset.x + (activePiece.x + x) * cellSize;
                        const blockY = boardOffset.y + (activePiece.y + y) * cellSize;
                        ctx.fillStyle = blockColor;
                        ctx.fillRect(blockX, blockY, cellSize, cellSize);
                        ctx.strokeRect(blockX, blockY, cellSize, cellSize);
                    }
                });
            });
        }
    }

    function drawGhostPiece() {
        if (!activePiece) return;
        const ghost = { ...activePiece };
        const down = isFlipped ? -1 : 1;
        while (isValidMove(ghost.shape, ghost.x, ghost.y + down)) {
            ghost.y += down;
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ghost.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value === 1) {
                    ctx.strokeRect(
                        boardOffset.x + (ghost.x + x) * cellSize,
                        boardOffset.y + (ghost.y + y) * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            });
        });
    }

    

    // --- Game Logic ---

    function spawnNewPiece() {
        const type = PIECES[Math.floor(Math.random() * PIECES.length)];
        const shape = TETROMINOES[type];
        const y = isFlipped ? GRID_HEIGHT - shape.length : 0;
        return { shape, x: Math.floor(GRID_WIDTH / 2) - Math.floor(shape[0].length / 2), y };
    }

    function getNextPiece() {
        activePiece = spawnNewPiece();
        if (!isValidMove(activePiece.shape, activePiece.x, activePiece.y)) {
            gameOver = true;
            activePiece = null;
        }
    }

    function isValidMove(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    const newX = x + col;
                    const newY = y + row;
                    if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
                        return false;
                    }
                    if (grid[newY] && grid[newY][newX] === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function movePiece(dx, dy) {
        if (gameOver || !activePiece) return;
        if (isValidMove(activePiece.shape, activePiece.x + dx, activePiece.y + dy)) {
            activePiece.x += dx;
            activePiece.y += dy;
            return true;
        }
        return false;
    }

    function hardDrop() {
        if (gameOver || !activePiece) return;
        const down = isFlipped ? -1 : 1;
        while (movePiece(0, down)) { /* keep moving */ }
        lockPiece();
    }

    function rotatePiece() {
        if (gameOver || !activePiece) return;
        const shape = activePiece.shape;
        const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        let kick = 0;
        if (!isValidMove(newShape, activePiece.x, activePiece.y)) {
            kick = activePiece.x > GRID_WIDTH / 2 ? -1 : 1;
            if (!isValidMove(newShape, activePiece.x + kick, activePiece.y)) {
                kick = kick * -2;
                if (!isValidMove(newShape, activePiece.x + kick, activePiece.y)) {
                    return;
                }
            }
        }
        activePiece.x += kick;
        activePiece.shape = newShape;
    }

    function lockPiece() {
        if (!activePiece) return;
        activePiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value === 1) {
                    if (activePiece.y + y >= 0 && activePiece.y + y < GRID_HEIGHT) {
                        grid[activePiece.y + y][activePiece.x + x] = 1;
                    }
                }
            });
        });
        clearLines();
        getNextPiece();
        dropInterval = 1000;
    }

    function clearLines() {
        let linesCleared = 0;
        for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (grid[y].every(value => value === 1)) {
                linesCleared++;
                grid.splice(y, 1);
                grid.unshift(Array(GRID_WIDTH).fill(0));
                y++;
            }
        }
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800];
            score += points[linesCleared];
            scoreSinceLastFlip += points[linesCleared];
            updateStatus();
            if (scoreSinceLastFlip >= 100) {
                flipBoard();
                scoreSinceLastFlip = 0;
            }
        }
    }

    function flipBoard() {
        isFlipped = !isFlipped;
        grid.reverse();

        // Only clear the top 4 rows if the board is returning to its original orientation
        // These correspond to the original bottom 4 rows.
        if (!isFlipped) { 
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    grid[y][x] = 0;
                }
            }
        }

        // Reset active and next pieces to ensure fresh spawn after flip
        activePiece = null;
        nextPiece = null;
        getNextPiece(); // Spawn a new piece immediately after flip

        const currentColorIndex = COLORS.findIndex(c => c.hex === blockColor);
        let nextColorIndex = (currentColorIndex + 1) % COLORS.length;
        if (COLORS[nextColorIndex].hex === blockColor && COLORS.length > 1) {
            nextColorIndex = (nextColorIndex + 1) % COLORS.length;
        }
        blockColor = COLORS[nextColorIndex].hex;
        btnOpenColorPicker.style.backgroundColor = blockColor;
        const swatches = colorPalette.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color === blockColor);
        });
        applyGravityToGrid();
        draw(); // Redraw the canvas after applying gravity
    }

    function applyGravityToGrid() {
        if (!isFlipped) { // Normal gravity (blocks fall down)
            for (let y = GRID_HEIGHT - 2; y >= 0; y--) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (grid[y][x] === 1) {
                        let currentY = y;
                        while (currentY + 1 < GRID_HEIGHT && grid[currentY + 1][x] === 0) {
                            grid[currentY + 1][x] = 1;
                            grid[currentY][x] = 0;
                            currentY++;
                        }
                    }
                }
            }
        } else { // Flipped gravity (blocks fall up)
            for (let y = 1; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (grid[y][x] === 1) {
                        let currentY = y;
                        while (currentY - 1 >= 0 && grid[currentY - 1][x] === 0) {
                            grid[currentY - 1][x] = 1;
                            grid[currentY][x] = 0;
                            currentY--;
                        }
                    }
                }
            }
        }
    }

    function renderColorPalette() {
        colorPalette.innerHTML = '';
        COLORS.forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'color-swatch';
            swatch.dataset.color = color.hex;
            swatch.style.backgroundColor = color.hex;
            swatch.setAttribute('aria-label', color.name);
            colorPalette.appendChild(swatch);
        });
    }

    function initializeColorPalette() {
        renderColorPalette();
        const savedColor = localStorage.getItem('tetrisBlockColor') || '#FFFFFF';
        blockColor = savedColor;
        btnOpenColorPicker.style.backgroundColor = savedColor;
        const swatches = colorPalette.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color === savedColor);
        });
    }

    function goToHomeScreen() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        isPaused = false;
        gameOver = true;
        pauseScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        homeScreen.classList.remove('hidden');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function togglePause() {
        if (gameOver) return;
        isPaused = !isPaused;
        pauseScreen.classList.toggle('hidden', !isPaused);
        if (isPaused) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            draw();
        } else {
            lastTime = performance.now();
            gameLoop();
        }
    }

    function startGame() {
        homeScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        init();
        getNextPiece();
        gameLoop();
    }

    function endGame() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('tetrisHighScore', highScore);
        }
        finalScoreEl.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    function handleKeyDown(e) {
        if (gameOver) {
            if (e.key === 'Enter') startGame();
            return;
        }
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
            return;
        }
        if (isPaused) return;

        const down = isFlipped ? -1 : 1;

        switch (e.key) {
            case 'ArrowLeft': movePiece(-1, 0); break;
            case 'ArrowRight': movePiece(1, 0); break;
            case 'ArrowDown':
                if (isFlipped) { // If flipped, ArrowDown rotates
                    rotatePiece();
                } else { // If not flipped, ArrowDown moves down
                    if (!movePiece(0, down)) {
                        lockPiece();
                    }
                }
                break;
            case 'ArrowUp':
                if (isFlipped) { // If flipped, ArrowUp moves up (in the flipped context)
                    if (!movePiece(0, down)) { // down will be -1 when isFlipped is true
                        lockPiece();
                    }
                } else { // If not flipped, ArrowUp rotates
                    rotatePiece();
                }
                break;
            case ' ': e.preventDefault(); hardDrop(); break;
        }
    }

    function setupMobileControls() {
        const addListener = (element, action) => {
            if (!element) return;
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (gameOver) { startGame(); return; }
                if (isPaused) { return; }
                action();
            });
        };
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnRotate = document.getElementById('btn-rotate');
        const btnDown = document.getElementById('btn-down');
        const btnHardDrop = document.getElementById('btn-hard-drop');

        addListener(btnLeft, () => movePiece(-1, 0));
        addListener(btnRight, () => movePiece(1, 0));
        addListener(btnRotate, () => {
            if (isFlipped) { // If flipped, btnRotate (ArrowUp) moves up (in flipped context)
                const down = -1;
                if (!movePiece(0, down)) { // down will be -1
                    lockPiece();
                }
            } else { // If not flipped, btnRotate (ArrowUp) rotates
                rotatePiece();
            }
        });
        addListener(btnDown, () => {
            const down = isFlipped ? -1 : 1;
            if (isFlipped) { // If flipped, btnDown (ArrowDown) rotates
                rotatePiece();
            } else { // If not flipped, btnDown (ArrowDown) moves down
                if (!movePiece(0, down)) {
                    lockPiece();
                }
            }
        });
        addListener(btnHardDrop, hardDrop);
    }

    function gameLoop(time = 0) {
        if (gameOver) {
            draw();
            endGame();
            return;
        }
        const deltaTime = time - lastTime;
        lastTime = time;
        const down = isFlipped ? -1 : 1;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            if (!movePiece(0, down)) {
                lockPiece();
            }
            dropCounter = 0;
        }
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Initialization ---
    btnStart.addEventListener('click', startGame);
    btnPause.addEventListener('click', togglePause);
    btnRestart.addEventListener('click', startGame);
    btnResume.addEventListener('click', togglePause);
    btnPauseRestart.addEventListener('click', startGame);
    btnGameOverHome.addEventListener('click', goToHomeScreen);
    btnPauseHome.addEventListener('click', goToHomeScreen);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', () => {
        setupCanvas();
        draw();
    });
    setupMobileControls();
    btnOpenColorPicker.addEventListener('click', () => {
        colorPickerModal.classList.remove('hidden');
    });
    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-swatch')) {
            const selectedColor = e.target.dataset.color;
            blockColor = selectedColor;
            localStorage.setItem('tetrisBlockColor', selectedColor);
            btnOpenColorPicker.style.backgroundColor = selectedColor;
            colorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');
            colorPickerModal.classList.add('hidden');
        }
    });

    initializeColorPalette();
    document.fonts.ready.then(() => {
        setupCanvas();
        draw();
    });
});
