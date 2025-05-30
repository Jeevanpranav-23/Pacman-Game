// Game board setup
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// Game elements
let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;

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
let ghostSpeed = tileSize / 4; // Default medium speed
let gameInterval;
let levelTimeLimit = 120; // seconds
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
    upBtn.addEventListener("touchstart", () => movePacman({code: "ArrowUp"}));
    downBtn.addEventListener("touchstart", () => movePacman({code: "ArrowDown"}));
    leftBtn.addEventListener("touchstart", () => movePacman({code: "ArrowLeft"}));
    rightBtn.addEventListener("touchstart", () => movePacman({code: "ArrowRight"}));
    
    // Prevent default touch behavior
    [upBtn, downBtn, leftBtn, rightBtn].forEach(btn => {
        btn.addEventListener("touchend", (e) => e.preventDefault());
        btn.addEventListener("touchmove", (e) => e.preventDefault());
    });

    // Load images
    loadImages();
    
    // Check if mobile device
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        document.getElementById("mobile-controls").style.display = "flex";
    }
};

function loadImages() {
    wallImage = new Image();
    wallImage.src = "./wall.png";

    blueGhostImage = new Image();
    blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image();
    orangeGhostImage.src = "./orangeGhost.png";
    pinkGhostImage = new Image();
    pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image();
    redGhostImage.src = "./redGhost.png";

    pacmanUpImage = new Image();
    pacmanUpImage.src = "./pacmanUp.png";
    pacmanDownImage = new Image();
    pacmanDownImage.src = "./pacmanDown.png";
    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image();
    pacmanRightImage.src = "./pacmanRight.png";
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
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);  
            }
            else if (tileMapChar == 'b') {
                const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'o') {
                const ghost = new Block(orangeGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'p') {
                const ghost = new Block(pinkGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'r') {
                const ghost = new Block(redGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            }
            else if (tileMapChar == ' ') {
                const food = new Block(null, x + 14, y + 14, 4, 4);
                foods.add(food);
            }
        }
    }
}

function update() {
    if (gameOver) {
        return;
    }
    move();
    draw();
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw pacman
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    
    // Draw ghosts
    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }
    
    // Draw walls
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    // Draw food
    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    // Update game info displays
    scoreDisplay.textContent = `SCORE: ${score}`;
    livesDisplay.textContent = `LIVES: ${lives}`;
    levelDisplay.textContent = `LEVEL: ${level}`;
    playerDisplay.textContent = playerName;
    difficultyDisplay.textContent = difficulty.toUpperCase();
}

function move() {
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    // Check wall collisions
    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    // Check ghost collisions
    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives == 0) {
                gameOver = true;
                endGame(false);
                return;
            }
            resetPositions();
        }

        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    // Check food collision
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    // Level completion
    if (foods.size == 0) {
        levelComplete();
    }
}

function movePacman(e) {
    if (gameOver || !gameStarted) {
        return;
    }

    if (e.code == "ArrowUp" || e.code == "KeyW") {
        pacman.updateDirection('U');
        pacman.image = pacmanUpImage;
    }
    else if (e.code == "ArrowDown" || e.code == "KeyS") {
        pacman.updateDirection('D');
        pacman.image = pacmanDownImage;
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        pacman.updateDirection('L');
        pacman.image = pacmanLeftImage;
    }
    else if (e.code == "ArrowRight" || e.code == "KeyD") {
        pacman.updateDirection('R');
        pacman.image = pacmanRightImage;
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
}

function levelComplete() {
    level++;
    timeLeft = levelTimeLimit;
    clearInterval(timerInterval);
    startTimer();
    
    // Increase difficulty slightly each level
    ghostSpeed = Math.min(ghostSpeed + 1, tileSize / 2); // Cap at maximum speed
    
    loadMap();
    resetPositions();
    
    // Update ghost speeds
    for (let ghost of ghosts.values()) {
        ghost.updateVelocity();
    }
}

function startGame() {
    playerName = playerNameInput.value.trim() || "Player";
    gameOverlay.style.display = "none";
    gameStarted = true;
    gameOver = false;
    score = 0;
    lives = 3;
    level = 1;
    
    // Set difficulty-based parameters
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
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(update, 50);
    
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
    
    if (won) {
        winMessage.textContent = `You won! Final Score: ${score}`;
        winScreen.style.display = "block";
        gameOverlay.style.display = "flex";
    } else {
        winMessage.textContent = `Game Over! Final Score: ${score}`;
        winScreen.style.display = "block";
        gameOverlay.style.display = "flex";
    }
    
    saveHighScore();
    showHighScores();
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
    
    // Sort by score (descending) and keep top 10
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
    if (!gameStarted) {
        gameOverlay.style.display = "flex";
    } else {
        gameOverlay.style.display = "none";
    }
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

// Event listeners for difficulty buttons
document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        difficulty = this.dataset.difficulty;
        showNameScreen();
    });
});

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
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -ghostSpeed;
        }
        else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = ghostSpeed;
        }
        else if (this.direction == 'L') {
            this.velocityX = -ghostSpeed;
            this.velocityY = 0;
        }
        else if (this.direction == 'R') {
            this.velocityX = ghostSpeed;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
}

// Keyboard controls
document.addEventListener("keyup", movePacman);
