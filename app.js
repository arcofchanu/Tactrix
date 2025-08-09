// Enhanced Mobile-Optimized Tetris Configuration
const CONFIG = {
    boardWidth: 20,
    boardHeight: 20,
    cellSize: 25,
    initialLevel: 1,
    linesPerLevel: 10,
    initialDropTime: 800,
    targetFPS: 60
};

// Strict Monochrome Theme configuration
const THEMES = {
    light: {
        canvasBackground: '#ffffff',
        pieceColor: '#000000',
        gridColor: '#000000',
        borderColor: '#000000'
    },
    dark: {
        canvasBackground: '#000000',
        pieceColor: '#ffffff',
        gridColor: '#ffffff',
        borderColor: '#ffffff'
    }
};

// Enhanced Mobile Gesture Configuration
const GESTURE_CONFIG = {
    swipeThreshold: 30,
    tapTimeout: 200,
    longPressTimeout: 600,
    doubleTapTimeout: 300,
    quickSwipeThreshold: 120,
    minSwipeVelocity: 0.5,
    maxTapDistance: 25
};

// Tetromino shapes
const TETROMINOES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]]
};

// Enhanced scoring system
const SCORING = {
    single: 100,
    double: 300,
    triple: 500,
    tetris: 800,
    softDrop: 1,
    hardDrop: 2
};

// Game state variables
let gameState = 'start';
let currentTheme = 'light';
let board = [];
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let score = 0;
let level = 1;
let lines = 0;
let dropTime = CONFIG.initialDropTime;
let lastTime = 0;
let isFlipping = false;
let animationId = null;
let currentCellSize = CONFIG.cellSize;

// Canvas elements
let gameCanvas, nextCanvas, mobileNextCanvas, holdCanvas;
let gameCtx, nextCtx, mobileNextCtx, holdCtx;

// Enhanced touch handling
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let longPressTimer = null;
let lastTapTime = 0;
let touchCount = 0;
let isLongPressTriggered = false;
let isPauseResuming = false;

// Device and performance tracking
let devicePixelRatio = window.devicePixelRatio || 1;
let isInitialized = false;

// Enhanced device detection
function detectDevice() {
    const width = window.innerWidth;
    const isTouchDevice = 'ontouchstart' in window;
    
    if (width <= 480) return { type: 'mobile', size: 'small', touch: isTouchDevice };
    if (width <= 768) return { type: 'mobile', size: 'large', touch: isTouchDevice };
    if (width <= 1024) return { type: 'tablet', size: 'standard', touch: isTouchDevice };
    return { type: 'desktop', size: 'standard', touch: isTouchDevice };
}

// Controls Modal Management
function showControlsModal() {
    console.log('Showing controls modal...');
    
    const modal = document.getElementById('controls-modal');
    const mobileControls = document.getElementById('mobile-controls');
    const desktopControls = document.getElementById('desktop-controls');
    
    if (!modal || !mobileControls || !desktopControls) {
        console.error('Modal elements not found');
        return;
    }
    
    // Detect viewport width to show appropriate controls
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        mobileControls.style.display = 'block';
        desktopControls.style.display = 'none';
        console.log('Showing mobile controls');
    } else {
        mobileControls.style.display = 'none';
        desktopControls.style.display = 'block';
        console.log('Showing desktop controls');
    }
    
    modal.classList.remove('hidden');
}

