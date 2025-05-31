// Ultimate Pacman Game

// Game setup
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.style.display = 'block';
canvas.style.margin = 'auto';
canvas.style.background = 'black';
document.body.style.backgroundColor = '#111';
document.body.style.margin = '0';
document.body.style.padding = '20px 0';

// Game constants
const TILE_SIZE = 32;
const GRID_WIDTH = 19;
const GRID_HEIGHT = 21;
const GAME_WIDTH = GRID_WIDTH * TILE_SIZE;
const GAME_HEIGHT = GRID_HEIGHT * TILE_SIZE;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
const ctx = canvas.getContext('2d');

// Game state
const state = {
    pacman: { x: 0, y: 0, speed: 3, dir: 'right', nextDir: null, radius: TILE_SIZE/2 },
    ghosts: [],
    walls: [],
    dots: [],
    powerPellets: [],
    score: 0,
    lives: 3,
    level: 1,
    frightenedTimer: 0,
    gameOver: false,
    paused: false,
    grid: [
        "XXXXXXXXXXXXXXXXXXX",
        "X        X        X",
        "X XX XXX X XXX XX X",
        "X                 X",
        "X XX X XXXXX X XX X",
        "X    X       X    X",
        "XXXX XXXX XXXX XXXX",
        "OOOX X       X XOOO",
        "XXXX X XXGXX X XXXX",
        "O       BPO       O",
        "XXXX X XXXXX X XXXX",
        "OOOX X       X XOOO",
        "XXXX X XXXXX X XXXX",
        "X        X        X",
        "X XX XXX X XXX XX X",
        "X  X     P     X  X",
        "XX X X XXXXX X X XX",
        "X    X   X   X    X",
        "X XXXXXX X XXXXXX X",
        "X                 X",
        "XXXXXXXXXXXXXXXXXXX"
    ]
};

// Initialize game
function initGame() {
    // Clear all game objects
    state.walls = [];
    state.dots = [];
    state.powerPellets = [];
    state.ghosts = [];
    
    // Create game objects from grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cell = state.grid[y][x];
            const posX = x * TILE_SIZE;
            const posY = y * TILE_SIZE;
            
            switch(cell) {
                case 'X':
                    state.walls.push({ x: posX, y: posY, width: TILE_SIZE, height: TILE_SIZE });
                    break;
                case ' ':
                    state.dots.push({ x: posX + TILE_SIZE/2 - 3, y: posY + TILE_SIZE/2 - 3, width: 6, height: 6 });
                    break;
                case 'O':
                    state.powerPellets.push({ x: posX + TILE_SIZE/2 - 8, y: posY + TILE_SIZE/2 - 8, width: 16, height: 16 });
                    break;
                case 'P':
                    state.pacman.x = posX + TILE_SIZE/2;
                    state.pacman.y = posY + TILE_SIZE/2;
                    state.pacman.dir = 'right';
                    state.pacman.nextDir = null;
                    break;
                case 'B':
                    state.ghosts.push(createGhost('blinky', posX + TILE_SIZE/2, posY + TILE_SIZE/2, 'red'));
                    break;
                case 'P':
                    state.ghosts.push(createGhost('pinky', posX + TILE_SIZE/2, posY + TILE_SIZE/2, 'pink'));
                    break;
                case 'I':
                    state.ghosts.push(createGhost('inky', posX + TILE_SIZE/2, posY + TILE_SIZE/2, 'cyan'));
                    break;
                case 'C':
                    state.ghosts.push(createGhost('clyde', posX + TILE_SIZE/2, posY + TILE_SIZE/2, 'orange'));
                    break;
            }
        }
    }
}

function createGhost(name, x, y, color) {
    return {
        name,
        x,
        y,
        color,
        speed: 2,
        dir: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
        frightened: false,
        returning: false,
        radius: TILE_SIZE/2
    };
}

