// Game board setup
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// Game elements
let blueGhostImage = new Image();
let orangeGhostImage = new Image();
let pinkGhostImage = new Image();
let redGhostImage = new Image();
let pacmanUpImage = new Image();
let pacmanDownImage = new Image();
let pacmanLeftImage = new Image();
let pacmanRightImage = new Image();
let wallImage = new Image();

// Game state
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

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let gameStarted = false;
let difficulty = "medium";
let playerName = "Player";
let ghostSpeed = tileSize / 4;
let gameInterval;
let levelTimeLimit = 120;
let timeLeft = levelTimeLimit;
let timerInterval;

// DOM elements
const startScreen = document.getElementById("start-screen");
const howToPlayScreen = document.getElementById("how-to-play");
const difficultyScreen = document.getElementById("difficulty-screen");
const nameScreen = document.getElementById("name-screen");
const winScreen = document.getElementById("win-screen");
const highScoresTable = document.getElementById("high-scores");
const playerNameInput = document.getElementById("player-name");
const gameOverlay = document.getElementById("game-overlay");
const scoreDisplay = document.getElementById("score-display");
const livesDisplay = document.getElementById("lives-display");
const levelDisplay = document.getElementById("level-display");
const playerDisplay = document.getElementById("player-display");
const difficultyDisplay = document.getElementById("difficulty-display");
const winMessage = document.getElementById("win-message");

// Mobile controls
const upBtn = document.getElementById("up-btn");
const downBtn = document.getElementById("down-btn");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");

// Initialize game
window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Set up event listeners
    document.getElementById("start-btn").addEventListener("click", showDifficultyScreen);
    document.getElementById("how-to-play-btn").addEventListener("click", showHowToPlay);
    document.getElementById("high-scores-btn").addEventListener("click", showHighScores);
    document.getElementById("back-btn").addEventListener("click", showStartScreen);
    document.getElementById("difficulty-back-btn").addEventListener("click", showStartScreen);
    document.getElementById("name-back-btn").addEventListener("click", showDifficultyScreen);
    document.getElementById("start-game-btn").addEventListener("click", startGame);
    document.getElementById("play-again-btn").addEventListener("click", restartGame);
    document.getElementById("main-menu-btn").addEventListener("click", returnToMainMenu);
    document.getElementById("close-scores-btn").addEventListener("click", closeHighScores);
    
    // Mobile controls
    upBtn.addEventListener("touchstart", () => movePacman({code: "ArrowUp"}), {passive: false});
    downBtn.addEventListener("touchstart", () => movePacman({code: "ArrowDown"}), {passive: false});
    leftBtn.addEventListener("touchstart", () => movePacman({code: "ArrowLeft"}), {passive: false});
    rightBtn.addEventListener("touchstart", () => movePacman({code: "ArrowRight"}), {passive: false});
    
    // Load images
    loadImages();
    
    // Check if mobile device
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        document.getElementById("mobile-controls").style.display = "flex";
    }
};

function loadImages() {
    wallImage.src = "wall.png";
    blueGhostImage.src = "blueGhost.png";
    orangeGhostImage.src = "orangeGhost.png";
    pinkGhostImage.src = "pinkGhost.png";
    redGhostImage.src = "redGhost.png";
    pacmanUpImage.src = "pacmanUp.png";
    pacmanDownImage.src = "pacmanDown.png";
    pacmanLeftImage.src = "pacmanLeft.png";
    pacmanRightImage.src = "pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            }
            else if (tileMapChar == 'b') {
                ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            }
            else if (tileMapChar == 'o') {
                ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            }
            else if (tileMapChar == 'p') {
                ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            }
            else if (tileMapChar == 'r') {
                ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            }
            else if (tileMapChar == 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            }
            else if (tileMapChar == ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4));
            }
        }
    }
}

