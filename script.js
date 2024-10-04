let puzzle = [];
let size = 4; // Default size of 4x4
let intervalId = null;

const puzzleGrid = document.getElementById('puzzleGrid');
const movesList = document.getElementById('movesList'); // Add a container for moves

// Function to create a puzzle of a specific size
function createPuzzle() {
    size = parseInt(document.getElementById('gridSize').value);

    // Validate the grid size (allow sizes from 2x2 to 10x10)
    if (size < 2 || size > 10) {
        alert('Please enter a grid size between 2 and 10.');
        return;
    }

    puzzleGrid.style.gridTemplateColumns = `repeat(${size}, 60px)`; // Adjust the grid layout based on size

    // Generate the ordered puzzle (1 to size^2 - 1 with one blank)
    puzzle = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    puzzle.push(null); // The last cell is blank (null)

    renderPuzzle();
    movesList.innerHTML = ''; // Clear the moves list when a new puzzle is created
}

function createInputPuzzle() {
    size = parseInt(document.getElementById('gridSize').value);
    puzzleGrid.style.gridTemplateColumns = `repeat(${size}, 60px)`;
    puzzle = Array(size * size).fill(null); // Create an empty array for user inputs
    renderInputPuzzle(); // Render the puzzle with input fields
}

function renderInputPuzzle() {
    puzzleGrid.innerHTML = ''; // Clear the existing grid

    for (let i = 0; i < size * size; i++) {
        const cellInput = document.createElement('input');
        cellInput.type = 'number';
        cellInput.min = '1';
        cellInput.max = (size * size - 1).toString();
        cellInput.placeholder = i < size * size - 1 ? i + 1 : ''; // Show placeholder for default numbers
        cellInput.classList.add('cell');
        cellInput.classList.add('input-cell'); // For custom styles
        cellInput.id = `cell-${i}`;
        puzzleGrid.appendChild(cellInput);
    }
}


// Collect user inputs and generate the puzzle
function collectUserInputs() {
    const userInputPuzzle = [];
    const usedNumbers = new Set();

    for (let i = 0; i < size * size; i++) {
        const input = document.getElementById(`cell-${i}`).value;
        const value = input === '' ? null : parseInt(input);

        if (value !== null && (value < 1 || value > size * size - 1 || usedNumbers.has(value))) {
            alert('Invalid input! Ensure all numbers are unique and within the valid range.');
            return; // Stop if there are invalid inputs
        }

        userInputPuzzle.push(value);
        if (value !== null) usedNumbers.add(value);
    }

    // Ensure there's exactly one blank cell (null)
    const blankCount = userInputPuzzle.filter(v => v === null).length;
    if (blankCount !== 1) {
        alert('There must be exactly one blank cell.');
        return;
    }

    puzzle = userInputPuzzle;
    if (isSolvable(puzzle)) {
        renderPuzzle(); // Render the puzzle with the collected inputs
    } else {
        alert('The puzzle is not solvable. Please enter valid numbers.');
    }
}

// Function to render the puzzle grid
function renderPuzzle() {
    puzzleGrid.innerHTML = ''; // Clear the existing grid

    puzzle.forEach((number) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        if (number) {
            cell.textContent = number;
        } else {
            cell.classList.add('blank'); // Blank cell
        }

        puzzleGrid.appendChild(cell);
    });
}

// Fisher-Yates shuffle algorithm to randomly shuffle the puzzle
function shufflePuzzle() {
    // Create a solved state
    puzzle = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    puzzle.push(null); // Add the blank tile
    renderPuzzle();

    // Shuffle the puzzle with a maximum of 35 to 60 moves
    const maxShuffleMoves = Math.floor(Math.random() * 36) + 90; // Randomly choose between 35 and 60 moves
    let previousState = [...puzzle]; // Keep track of the previous state
    let currentMoves = 0; // Count the number of moves made

    while (currentMoves < maxShuffleMoves) {
        const neighbors = getNeighbors(previousState); // Get valid moves from the current state
        if (neighbors.length === 0) break; // No more neighbors to move to

        // Choose a random valid neighbor
        const nextMove = neighbors[Math.floor(Math.random() * neighbors.length)];

        // Update the puzzle to the next state
        previousState = nextMove;
        puzzle = previousState;
        currentMoves++;
    }

    renderPuzzle(); // Render the shuffled puzzle
    movesList.innerHTML = ''; // Clear the moves list when the puzzle is shuffled
}



