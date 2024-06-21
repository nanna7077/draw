// import { isAIReady, processAnswer } from './textprocess.js';

let currentColor = 'black';
let currentThickness = 2;
let isDrawing = false;
let x = 0;
let y = 0;
let isErasing = false;
let trace = [];
let typed = [];
let currentStroke = [];
let currentPageIndex = 0;
let idleTimeout;
const storageKey = 'drawAppData';

const canvasContainer = document.getElementById('canvasContainer');
const customColor = document.getElementById('customColor');
const thickness = document.getElementById('thickness');
const newPageButton = document.getElementById('newPage');
const nextPageButton = document.getElementById('nextPage');
const prevPageButton = document.getElementById('prevPage');
const eraserButton = document.getElementById('eraser');
const colorButtons = document.querySelectorAll('.color');
const appColorButton = document.getElementById('appColor');

colorButtons.forEach(button => {
    button.addEventListener('click', (ev) => {
        ev.target.style.height = '34px';
        ev.target.style.width = '34px';
        ev.target.style.border = '2px solid black';
        for (const otherButton of colorButtons) {
            if (otherButton !== ev.target) {
                otherButton.style.height = '30px';
                otherButton.style.width = '30px';
                otherButton.style.border = 'none';
            }
        }
        currentColor = button.style.backgroundColor;
        isErasing = false;
    });
});

customColor.addEventListener('input', () => {
    currentColor = customColor.value;
    isErasing = false;
});

thickness.addEventListener('input', () => {
    currentThickness = thickness.value;
});

eraserButton.addEventListener('click', () => {
    isErasing = true;
});

newPageButton.addEventListener('click', () => {
    createNewCanvasPage();
    scrollToPage(canvasContainer.children.length - 1);
});

nextPageButton.addEventListener('click', () => {
    scrollToPage(currentPageIndex + 1);
});

prevPageButton.addEventListener('click', () => {
    scrollToPage(currentPageIndex - 1);
});

appColorButton.addEventListener('change', () => {
    document.body.style.backgroundColor = appColorButton.value;
});

window.addEventListener('beforeunload', saveToLocalStorage);

canvasContainer.addEventListener('scrollend', () => {
    currentPageIndex = Math.max(0, Math.min(canvasContainer.children.length - 1, Math.floor(canvasContainer.scrollLeft / canvasContainer.children[0].offsetWidth)));
});

window.addEventListener('keydown', (e) => {
    const ctx = canvasContainer.children[currentPageIndex].querySelector('canvas').getContext('2d');
    ctx.font = `${currentThickness * 10}px cursive`;
    ctx.fillStyle = currentColor;

    if (e.key.length === 1) {
        ctx.fillText(e.key, x, y);
        typed.push(e.key);
        x += ctx.measureText(e.key).width + 2;

        if (x > ctx.canvas.width - 10) {
            x = 10;
            y += currentThickness * 15;
        }
    } else if (e.key === 'Backspace') {
        handleBackspace(ctx);
    }
    resetIdleTimer();
});

function handleBackspace(ctx) {
    const textWidth = ctx.measureText(' ').width;
    const canvasData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (x <= 10 && y > 60) {
        y -= currentThickness * 15;
        x = ctx.canvas.width - 10; 
    } else if (x > 10) {
        x -= textWidth;
    }
    typed.pop();
    
    ctx.putImageData(canvasData, 0, 0);
    ctx.clearRect(x, y - currentThickness * 10, textWidth, currentThickness * 15);

}