function update() {
    if (gameOver) return;
    
    move();
    draw();
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw walls
    walls.forEach(wall => {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    });

    // Draw food
    context.fillStyle = "white";
    foods.forEach(food => {
        context.fillRect(food.x, food.y, food.width, food.height);
    });

    // Draw ghosts
    ghosts.forEach(ghost => {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    });

    // Draw pacman
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);

    // Update displays
    scoreDisplay.textContent = `SCORE: ${score}`;
    livesDisplay.textContent = `LIVES: ${lives}`;
    levelDisplay.textContent = `LEVEL: ${level}`;
    playerDisplay.textContent = playerName;
    difficultyDisplay.textContent = difficulty.toUpperCase();
}

function move() {
    // Store previous position for collision handling
    const prevX = pacman.x;
    const prevY = pacman.y;

    // Move pacman
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    // Wall collision detection with improved precision
    let pacmanHitWall = false;
    walls.forEach(wall => {
        if (isColliding(pacman, wall)) {
            pacmanHitWall = true;
        }
    });

    // If collision occurred, revert to previous position
    if (pacmanHitWall) {
        pacman.x = prevX;
        pacman.y = prevY;
    }

    // Improved boundary checking
    pacman.x = Math.max(0, Math.min(pacman.x, boardWidth - pacman.width));
    pacman.y = Math.max(0, Math.min(pacman.y, boardHeight - pacman.height));

    // Ghost movement and collision
    ghosts.forEach(ghost => {
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        let ghostHitWall = false;
        walls.forEach(wall => {
            if (isColliding(ghost, wall)) {
                ghostHitWall = true;
            }
        });

        if (ghostHitWall || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
            ghost.x -= ghost.velocityX;
            ghost.y -= ghost.velocityY;
            ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
        }

        if (isColliding(ghost, pacman)) {
            lives--;
            if (lives <= 0) {
                gameOver = true;
                endGame(false);
                return;
            }
            resetPositions();
        }
    });

    // Food collection
    foods.forEach(food => {
        if (isColliding(pacman, food)) {
            foods.delete(food);
            score += 10;
        }
    });

    // Level completion
    if (foods.size === 0) {
        levelComplete();
    }
}

function movePacman(e) {
    if (gameOver || !gameStarted) return;

    // First stop any current movement
    pacman.velocityX = 0;
    pacman.velocityY = 0;

    // Determine new direction based on key press
    switch(e.code) {
        case "ArrowUp":
        case "KeyW":
            pacman.image = pacmanUpImage;
            pacman.velocityY = -ghostSpeed;
            break;
        case "ArrowDown":
        case "KeyS":
            pacman.image = pacmanDownImage;
            pacman.velocityY = ghostSpeed;
            break;
        case "ArrowLeft":
        case "KeyA":
            pacman.image = pacmanLeftImage;
            pacman.velocityX = -ghostSpeed;
            break;
        case "ArrowRight":
        case "KeyD":
            pacman.image = pacmanRightImage;
            pacman.velocityX = ghostSpeed;
            break;
    }
}

function isColliding(a, b) {
    const aCenterX = a.x + a.width / 2;
    const aCenterY = a.y + a.height / 2;
    const bCenterX = b.x + b.width / 2;
    const bCenterY = b.y + b.height / 2;

    const horizontalDistance = Math.abs(aCenterX - bCenterX);
    const verticalDistance = Math.abs(aCenterY - bCenterY);

    const minHorizontalDistance = (a.width + b.width) / 2;
    const minVerticalDistance = (a.height + b.height) / 2;

    return horizontalDistance < minHorizontalDistance && 
           verticalDistance < minVerticalDistance;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    ghosts.forEach(ghost => {
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    });
}

function levelComplete() {
    level++;
    timeLeft = levelTimeLimit;
    clearInterval(timerInterval);
    startTimer();
    
    // Increase difficulty
    ghostSpeed = Math.min(ghostSpeed + 1, tileSize / 2);
    
    loadMap();
    resetPositions();
}