function hideControlsModal() {
    console.log('Hiding controls modal...');
    
    const modal = document.getElementById('controls-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Fixed theme management
function initTheme() {
    console.log('Initializing theme system...');
    
    const themeSwitch = document.getElementById('theme-switch');
    const html = document.documentElement;
    
    if (!themeSwitch) {
        console.error('Theme switch not found');
        return;
    }
    
    // Set initial theme
    html.setAttribute('data-color-scheme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';
    
    // Fixed theme switch event listener
    function handleThemeChange(e) {
        console.log('Theme switch clicked');
        e.stopPropagation();
        
        currentTheme = themeSwitch.checked ? 'dark' : 'light';
        html.setAttribute('data-color-scheme', currentTheme);
        
        console.log('Theme changed to:', currentTheme);
        
        // Update canvas immediately if in game
        if (gameState === 'playing' || gameState === 'pause') {
            setTimeout(() => {
                draw();
                drawNextPiece();
                drawHoldPiece();
            }, 50);
        }
    }
    
    themeSwitch.addEventListener('change', handleThemeChange);
    console.log('Theme system initialized successfully');
}

function getThemeColors() {
    return THEMES[currentTheme];
}

// Enhanced initialization
function init() {
    console.log('Initializing mobile-optimized Tetris...');
    
    if (isInitialized) {
        console.log('Already initialized, skipping...');
        return;
    }
    
    // Get canvas elements
    gameCanvas = document.getElementById('game-canvas');
    nextCanvas = document.getElementById('next-canvas');
    mobileNextCanvas = document.getElementById('mobile-next-canvas');
    holdCanvas = document.getElementById('hold-canvas');
    
    if (!gameCanvas) {
        console.error('Critical: Game canvas not found!');
        return;
    }
    
    // Get contexts
    gameCtx = gameCanvas.getContext('2d');
    if (nextCanvas) nextCtx = nextCanvas.getContext('2d');
    if (mobileNextCanvas) mobileNextCtx = mobileNextCanvas.getContext('2d');
    if (holdCanvas) holdCtx = holdCanvas.getContext('2d');

    // Initialize systems in order
    initTheme();
    setupCanvas();
    initializeBoard();
    setupEventListeners();
    setupEnhancedGestureControls();
    
    // Show start screen
    showScreen('start');
    
    // Handle orientation and resize
    const handleResize = debounce(() => {
        setupCanvas();
        if (gameState === 'playing' || gameState === 'pause') {
            draw();
            drawNextPiece();
            drawHoldPiece();
        }
    }, 150);
    
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
    });
    
    window.addEventListener('resize', handleResize);
    
    isInitialized = true;
    console.log('Initialization complete');
}

// Enhanced canvas setup
function setupCanvas() {
    if (!gameCanvas || !gameCtx) {
        console.error('Canvas setup failed: missing elements');
        return;
    }
    
    const device = detectDevice();
    console.log('Setting up canvas for device:', device);
    
    // Mobile-first responsive canvas sizing
    if (device.type === 'mobile' || device.type === 'tablet') {
        const padding = device.type === 'mobile' ? 24 : 32;
        const maxWidth = Math.min(window.innerWidth - padding, 500);
        const maxHeight = window.innerHeight - (device.type === 'mobile' ? 140 : 160);
        const aspectRatio = CONFIG.boardHeight / CONFIG.boardWidth;
        
        let canvasWidth = maxWidth;
        let canvasHeight = canvasWidth * aspectRatio;
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight / aspectRatio;
        }
        
        // Ensure minimum playable size
        const minSize = device.size === 'small' ? 280 : 320;
        if (canvasWidth < minSize) {
            canvasWidth = minSize;
            canvasHeight = canvasWidth * aspectRatio;
        }
        
        gameCanvas.style.width = canvasWidth + 'px';
        gameCanvas.style.height = canvasHeight + 'px';
        
        // High DPI support
        const pixelRatio = Math.min(devicePixelRatio, 2);
        gameCanvas.width = canvasWidth * pixelRatio;
        gameCanvas.height = canvasHeight * pixelRatio;
        gameCtx.scale(pixelRatio, pixelRatio);
        
        currentCellSize = canvasWidth / CONFIG.boardWidth;
        
        console.log(`Mobile canvas: ${canvasWidth}x${canvasHeight}, cell: ${currentCellSize}`);
    } else {
        // Desktop fixed size
        gameCanvas.width = CONFIG.boardWidth * CONFIG.cellSize;
        gameCanvas.height = CONFIG.boardHeight * CONFIG.cellSize;
        gameCanvas.style.width = '500px';
        gameCanvas.style.height = '500px';
        currentCellSize = CONFIG.cellSize;
        
        console.log('Desktop canvas: 500x500');
    }
    
    // Canvas context settings
    gameCtx.imageSmoothingEnabled = false;
}

