// Enhanced Pacman Game - JavaScript Only

// Game board setup
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.style.display = 'block';
canvas.style.margin = 'auto';
canvas.style.background = 'black';
document.body.style.backgroundColor = '#111';
document.body.style.margin = '0';
document.body.style.padding = '20px 0';
document.body.style.fontFamily = 'Arial, sans-serif';

const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
canvas.width = boardWidth;
canvas.height = boardHeight;
const ctx = canvas.getContext('2d');

// Game elements
const assets = {
    wall: new Image(),
    blueGhost: new Image(),
    orangeGhost: new Image(),
    pinkGhost: new Image(),
    redGhost: new Image(),
    scaredGhost: new Image(),
    scaredGhostEnding: new Image(),
    pacmanUp: new Image(),
    pacmanDown: new Image(),
    pacmanLeft: new Image(),
    pacmanRight: new Image(),
    pellet: new Image(),
    powerPellet: new Image()
};

// Load assets (replace with your actual paths)
Object.keys(assets).forEach(key => {
    assets[key].src = `${key}.png`;
});

// Game state
const gameState = {
    walls: new Set(),
    foods: new Set(),
    powerPellets: new Set(),
    ghosts: new Set(),
    pacman: null,
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    gameStarted: false,
    powerPelletActive: false,
    powerPelletTimer: 0,
    ghostEatenMultiplier: 1,
    animationFrame: 0,
    ghostSpeed: tileSize / 8,
    pacmanSpeed: tileSize / 6,
    levelTimeLimit: 120,
    timeLeft: 120,
    powerPelletDuration: 10,
    pacmanAnimationSpeed: 5,
    ghostAnimationSpeed: 10,
    pacmanMouthOpen: true,
    nextDirection: null,
    currentDirection: null
};

// Tile map
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
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
];

// Game classes
class GameObject {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Wall extends GameObject {
    constructor(image, x, y, width, height) {
        super(image, x, y, width, height);
    }
}

class Ghost extends GameObject {
    constructor(image, x, y, width, height, color) {
        super(image, x, y, width, height);
        this.color = color;
        this.direction = this.getRandomDirection();
        this.isScared = false;
        this.isReturning = false;
        this.speed = gameState.ghostSpeed;
        this.updateVelocity();
    }