function startGame() {
    playerName = playerNameInput.value.trim() || "Player";
    gameOverlay.style.display = "none";
    gameStarted = true;
    gameOver = false;
    score = 0;
    lives = 3;
    level = 1;
    
    // Set difficulty
    switch(difficulty) {
        case "easy":
            ghostSpeed = tileSize / 5;
            levelTimeLimit = 150;
            break;
        case "medium":
            ghostSpeed = tileSize / 4;
            levelTimeLimit = 120;
            break;
        case "hard":
            ghostSpeed = tileSize / 3;
            levelTimeLimit = 90;
            break;
    }
    timeLeft = levelTimeLimit;
    
    loadMap();
    resetPositions();
    
    // Start game loop
    clearInterval(gameInterval);
    gameInterval = setInterval(update, 1000/20); // 20 FPS
    
    // Start timer
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            lives--;
            if (lives <= 0) {
                endGame(false);
            } else {
                resetPositions();
                timeLeft = levelTimeLimit;
            }
        }
    }, 1000);
}

function endGame(won) {
    gameOver = true;
    gameStarted = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    winMessage.textContent = won ? `You won! Final Score: ${score}` : `Game Over! Final Score: ${score}`;
    winScreen.style.display = "block";
    gameOverlay.style.display = "flex";
    
    saveHighScore();
}

function restartGame() {
    winScreen.style.display = "none";
    startGame();
}

function returnToMainMenu() {
    winScreen.style.display = "none";
    showStartScreen();
}

function saveHighScore() {
    let scores = JSON.parse(localStorage.getItem("pacmanHighScores")) || [];
    scores.push({
        name: playerName,
        score: score,
        difficulty: difficulty,
        date: new Date().toLocaleDateString()
    });
    
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    localStorage.setItem("pacmanHighScores", JSON.stringify(scores));
}

function showHighScores() {
    const scores = JSON.parse(localStorage.getItem("pacmanHighScores")) || [];
    const scoresBody = document.getElementById("scores-body");
    scoresBody.innerHTML = "";
    
    scores.forEach((score, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${score.score}</td>
            <td>${score.difficulty.toUpperCase()}</td>
            <td>${score.date}</td>
        `;
        scoresBody.appendChild(row);
    });
    
    highScoresTable.style.display = "block";
    gameOverlay.style.display = "flex";
}

function closeHighScores() {
    highScoresTable.style.display = "none";
    gameOverlay.style.display = gameStarted ? "none" : "flex";
}

function showStartScreen() {
    startScreen.style.display = "block";
    howToPlayScreen.style.display = "none";
    difficultyScreen.style.display = "none";
    nameScreen.style.display = "none";
    winScreen.style.display = "none";
}

function showHowToPlay() {
    startScreen.style.display = "none";
    howToPlayScreen.style.display = "block";
}

function showDifficultyScreen() {
    startScreen.style.display = "none";
    difficultyScreen.style.display = "block";
}

function showNameScreen() {
    difficultyScreen.style.display = "none";
    nameScreen.style.display = "block";
}

// Difficulty buttons
document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        difficulty = this.dataset.difficulty;
        showNameScreen();
    });
});

// Keyboard controls
document.addEventListener("keydown", movePacman);

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
        this.nextDirection = null;
    }

    updateDirection(direction) {
        this.nextDirection = direction;
    }

    applyMovement() {
        if (this.nextDirection) {
            this.velocityX = 0;
            this.velocityY = 0;
            
            switch(this.nextDirection) {
                case 'U':
                    this.velocityY = -ghostSpeed;
                    break;
                case 'D':
                    this.velocityY = ghostSpeed;
                    break;
                case 'L':
                    this.velocityX = -ghostSpeed;
                    break;
                case 'R':
                    this.velocityX = ghostSpeed;
                    break;
            }
            this.nextDirection = null;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.nextDirection = null;
    }
}