function initializeBoard() {
    board = Array(CONFIG.boardHeight).fill().map(() => Array(CONFIG.boardWidth).fill(0));
    console.log('Board initialized:', `${CONFIG.boardHeight}×${CONFIG.boardWidth}`);
}

// Fixed event listeners setup
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Start Game Button
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('START GAME clicked!');
            startGame();
        });
        console.log('Play button listener added');
    }
    
    // Controls Button and Modal
    const controlsBtn = document.getElementById('controls-btn');
    if (controlsBtn) {
        controlsBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('CONTROLS button clicked!');
            showControlsModal();
        });
        console.log('Controls button listener added');
    }
    
    // Modal close handlers
    const closeBtn = document.getElementById('controls-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Close button clicked!');
            hideControlsModal();
        });
        console.log('Close button listener added');
    }
    
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Backdrop clicked!');
            hideControlsModal();
        });
        console.log('Backdrop listener added');
    }
    
    // Game control buttons
    const gameButtons = [
        { id: 'pause-btn', handler: togglePause },
        { id: 'restart-btn', handler: restartGame },
        { id: 'home-btn', handler: goHome },
        { id: 'resume-btn', handler: togglePause },
        { id: 'pause-restart-btn', handler: restartGame },
        { id: 'pause-home-btn', handler: goHome },
        { id: 'gameover-restart-btn', handler: startGame },
        { id: 'gameover-home-btn', handler: goHome }
    ];
    
    gameButtons.forEach(({ id, handler }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
            console.log('Event listener added for:', id);
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('controls-modal');
            if (modal && !modal.classList.contains('hidden')) {
                hideControlsModal();
            }
        }
    });
    
    // Mobile prevention
    document.addEventListener('touchmove', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
    
    console.log('Event listeners setup complete');
}

// Enhanced gesture controls
function setupEnhancedGestureControls() {
    console.log('Setting up gesture controls...');
    
    const touchOverlay = document.getElementById('touch-overlay');
    const gestureTargets = [touchOverlay, gameCanvas].filter(el => el);
    
    gestureTargets.forEach(target => {
        if (target) {
            target.addEventListener('touchstart', handleGestureStart, { passive: false });
            target.addEventListener('touchmove', handleGestureMove, { passive: false });
            target.addEventListener('touchend', handleGestureEnd, { passive: false });
            target.addEventListener('touchcancel', handleGestureCancel, { passive: false });
        }
    });
    
    console.log('Gesture controls setup complete');
}

// Fixed gesture handling with better pause/resume logic
function handleGestureStart(event) {
    event.preventDefault();
    
    if (isFlipping || isPauseResuming) return;
    
    // Clear any existing timer first
    clearLongPressTimer();
    
    touchCount = event.touches.length;
    isLongPressTriggered = false;
    
    if (event.touches.length === 1 && (gameState === 'playing' || gameState === 'pause')) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        
        // Set long press timer for pause/resume
        longPressTimer = setTimeout(() => {
            if ((gameState === 'playing' || gameState === 'pause') && !isLongPressTriggered && !isPauseResuming) {
                isLongPressTriggered = true;
                isPauseResuming = true;
                
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                console.log('Long press detected, toggling pause');
                togglePause();
                
                // Reset flags after brief delay
                setTimeout(() => {
                    isPauseResuming = false;
                    isLongPressTriggered = false;
                }, 200);
            }
            longPressTimer = null;
        }, GESTURE_CONFIG.longPressTimeout);
    } else if (event.touches.length === 2) {
        clearLongPressTimer();
    }
}

function handleGestureMove(event) {
    event.preventDefault();
    
    if (longPressTimer && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        // Clear long press if finger moved significantly
        if (deltaX > 10 || deltaY > 10) {
            clearLongPressTimer();
        }
    }
}