// Movement system
function movePacman() {
    // Try to change direction if there's a queued direction
    if (state.pacman.nextDir) {
        const nextX = Math.floor(state.pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        const nextY = Math.floor(state.pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        
        // Check if we're at a center point where direction can change
        if (Math.abs(state.pacman.x - nextX) < 2 && Math.abs(state.pacman.y - nextY) < 2) {
            state.pacman.x = nextX;
            state.pacman.y = nextY;
            
            // Check if new direction is valid
            if (canMove(state.pacman.nextDir, state.pacman.x, state.pacman.y)) {
                state.pacman.dir = state.pacman.nextDir;
                state.pacman.nextDir = null;
            }
        }
    }
    
    // Move in current direction
    let newX = state.pacman.x;
    let newY = state.pacman.y;
    
    switch(state.pacman.dir) {
        case 'left': newX -= state.pacman.speed; break;
        case 'right': newX += state.pacman.speed; break;
        case 'up': newY -= state.pacman.speed; break;
        case 'down': newY += state.pacman.speed; break;
    }
    
    // Check wall collisions
    if (!wallAt(newX, newY, state.pacman.radius)) {
        state.pacman.x = newX;
        state.pacman.y = newY;
    } else {
        // Snap to grid if blocked
        state.pacman.x = Math.round(state.pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        state.pacman.y = Math.round(state.pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
    }
    
    // Screen wrapping
    if (state.pacman.x < -state.pacman.radius) state.pacman.x = GAME_WIDTH + state.pacman.radius;
    if (state.pacman.x > GAME_WIDTH + state.pacman.radius) state.pacman.x = -state.pacman.radius;
}

function moveGhosts() {
    state.ghosts.forEach(ghost => {
        // Ghost AI - simple random movement
        if (Math.random() < 0.02 || wallInFront(ghost)) {
            const directions = ['up', 'down', 'left', 'right'];
            const opposite = {up: 'down', down: 'up', left: 'right', right: 'left'};
            
            // Filter out opposite direction to prevent 180° turns
            const possibleDirs = directions.filter(dir => dir !== opposite[ghost.dir]);
            ghost.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        }
        
        // Move ghost
        let newX = ghost.x;
        let newY = ghost.y;
        
        switch(ghost.dir) {
            case 'left': newX -= ghost.speed; break;
            case 'right': newX += ghost.speed; break;
            case 'up': newY -= ghost.speed; break;
            case 'down': newY += ghost.speed; break;
        }
        
        // Check wall collisions
        if (!wallAt(newX, newY, ghost.radius)) {
            ghost.x = newX;
            ghost.y = newY;
        } else {
            // If blocked, try to turn
            ghost.dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        }
    });
}

// Collision detection
function wallAt(x, y, radius) {
    return state.walls.some(wall => {
        return x + radius > wall.x && 
               x - radius < wall.x + wall.width &&
               y + radius > wall.y && 
               y - radius < wall.y + wall.height;
    });
}

function wallInFront(obj) {
    const lookAhead = 5;
    let testX = obj.x;
    let testY = obj.y;
    
    switch(obj.dir) {
        case 'left': testX -= lookAhead; break;
        case 'right': testX += lookAhead; break;
        case 'up': testY -= lookAhead; break;
        case 'down': testY += lookAhead; break;
    }
    
    return wallAt(testX, testY, obj.radius);
}

function canMove(dir, x, y) {
    const testRadius = TILE_SIZE/2;
    let testX = x;
    let testY = y;
    
    // Check one tile ahead in the desired direction
    switch(dir) {
        case 'left': testX -= TILE_SIZE; break;
        case 'right': testX += TILE_SIZE; break;
        case 'up': testY -= TILE_SIZE; break;
        case 'down': testY += TILE_SIZE; break;
    }
    
    return !wallAt(testX, testY, testRadius);
}

// Game logic
function checkCollisions() {
    // Check dot collisions
    state.dots = state.dots.filter(dot => {
        const dx = state.pacman.x - (dot.x + dot.width/2);
        const dy = state.pacman.y - (dot.y + dot.height/2);
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < state.pacman.radius) {
            state.score += 10;
            return false;
        }
        return true;
    });
    
    // Check power pellet collisions
    state.powerPellets = state.powerPellets.filter(pellet => {
        const dx = state.pacman.x - (pellet.x + pellet.width/2);
        const dy = state.pacman.y - (pellet.y + pellet.height/2);
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < state.pacman.radius) {
            state.score += 50;
            state.frightenedTimer = 10 * 60; // 10 seconds at 60fps
            state.ghosts.forEach(ghost => ghost.frightened = true);
            return false;
        }
        return true;
    });
    
    // Check ghost collisions
    state.ghosts.forEach(ghost => {
        const dx = state.pacman.x - ghost.x;
        const dy = state.pacman.y - ghost.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < state.pacman.radius + ghost.radius) {
            if (ghost.frightened) {
                // Eat ghost
                ghost.frightened = false;
                ghost.returning = true;
                state.score += 200;
            } else if (!ghost.returning) {
                // Lose life
                state.lives--;
                if (state.lives <= 0) {
                    state.gameOver = true;
                } else {
                    resetPositions();
                }
            }
        }
    });
    
    // Level complete
    if (state.dots.length === 0 && state.powerPellets.length === 0) {
        state.level++;
        initGame();
    }
}

function resetPositions() {
    // Reset pacman
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (state.grid[y][x] === 'P') {
                state.pacman.x = x * TILE_SIZE + TILE_SIZE/2;
                state.pacman.y = y * TILE_SIZE + TILE_SIZE/2;
                state.pacman.dir = 'right';
                state.pacman.nextDir = null;
            }
        }
    }
    
    // Reset ghosts
    state.ghosts = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cell = state.grid[y][x];
            const posX = x * TILE_SIZE + TILE_SIZE/2;
            const posY = y * TILE_SIZE + TILE_SIZE/2;
            
            switch(cell) {
                case 'B':
                    state.ghosts.push(createGhost('blinky', posX, posY, 'red'));
                    break;
                case 'P':
                    state.ghosts.push(createGhost('pinky', posX, posY, 'pink'));
                    break;
                case 'I':
                    state.ghosts.push(createGhost('inky', posX, posY, 'cyan'));
                    break;
                case 'C':
                    state.ghosts.push(createGhost('clyde', posX, posY, 'orange'));
                    break;
            }
        }
    }
}