    getRandomDirection() {
        const directions = ['U', 'D', 'L', 'R'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    updateDirection(direction) {
        this.direction = direction;
        this.updateVelocity();
    }

    updateVelocity() {
        switch(this.direction) {
            case 'U':
                this.velocityX = 0;
                this.velocityY = -this.speed;
                break;
            case 'D':
                this.velocityX = 0;
                this.velocityY = this.speed;
                break;
            case 'L':
                this.velocityX = -this.speed;
                this.velocityY = 0;
                break;
            case 'R':
                this.velocityX = this.speed;
                this.velocityY = 0;
                break;
        }
    }

    draw() {
        let img = this.image;
        if (this.isScared) {
            img = gameState.powerPelletTimer > 2 ? assets.scaredGhost : assets.scaredGhostEnding;
        }
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
}

class Pacman extends GameObject {
    constructor(image, x, y, width, height) {
        super(image, x, y, width, height);
        this.speed = gameState.pacmanSpeed;
    }

    draw() {
        if (gameState.animationFrame % gameState.pacmanAnimationSpeed === 0) {
            gameState.pacmanMouthOpen = !gameState.pacmanMouthOpen;
        }
        
        if (gameState.pacmanMouthOpen) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Draw Pacman with mouth closed (circle)
            ctx.beginPath();
            ctx.fillStyle = 'yellow';
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Game functions
function loadMap() {
    gameState.walls.clear();
    gameState.foods.clear();
    gameState.powerPellets.clear();
    gameState.ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar === 'X') {
                gameState.walls.add(new Wall(assets.wall, x, y, tileSize, tileSize));
            }
            else if (tileMapChar === 'b') {
                gameState.ghosts.add(new Ghost(assets.blueGhost, x, y, tileSize, tileSize, 'blue'));
            }
            else if (tileMapChar === 'o') {
                gameState.ghosts.add(new Ghost(assets.orangeGhost, x, y, tileSize, tileSize, 'orange'));
            }
            else if (tileMapChar === 'p') {
                gameState.ghosts.add(new Ghost(assets.pinkGhost, x, y, tileSize, tileSize, 'pink'));
            }
            else if (tileMapChar === 'r') {
                gameState.ghosts.add(new Ghost(assets.redGhost, x, y, tileSize, tileSize, 'red'));
            }
            else if (tileMapChar === 'P') {
                gameState.pacman = new Pacman(assets.pacmanRight, x, y, tileSize, tileSize);
            }
            else if (tileMapChar === ' ') {
                gameState.foods.add(new GameObject(assets.pellet, x + 10, y + 10, 12, 12));
            }
            else if (tileMapChar === 'O') {
                gameState.powerPellets.add(new GameObject(assets.powerPellet, x + 4, y + 4, 24, 24));
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls
    gameState.walls.forEach(wall => wall.draw());
    
    // Draw food
    gameState.foods.forEach(food => food.draw());
    gameState.powerPellets.forEach(pellet => pellet.draw());
    
    // Draw ghosts
    gameState.ghosts.forEach(ghost => ghost.draw());
    
    // Draw pacman
    if (gameState.pacman) gameState.pacman.draw();
    
    // Draw UI
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`SCORE: ${gameState.score}`, 10, 25);
    ctx.fillText(`LIVES: ${gameState.lives}`, canvas.width - 120, 25);
    ctx.fillText(`LEVEL: ${gameState.level}`, 10, 50);
    
    if (gameState.powerPelletActive) {
        ctx.fillText(`POWER: ${Math.ceil(gameState.powerPelletTimer)}`, canvas.width - 120, 50);
    }
}

function move() {
    if (gameState.gameOver) return;
    
    // Move pacman
    if (gameState.pacman) {
        const prevX = gameState.pacman.x;
        const prevY = gameState.pacman.y;
        
        gameState.pacman.x += gameState.pacman.velocityX;
        gameState.pacman.y += gameState.pacman.velocityY;
        
        // Wall collision
        let hitWall = false;
        gameState.walls.forEach(wall => {
            if (isColliding(gameState.pacman, wall)) {
                hitWall = true;
            }
        });
        
        if (hitWall) {
            gameState.pacman.x = prevX;
            gameState.pacman.y = prevY;
        }
        
        // Screen wrapping
        if (gameState.pacman.x < -gameState.pacman.width) {
            gameState.pacman.x = canvas.width;
        } else if (gameState.pacman.x > canvas.width) {
            gameState.pacman.x = -gameState.pacman.width;
        }
    }
    
    // Move ghosts
    gameState.ghosts.forEach(ghost => {
        const prevX = ghost.x;
        const prevY = ghost.y;
        
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        
        // Wall collision
        let hitWall = false;
        gameState.walls.forEach(wall => {
            if (isColliding(ghost, wall)) {
                hitWall = true;
            }
        });
        
        if (hitWall) {
            ghost.x = prevX;
            ghost.y = prevY;
            ghost.updateDirection(ghost.getRandomDirection());
        }
        
        // Ghost-pacman collision
        if (gameState.pacman && isColliding(ghost, gameState.pacman)) {
            if (gameState.powerPelletActive) {
                // Eat ghost
                ghost.reset();
                gameState.score += 200 * gameState.ghostEatenMultiplier;
                gameState.ghostEatenMultiplier *= 2;
            } else {
                // Lose life
                gameState.lives--;
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    resetPositions();
                }
            }
        }
    });
    
    // Food collection
    gameState.foods.forEach(food => {
        if (gameState.pacman && isColliding(gameState.pacman, food)) {
            gameState.foods.delete(food);
            gameState.score += 10;
        }
    });
    
    // Power pellet collection
    gameState.powerPellets.forEach(pellet => {
        if (gameState.pacman && isColliding(gameState.pacman, pellet)) {
            gameState.powerPellets.delete(pellet);
            gameState.score += 50;
            activatePowerPellet();
        }
    });
    
    // Power pellet timer
    if (gameState.powerPelletActive) {
        gameState.powerPelletTimer -= 1/60; // Assuming 60fps
        if (gameState.powerPelletTimer <= 0) {
            gameState.powerPelletActive = false;
            gameState.ghostEatenMultiplier = 1;
            gameState.ghosts.forEach(ghost => ghost.isScared = false);
        }
    }
    
    // Level completion
    if (gameState.foods.size === 0 && gameState.powerPellets.size === 0) {
        levelComplete();
    }
    
    gameState.animationFrame++;
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function activatePowerPellet() {
    gameState.powerPelletActive = true;
    gameState.powerPelletTimer = gameState.powerPelletDuration;
    gameState.ghosts.forEach(ghost => ghost.isScared = true);
}

function resetPositions() {
    if (gameState.pacman) gameState.pacman.reset();
    gameState.ghosts.forEach(ghost => {
        ghost.reset();
        ghost.updateDirection(ghost.getRandomDirection());
    });
}

function levelComplete() {
    gameState.level++;
    gameState.ghostSpeed = Math.min(gameState.ghostSpeed + 0.5, tileSize / 4);
    gameState.pacmanSpeed = Math.min(gameState.pacmanSpeed + 0.5, tileSize / 4);
    loadMap();
    resetPositions();
}

function gameOver() {
    gameState.gameOver = true;
    alert(`Game Over! Your score: ${gameState.score}`);
    resetGame();
}

function resetGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.gameOver = false;
    gameState.ghostSpeed = tileSize / 8;
    gameState.pacmanSpeed = tileSize / 6;
    loadMap();
    resetPositions();
}

function startGame() {
    resetGame();
    gameState.gameStarted = true;
    gameLoop();
}

function gameLoop() {
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    move();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controls
function movePacman(e) {
    if (!gameState.pacman || gameState.gameOver || !gameState.gameStarted) return;
    
    let direction = null;
    let image = assets.pacmanRight;
    
    switch(e.code) {
        case "ArrowUp":
        case "KeyW":
            direction = 'U';
            image = assets.pacmanUp;
            break;
        case "ArrowDown":
        case "KeyS":
            direction = 'D';
            image = assets.pacmanDown;
            break;
        case "ArrowLeft":
        case "KeyA":
            direction = 'L';
            image = assets.pacmanLeft;
            break;
        case "ArrowRight":
        case "KeyD":
            direction = 'R';
            image = assets.pacmanRight;
            break;
    }
    
    if (direction) {
        gameState.pacman.image = image;
        gameState.currentDirection = direction;
        
        // Check if direction is possible
        const tempX = gameState.pacman.x;
        const tempY = gameState.pacman.y;
        
        // Simulate move
        switch(direction) {
            case 'U': gameState.pacman.y -= gameState.pacmanSpeed; break;
            case 'D': gameState.pacman.y += gameState.pacmanSpeed; break;
            case 'L': gameState.pacman.x -= gameState.pacmanSpeed; break;
            case 'R': gameState.pacman.x += gameState.pacmanSpeed; break;
        }
        
        let canMove = true;
        gameState.walls.forEach(wall => {
            if (isColliding(gameState.pacman, wall)) {
                canMove = false;
            }
        });
        
        // Revert simulation
        gameState.pacman.x = tempX;
        gameState.pacman.y = tempY;
        
        if (canMove) {
            gameState.pacman.velocityX = 0;
            gameState.pacman.velocityY = 0;
            
            switch(direction) {
                case 'U': gameState.pacman.velocityY = -gameState.pacmanSpeed; break;
                case 'D': gameState.pacman.velocityY = gameState.pacmanSpeed; break;
                case 'L': gameState.pacman.velocityX = -gameState.pacmanSpeed; break;
                case 'R': gameState.pacman.velocityX = gameState.pacmanSpeed; break;
            }
        } else {
            gameState.nextDirection = direction;
        }
    }
}

// Initialize game
loadMap();

// Start game automatically for demo purposes
// In a real game, you'd want a start button
setTimeout(startGame, 1000);