function handleGestureEnd(event) {
    event.preventDefault();
    
    if (gameState !== 'playing' || isFlipping || isLongPressTriggered || isPauseResuming) {
        clearLongPressTimer();
        return;
    }
    
    clearLongPressTimer();
    
    const currentTime = Date.now();
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = currentTime - touchStartTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Two-finger tap for counter-clockwise rotation
    if (touchCount === 2 && deltaTime < GESTURE_CONFIG.tapTimeout && distance < GESTURE_CONFIG.maxTapDistance) {
        rotatePiece(true);
        if (navigator.vibrate) {
            navigator.vibrate(25);
        }
        return;
    }
    
    // Single finger gestures
    if (touchCount === 1) {
        if (distance > GESTURE_CONFIG.swipeThreshold && velocity > GESTURE_CONFIG.minSwipeVelocity) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    movePiece(1, 0);
                } else {
                    movePiece(-1, 0);
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    if (Math.abs(deltaY) > GESTURE_CONFIG.quickSwipeThreshold && deltaTime < 200) {
                        hardDrop();
                        if (navigator.vibrate) {
                            navigator.vibrate(30);
                        }
                    } else {
                        if (movePiece(0, 1)) {
                            score += SCORING.softDrop;
                            updateDisplay();
                        }
                    }
                } else {
                    holdCurrentPiece();
                }
            }
        }
        else if (distance < GESTURE_CONFIG.maxTapDistance && deltaTime < GESTURE_CONFIG.tapTimeout) {
            if (currentTime - lastTapTime < GESTURE_CONFIG.doubleTapTimeout) {
                rotatePiece(false);
            } else {
                rotatePiece(false);
                if (navigator.vibrate) {
                    navigator.vibrate(20);
                }
            }
            lastTapTime = currentTime;
        }
    }
    
    touchCount = 0;
}

function handleGestureCancel(event) {
    event.preventDefault();
    clearLongPressTimer();
    touchCount = 0;
    isLongPressTriggered = false;
    isPauseResuming = false;
}

// Helper function to clear long press timer
function clearLongPressTimer() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function handleKeyPress(event) {
    if (gameState !== 'playing' || isFlipping || isPauseResuming) return;

    switch(event.code) {
        case 'ArrowLeft':
            event.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            event.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            event.preventDefault();
            if (movePiece(0, 1)) {
                score += SCORING.softDrop;
                updateDisplay();
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            rotatePiece(false);
            break;
        case 'KeyZ':
            event.preventDefault();
            rotatePiece(true);
            break;
        case 'KeyC':
        case 'KeyH':
            event.preventDefault();
            holdCurrentPiece();
            break;
        case 'Space':
            event.preventDefault();
            hardDrop();
            break;
        case 'KeyP':
        case 'Escape':
            event.preventDefault();
            if (!isPauseResuming) {
                isPauseResuming = true;
                togglePause();
                setTimeout(() => {
                    isPauseResuming = false;
                }, 200);
            }
            break;
    }
}

function showScreen(screenName) {
    console.log('Showing screen:', screenName);
    
    // Clear any animation frame immediately
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenName + '-screen');
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        console.log('Screen shown successfully:', screenName);
    } else {
        console.error('Screen not found:', screenName + '-screen');
    }
    
    // Touch overlay management
    const touchOverlay = document.getElementById('touch-overlay');
    const device = detectDevice();
    if (touchOverlay) {
        if (screenName === 'game' && (device.type === 'mobile' || device.type === 'tablet')) {
            touchOverlay.classList.remove('hidden');
        } else {
            touchOverlay.classList.add('hidden');
        }
    }
}

function startGame() {
    console.log('Starting game...');
    
    try {
        // Clear any existing animation loops
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Initialize game state
        initializeBoard();
        score = 0;
        level = 1;
        lines = 0;
        dropTime = CONFIG.initialDropTime;
        lastTime = 0;
        isFlipping = false;
        holdPiece = null;
        canHold = true;
        isPauseResuming = false;
        
        // Create first pieces
        nextPiece = createRandomPiece();
        spawnNewPiece();
        
        // Setup display
        gameState = 'playing';
        showScreen('game');
        setupCanvas();
        updateDisplay();
        drawNextPiece();
        drawHoldPiece();
        
        // Draw initial state
        draw();
        
        // Start the game loop with proper timing
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        
        console.log('Game started successfully, animationId:', animationId);
        
    } catch (error) {
        console.error('Error starting game:', error);
    }
}