function createNewCanvasPage(width = window.innerWidth, height = window.innerHeight - document.getElementById('toolbar').offsetHeight) {
    const page = document.createElement('div');
    page.className = 'page';

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    page.appendChild(canvas);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'deletePage';
    deleteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 30 30">
    <path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"></path>
    </svg>`;
    deleteButton.addEventListener('click', () => {
        const index = Array.from(canvasContainer.children).indexOf(page);
        canvasContainer.removeChild(page);
        if (index === currentPageIndex) {
            currentPageIndex = Math.max(0, currentPageIndex - 1);
        }
        if (canvasContainer.children.length === 0) {
            createNewCanvasPage();
        }
        scrollToPage(currentPageIndex);
        saveToLocalStorage();
    });
    page.appendChild(deleteButton);

    canvasContainer.appendChild(page);
    const ctx = canvas.getContext('2d');

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        x = e.offsetX;
        y = e.offsetY;
        currentStroke = [[], []];
        resetIdleTimer();
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        if (currentStroke[0].length > 0 && currentStroke[1].length > 0) {
            trace.push(currentStroke);
            resetIdleTimer();
        }
        saveToLocalStorage();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            if (isErasing) {
                erase(ctx, x, y, e.offsetX, e.offsetY);
            } else {
                drawLine(ctx, x, y, e.offsetX, e.offsetY);
                currentStroke[0].push(e.offsetX);
                currentStroke[1].push(e.offsetY);
            }
            x = e.offsetX;
            y = e.offsetY;
            resetIdleTimer();
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
        currentStroke = [[], []];
        resetIdleTimer();
    });

    canvas.addEventListener('touchend', () => {
        isDrawing = false;
        if (currentStroke[0].length > 0 && currentStroke[1].length > 0) {
            trace.push(currentStroke);
            resetIdleTimer();
        }
        saveToLocalStorage();
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const newX = e.touches[0].clientX - rect.left;
            const newY = e.touches[0].clientY - rect.top;
            if (isErasing) {
                erase(ctx, x, y, newX, newY);
            } else {
                drawLine(ctx, x, y, newX, newY);
                currentStroke[0].push(newX);
                currentStroke[1].push(newY);
            }
            x = newX;
            y = newY;
            resetIdleTimer();
        }
    });
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentThickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}

function erase(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = document.body.style.backgroundColor || 'white';
    ctx.lineWidth = currentThickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}

function scrollToPage(index) {
    if (index < 0 || index >= canvasContainer.children.length) return;
    currentPageIndex = index;
    canvasContainer.scrollTo({
        left: canvasContainer.children[index].offsetLeft,
        behavior: 'smooth'
    });
}

function getPagesAsJSON() {
    const pages = Array.from(canvasContainer.children).map(page => {
        const canvas = page.querySelector('canvas');
        const deleteButton = page.querySelector('.deletePage');
        return {
            imageData: canvas.toDataURL(),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            deleteButtonVisible: window.getComputedStyle(deleteButton).display !== 'none'
        };
    });
    return pages;
}

function restorePagesFromJSON(pagesData) {
    canvasContainer.innerHTML = '';
    pagesData.forEach(pageData => {
        createNewCanvasPage(pageData.canvasWidth, pageData.canvasHeight);
        const canvas = canvasContainer.lastChild.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => {
            ctx.drawImage(image, 0, 0);
        };
        image.src = pageData.imageData;
        canvasContainer.lastChild.querySelector('.deletePage').style.display = pageData.deleteButtonVisible ? '' : 'none';
    });
    scrollToPage(0);
}

function saveToLocalStorage() {
    const pagesData = getPagesAsJSON();
    localStorage.setItem(storageKey, JSON.stringify(pagesData));
    localStorage.setItem('currentPageIndex', currentPageIndex);
    localStorage.setItem('currentAppColor', appColorButton.value);
    localStorage.setItem('currentColor', currentColor);
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        const pagesData = JSON.parse(savedData);
        restorePagesFromJSON(pagesData);
        const savedPageIndex = localStorage.getItem('currentPageIndex');
        if (savedPageIndex) currentPageIndex = parseInt(savedPageIndex);
        const savedColor = localStorage.getItem('currentAppColor');
        if (savedColor) {
            appColorButton.value = savedColor;
            document.body.style.backgroundColor = savedColor;
        }
        const savedColor2 = localStorage.getItem('currentColor');
        if (savedColor2) currentColor = savedColor2;
    }
}

function saveDocument() {
    const pagesData = getPagesAsJSON();
    const blob = new Blob([JSON.stringify(pagesData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.json';
    link.click();
    URL.revokeObjectURL(url);
}

function loadDocument(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const pagesData = JSON.parse(e.target.result);
        restorePagesFromJSON(pagesData);
    };
    reader.readAsText(file);
}

function detect(text, renderfsize = 48) {
    function renderAnswer(value, renderfsize) {
        const ctx = canvasContainer.children[currentPageIndex].querySelector('canvas').getContext('2d');
        ctx.font = `${renderfsize}px cursive`;
        ctx.fillStyle = currentColor;
        ctx.fillText(value, x + 10, y);
    }

    try {
        const convres = convertUnits(text);
        if (convres) {
            renderAnswer(convres, renderfsize);
            return;
        }
    } catch (error) {
        // do nothing
    }

    try {
        const mathres = evaluateEquation(text);
        if (mathres) {
            renderAnswer(mathres, renderfsize);
            return;
        }
    } catch (error) {
        // do nothing
    }
}

function recognizeHandwriting() {
    if (trace.length === 0) return;

    handwriting.recognize(trace, { language: 'en' }, (results, err) => {
        if (err) {
            console.error('Handwriting recognition error:', err);
        } else {
            try {
                detect(results[0]);
            } catch (error) {
                console.error(error);
           }
            trace = [];
        }
    });
}

function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        if (trace.length > 0) {
            recognizeHandwriting();
        }
        if (typed.length > 0) {
            detect(typed.join('').trim(), currentThickness * 10);
            typed = [];
        }
    }, 2000);
}

createNewCanvasPage();
loadFromLocalStorage();