// Rendering
function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw walls
    ctx.fillStyle = 'blue';
    state.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
    
    // Draw dots
    ctx.fillStyle = 'white';
    state.dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x + dot.width/2, dot.y + dot.height/2, dot.width/2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw power pellets
    ctx.fillStyle = 'white';
    state.powerPellets.forEach(pellet => {
        ctx.beginPath();
        ctx.arc(pellet.x + pellet.width/2, pellet.y + pellet.height/2, pellet.width/2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw ghosts
    state.ghosts.forEach(ghost => {
        if (ghost.frightened) {
            ctx.fillStyle = state.frightenedTimer > 60 ? 'blue' : 'white';
        } else if (ghost.returning) {
            ctx.fillStyle = 'gray';
        } else {
            ctx.fillStyle = ghost.color;
        }
        
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, ghost.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ghost eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ghost.x - 8, ghost.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(ghost.x + 8, ghost.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        let pupilX1 = ghost.x - 8;
        let pupilX2 = ghost.x + 8;
        let pupilY = ghost.y - 5;
        
        switch(ghost.dir) {
            case 'left': 
                pupilX1 -= 2;
                pupilX2 -= 2;
                break;
            case 'right':
                pupilX1 += 2;
                pupilX2 += 2;
                break;
            case 'up':
                pupilY -= 2;
                break;
            case 'down':
                pupilY += 2;
                break;
        }
        
        ctx.beginPath();
        ctx.arc(pupilX1, pupilY, 2, 0, Math.PI * 2);
        ctx.arc(pupilX2, pupilY, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw pacman
    ctx.fillStyle = 'yellow';
    let startAngle, endAngle;
    
    switch(state.pacman.dir) {
        case 'right':
            startAngle = 0.2 * Math.PI;
            endAngle = 1.8 * Math.PI;
            break;
        case 'left':
            startAngle = 1.2 * Math.PI;
            endAngle = 0.8 * Math.PI;
            break;
        case 'up':
            startAngle = 1.2 * Math.PI;
            endAngle = 1.8 * Math.PI;
            break;
        case 'down':
            startAngle = 0.2 * Math.PI;
            endAngle = -0.2 * Math.PI;
            break;
    }
    
    // Animate mouth
    const mouthOpen = Math.sin(Date.now() / 100) > 0;
    if (mouthOpen) {
        ctx.beginPath();
        ctx.arc(state.pacman.x, state.pacman.y, state.pacman.radius, startAngle, endAngle);
        ctx.lineTo(state.pacman.x, state.pacman.y);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(state.pacman.x, state.pacman.y, state.pacman.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw UI
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${state.score}`, 20, 30);
    ctx.fillText(`Lives: ${state.lives}`, GAME_WIDTH - 120, 30);
    ctx.fillText(`Level: ${state.level}`, GAME_WIDTH/2 - 30, 30);
    
    if (state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH/2, GAME_HEIGHT/2);
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${state.score}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 40);
        ctx.textAlign = 'left';
    }
}

// Game loop
function gameLoop() {
    if (!state.paused && !state.gameOver) {
        movePacman();
        moveGhosts();
        checkCollisions();
        
        // Update frightened timer
        if (state.frightenedTimer > 0) {
            state.frightenedTimer--;
            if (state.frightenedTimer === 0) {
                state.ghosts.forEach(ghost => ghost.frightened = false);
            }
        }
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (state.gameOver) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            state.pacman.nextDir = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            state.pacman.nextDir = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            state.pacman.nextDir = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            state.pacman.nextDir = 'right';
            break;
        case ' ':
            state.paused = !state.paused;
            break;
    }
});

// Start game
initGame();
gameLoop();