function restartGame() {
    console.log('Restarting game...');
    
    // Clear timers and flags
    clearLongPressTimer();
    isPauseResuming = false;
    
    startGame();
}

function goHome() {
    console.log('Going to home screen...');
    
    // Clear timers and flags
    clearLongPressTimer();
    isPauseResuming = false;
    
    showScreen('start');
    gameState = 'start';
}

// Fixed pause/resume functionality
function togglePause() {
    console.log('Toggle pause called, current state:', gameState);
    
    if (gameState === 'playing') {
        console.log('Pausing game...');
        
        // Cancel the current animation frame
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Set state and show pause screen
        gameState = 'pause';
        showScreen('pause');
        
        console.log('Game paused successfully');
        
    } else if (gameState === 'pause') {
        console.log('Resuming game...');
        
        // Ensure no conflicting animation frames exist
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Reset timing to prevent time jumps
        lastTime = performance.now();
        
        // Set state and show game screen
        gameState = 'playing';
        showScreen('game');
        
        // Restart the game loop
        animationId = requestAnimationFrame(gameLoop);
        
        console.log('Game resumed successfully, animationId:', animationId);
    }
}

// Game logic functions
function createRandomPiece() {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        type: randomPiece,
        shape: JSON.parse(JSON.stringify(TETROMINOES[randomPiece])),
        x: Math.floor(CONFIG.boardWidth / 2) - 1,
        y: 0,
        rotation: 0
    };
}

function spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = createRandomPiece();
    canHold = true;
    
    if (currentPiece && checkCollision(currentPiece, 0, 0)) {
        gameOver();
        return;
    }
    
    drawNextPiece();
}

function holdCurrentPiece() {
    if (!canHold || !currentPiece) return;
    
    if (holdPiece === null) {
        holdPiece = {
            type: currentPiece.type,
            shape: JSON.parse(JSON.stringify(TETROMINOES[currentPiece.type]))
        };
        spawnNewPiece();
    } else {
        const temp = holdPiece;
        holdPiece = {
            type: currentPiece.type,
            shape: JSON.parse(JSON.stringify(TETROMINOES[currentPiece.type]))
        };
        currentPiece = {
            type: temp.type,
            shape: JSON.parse(JSON.stringify(temp.shape)),
            x: Math.floor(CONFIG.boardWidth / 2) - 1,
            y: 0,
            rotation: 0
        };
        
        if (checkCollision(currentPiece, 0, 0)) {
            gameOver();
            return;
        }
    }
    
    canHold = false;
    drawHoldPiece();
}

function movePiece(dx, dy) {
    if (!currentPiece || checkCollision(currentPiece, dx, dy)) {
        return false;
    }
    
    currentPiece.x += dx;
    currentPiece.y += dy;
    return true;
}

function rotatePiece(counterClockwise = false) {
    if (!currentPiece) return;
    
    const rotated = {
        ...currentPiece,
        shape: rotateMatrix(currentPiece.shape, counterClockwise)
    };
    
    if (!checkCollision(rotated, 0, 0)) {
        currentPiece.shape = rotated.shape;
        return;
    }
    
    const kicks = [[1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, -2]];
    for (let [dx, dy] of kicks) {
        if (!checkCollision(rotated, dx, dy)) {
            currentPiece.shape = rotated.shape;
            currentPiece.x += dx;
            currentPiece.y += dy;
            return;
        }
    }
}

function rotateMatrix(matrix, counterClockwise = false) {
    const size = matrix.length;
    const rotated = Array(size).fill().map(() => Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (counterClockwise) {
                rotated[size - 1 - j][i] = matrix[i][j];
            } else {
                rotated[j][size - 1 - i] = matrix[i][j];
            }
        }
    }
    
    return rotated;
}