// Check if a puzzle is solvable
function isSolvable(puzzle) {
    let inversions = 0;
    const flatPuzzle = puzzle.filter(n => n !== null); // Flatten the puzzle (ignore the blank)

    for (let i = 0; i < flatPuzzle.length; i++) {
        for (let j = i + 1; j < flatPuzzle.length; j++) {
            if (flatPuzzle[i] > flatPuzzle[j]) inversions++;
        }
    }

    if (size % 2 !== 0) {
        // Odd grid size: Solvable if inversions are even
        return inversions % 2 === 0;
    } else {
        // Even grid size: Solvable if inversions + row of the blank are odd
        const blankRow = Math.floor(findBlank(puzzle) / size);
        return (inversions + blankRow) % 2 === 1;
    }
}

// Function to order the puzzle
function orderPuzzle() {
    puzzle = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    puzzle.push(null); // The last cell is blank
    renderPuzzle();
    movesList.innerHTML = ''; // Clear the moves list when the puzzle is reset
}

// Function to find the position of the blank cell
function findBlank(puzzle) {
    return puzzle.indexOf(null);
}

// A* Solver algorithm to calculate the moves needed to solve the puzzle
// A* Solver algorithm to calculate the moves needed to solve the puzzle
function solvePuzzle() {
    const goalState = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat([null]);
    const result = idaStarSolver(puzzle, goalState);

    if (result.length > 0 && result.length <= 66) { // Check if within the move limit (including initial state)
        const numberOfMoves = result.length - 1;
        alert(`Puzzle solved in ${numberOfMoves} moves.`);
        animateSolution(result);
        displaySolutionMatrices(result); // Display solution matrices
    } else if (result.length > 66) {
        alert('No solution found within 65 moves.');
    } else {
        alert('No solution found.');
    }
}


// Manhattan distance heuristic
function manhattanDistance(state, goalState) {
    let distance = 0;
    const size = Math.sqrt(state.length);

    state.forEach((value, index) => {
        if (value !== null) {
            const goalIndex = goalState.indexOf(value);
            const x1 = Math.floor(index / size);
            const y1 = index % size;
            const x2 = Math.floor(goalIndex / size);
            const y2 = goalIndex % size;
            distance += Math.abs(x1 - x2) + Math.abs(y1 - y2);
        }
    });

    return distance;
}

// Get neighboring states
function getNeighbors(state) {
    const neighbors = [];
    const blankIndex = findBlank(state);
    const size = Math.sqrt(state.length);
    const row = Math.floor(blankIndex / size);
    const col = blankIndex % size;

    // Move directions: up, down, left, right
    const moves = [
        { row: row - 1, col: col, direction: 'up' },    // up
        { row: row + 1, col: col, direction: 'down' },  // down
        { row: row, col: col - 1, direction: 'left' },  // left
        { row: row, col: col + 1, direction: 'right' }, // right
    ];

    for (const move of moves) {
        if (move.row >= 0 && move.row < size && move.col >= 0 && move.col < size) {
            const neighbor = state.slice();
            const targetIndex = move.row * size + move.col;
            [neighbor[blankIndex], neighbor[targetIndex]] = [neighbor[targetIndex], neighbor[blankIndex]];

            // Print the move
            console.log(`Moving ${neighbor[targetIndex]} ${move.direction}`);
            
            neighbors.push(neighbor);
        }
    }

    return neighbors;
}
f// Function to get the moved tile from previous state to current state
function getMovedTile(previousState, currentState) {
    for (let i = 0; i < previousState.length; i++) {
        if (previousState[i] !== currentState[i]) {
            if (currentState[i] !== null) { // Return the tile that moved
                return currentState[i];
            }
        }
    }
    return null;
}

// Function to get the direction of the move
function getMoveDirection(previousState, currentState) {
    const blankIndexPrev = previousState.indexOf(null);
    const blankIndexCurr = currentState.indexOf(null);

    const size = Math.sqrt(previousState.length);
    const prevRow = Math.floor(blankIndexPrev / size);
    const prevCol = blankIndexPrev % size;
    const currRow = Math.floor(blankIndexCurr / size);
    const currCol = blankIndexCurr % size;

    if (prevRow === currRow && prevCol > currCol) return "left";
    if (prevRow === currRow && prevCol < currCol) return "right";
    if (prevRow > currRow && prevCol === currCol) return "up";
    if (prevRow < currRow && prevCol === currCol) return "down";

    return "";
}