function hardDrop() {
    if (!currentPiece) return;
    
    let dropDistance = 0;
    while (movePiece(0, 1)) {
        dropDistance++;
    }
    score += dropDistance * SCORING.hardDrop;
    lockPiece();
    updateDisplay();
}

function checkCollision(piece, dx, dy) {
    if (!piece) return true;
    
    const newX = piece.x + dx;
    const newY = piece.y + dy;
    
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = newX + x;
                const boardY = newY + y;
                
                if (boardX < 0 || boardX >= CONFIG.boardWidth || 
                    boardY >= CONFIG.boardHeight || 
                    (boardY >= 0 && board[boardY][boardX])) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function lockPiece() {
    if (!currentPiece) return;
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                
                if (boardY >= 0 && boardY < CONFIG.boardHeight && 
                    boardX >= 0 && boardX < CONFIG.boardWidth) {
                    board[boardY][boardX] = 1;
                }
            }
        }
    }
    
    const clearedLines = clearLines();
    if (clearedLines > 0) {
        updateScore(clearedLines);
        triggerFlipAnimation();
    } else {
        spawnNewPiece();
    }
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = CONFIG.boardHeight - 1; y >= 0; y--) {
        if (board[y].every(cell => cell === 1)) {
            board.splice(y, 1);
            board.unshift(Array(CONFIG.boardWidth).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    return linesCleared;
}

function updateScore(linesCleared) {
    const lineScores = [0, SCORING.single, SCORING.double, SCORING.triple, SCORING.tetris];
    score += lineScores[linesCleared] * level;
    lines += linesCleared;
    
    const newLevel = Math.floor(lines / CONFIG.linesPerLevel) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropTime = Math.max(50, CONFIG.initialDropTime - (level - 1) * 50);
    }
}

function triggerFlipAnimation() {
    isFlipping = true;
    if (gameCanvas) {
        gameCanvas.classList.add('flip');
    }
    
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
    
    setTimeout(() => {
        if (gameCanvas) {
            gameCanvas.classList.remove('flip');
        }
        setTimeout(() => {
            isFlipping = false;
            spawnNewPiece();
        }, 100);
    }, 600);
}

function gameOver() {
    console.log('Game Over!');
    
    // Clear animation and timers
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    clearLongPressTimer();
    isPauseResuming = false;
    
    gameState = 'gameover';
    const finalScoreEl = document.getElementById('final-score');
    if (finalScoreEl) {
        finalScoreEl.textContent = score.toLocaleString();
    }
    
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    showScreen('gameover');
}

function updateDisplay() {
    // Desktop displays
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const linesEl = document.getElementById('lines');
    
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (levelEl) levelEl.textContent = level;
    if (linesEl) linesEl.textContent = lines;
    
    // Mobile displays
    const mobileScoreEl = document.getElementById('mobile-score');
    const mobileLevelEl = document.getElementById('mobile-level');
    const mobileLinesEl = document.getElementById('mobile-lines');
    
    if (mobileScoreEl) mobileScoreEl.textContent = score.toLocaleString();
    if (mobileLevelEl) mobileLevelEl.textContent = level;
    if (mobileLinesEl) mobileLinesEl.textContent = lines;
}

// Fixed game loop with better state management
function gameLoop(currentTime) {
    // Ensure we're in the right state and not flipping
    if (gameState !== 'playing' || isFlipping) {
        // Only continue the loop if we're still supposed to be playing
        if (gameState === 'playing') {
            animationId = requestAnimationFrame(gameLoop);
        }
        return;
    }
    
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime > dropTime) {
        if (!movePiece(0, 1)) {
            lockPiece();
        }
        lastTime = currentTime;
    }
    
    draw();
    
    // Continue the loop only if we're still in playing state
    if (gameState === 'playing') {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function draw() {
    if (!gameCtx) return;
    
    const theme = getThemeColors();
    
    gameCtx.fillStyle = theme.canvasBackground;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw board
    for (let y = 0; y < CONFIG.boardHeight; y++) {
        for (let x = 0; x < CONFIG.boardWidth; x++) {
            if (board[y][x]) {
                drawCell(gameCtx, x, y, theme.pieceColor);
            }
        }
    }
    
    // Draw current piece
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    drawCell(gameCtx, currentPiece.x + x, currentPiece.y + y, theme.pieceColor);
                }
            }
        }
    }
    
    drawGrid();
}