// Function to display the move and direction (reversed)
function displayMove(tile, direction) {
    const moveItem = document.createElement('li');

    // Reverse the direction to show the correct move in the moves list
    let displayDirection = '';
    if (direction === "left") displayDirection = "right";
    else if (direction === "right") displayDirection = "left";
    else if (direction === "up") displayDirection = "down";
    else if (direction === "down") displayDirection = "up";

    moveItem.textContent = `Moved tile ${tile} ${displayDirection}`;
    movesList.appendChild(moveItem);
}
// Display solution matrices
function displaySolutionMatrices(solution) {
    const solutionContainer = document.getElementById('solutionContainer'); // Get the solution container
    solutionContainer.innerHTML = ''; // Clear previous solutions

    solution.forEach((step, index) => {
        const matrixDiv = document.createElement('div');
        matrixDiv.classList.add('matrix');
        matrixDiv.style.gridTemplateColumns = `repeat(${size}, 65px)`; // Set columns based on size

        const stepLabel = document.createElement('div');
        stepLabel.classList.add('stepLabel');

        // Label first step as 'Initial State' and last step as 'Goal State'
        if (index === 0) {
            stepLabel.textContent = `Step ${index}: Initial State`; // Label Step 0 as Initial State
        } else if (index === solution.length - 1) {
            stepLabel.textContent = `Step ${index}: Goal State/Solution 👍`; // Label the final step as Goal State
        } else {
            stepLabel.textContent = `Step ${index}`; // Label intermediate steps normally
        }

        solutionContainer.appendChild(stepLabel); // Add label before the matrix

        step.forEach((number) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = number !== null ? number : ''; // Show blank for null
            matrixDiv.appendChild(cell);
        });

        solutionContainer.appendChild(matrixDiv); // Add matrix after label
    });
}
// IDA* solver algorithm
// IDA* solver algorithm
function idaStarSolver(start, goal) {
    const threshold = manhattanDistance(start, goal);
    const path = [start];

    const search = (g, threshold) => {
        const current = path[path.length - 1];
        const f = g + manhattanDistance(current, goal);

        if (f > threshold || g > 64) return f; // Limit to max of 64 moves
        if (current.every((value, index) => value === goal[index])) return 'FOUND';

        let min = Infinity;
        for (const neighbor of getNeighbors(current)) {
            if (!path.some(state => state.every((value, index) => value === neighbor[index]))) {
                path.push(neighbor);
                const t = search(g + 1, threshold);
                if (t === 'FOUND') return 'FOUND';
                if (t < min) min = t;
                path.pop();
            }
        }

        return min;
    };

    let t = threshold;
    while (t !== 'FOUND') {
        t = search(0, t);
        if (t === Infinity) return []; // No solution found
    }

    return path;
}


// Function to animate the solution
function animateSolution(solution) {
    let currentStep = 0;
    movesList.innerHTML = ''; // Clear the moves list before animating

    intervalId = setInterval(() => {
        if (currentStep >= solution.length - 1) {
            clearInterval(intervalId);
            return;
        }

        const previousState = solution[currentStep];
        const currentState = solution[currentStep + 1];
        puzzle = currentState; // Update the puzzle to current state
        renderPuzzle();

        // Get the moved tile and direction
        const movedTile = getMovedTile(previousState, currentState);
        const moveDirection = getMoveDirection(previousState, currentState);
        displayMove(movedTile, moveDirection); // Call the display move function

        currentStep++;
    }, 800); // Adjust the interval for animation speed
}


function stopAnimation() {
    clearInterval(intervalId);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createPuzzle').addEventListener('click', createPuzzle);
    document.getElementById('createInputPuzzle').addEventListener('click', createInputPuzzle);
    document.getElementById('shufflePuzzle').addEventListener('click', shufflePuzzle);
    document.getElementById('orderPuzzle').addEventListener('click', orderPuzzle);
    document.getElementById('solvePuzzle').addEventListener('click', solvePuzzle);
    document.getElementById('stopAnimation').addEventListener('click', stopAnimation);
});