function drawCell(ctx, x, y, color) {
    const theme = getThemeColors();
    const pixelX = x * currentCellSize;
    const pixelY = y * currentCellSize;
    
    ctx.fillStyle = color;
    ctx.fillRect(pixelX, pixelY, currentCellSize, currentCellSize);
    
    ctx.strokeStyle = theme.canvasBackground;
    ctx.lineWidth = 1;
    ctx.strokeRect(pixelX, pixelY, currentCellSize, currentCellSize);
}

function drawGrid() {
    if (!gameCtx) return;
    
    const theme = getThemeColors();
    gameCtx.strokeStyle = theme.gridColor;
    gameCtx.lineWidth = 1;
    gameCtx.globalAlpha = 0.2;
    
    for (let x = 1; x < CONFIG.boardWidth; x++) {
        gameCtx.beginPath();
        gameCtx.moveTo(x * currentCellSize, 0);
        gameCtx.lineTo(x * currentCellSize, CONFIG.boardHeight * currentCellSize);
        gameCtx.stroke();
    }
    
    for (let y = 1; y < CONFIG.boardHeight; y++) {
        gameCtx.beginPath();
        gameCtx.moveTo(0, y * currentCellSize);
        gameCtx.lineTo(CONFIG.boardWidth * currentCellSize, y * currentCellSize);
        gameCtx.stroke();
    }
    
    gameCtx.globalAlpha = 1.0;
}

function drawNextPiece() {
    const theme = getThemeColors();
    
    if (nextCtx && nextPiece) {
        nextCtx.fillStyle = theme.canvasBackground;
        nextCtx.fillRect(0, 0, 120, 120);
        drawPieceOnCanvas(nextCtx, nextPiece, 120, 120, 20);
    }
    
    if (mobileNextCtx && nextPiece) {
        mobileNextCtx.fillStyle = theme.canvasBackground;
        mobileNextCtx.fillRect(0, 0, 44, 44);
        drawPieceOnCanvas(mobileNextCtx, nextPiece, 44, 44, 8);
    }
}

function drawHoldPiece() {
    if (!holdCtx) return;
    
    const theme = getThemeColors();
    holdCtx.fillStyle = theme.canvasBackground;
    holdCtx.fillRect(0, 0, 60, 60);
    
    if (holdPiece) {
        drawPieceOnCanvas(holdCtx, holdPiece, 60, 60, 12);
    }
}

function drawPieceOnCanvas(ctx, piece, canvasWidth, canvasHeight, cellSize) {
    if (!piece || !ctx) return;
    
    const theme = getThemeColors();
    const offsetX = (canvasWidth - piece.shape[0].length * cellSize) / 2;
    const offsetY = (canvasHeight - piece.shape.length * cellSize) / 2;
    
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const pixelX = offsetX + x * cellSize;
                const pixelY = offsetY + y * cellSize;
                
                ctx.fillStyle = theme.pieceColor;
                ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
                
                ctx.strokeStyle = theme.canvasBackground;
                ctx.lineWidth = 1;
                ctx.strokeRect(pixelX, pixelY, cellSize, cellSize);
            }
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Improved initialization sequence
function initializeApp() {
    console.log('Initializing Tetris application...');
    
    // Make sure DOM is fully loaded
    if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting...');
        return;
    }
    
    // Initialize immediately if DOM is ready
    setTimeout(() => {
        init();
    }, 50);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Handle visibility changes with better pause logic
document.addEventListener('visibilitychange', function() {
    if (document.hidden && gameState === 'playing' && !isPauseResuming) {
        isPauseResuming = true;
        togglePause();
        setTimeout(() => {
            isPauseResuming = false;
        }, 200);
    }
});

console.log('Mobile-optimized Tetris script loaded');