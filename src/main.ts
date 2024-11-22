import "./style.css";

const APP_NAME = "Let's Get Sketchy";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const canvas_ctx = canvas.getContext("2d")!;
canvas_ctx.font = "13px sans-serif";

// Get slider values and update text
const rotationSlider: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#rotationSlider');
const rotationOutput: HTMLOutputElement | null = document.querySelector<HTMLOutputElement>('#outputValue');
if (rotationSlider && rotationOutput) {
    rotationSlider.addEventListener('input', () => {
        rotationOutput.innerHTML = rotationSlider.value;
    });
}

enum Brush {
    thin = 2,
    thick = 4
};
let currentBrush: Brush = Brush.thin;
let currentSticker: string = "";
const bus = new EventTarget();

function notifyBus(eventName: string) {
    bus.dispatchEvent(new Event(eventName));
}

bus.addEventListener("drawing_changed", redraw);
bus.addEventListener("tool_moved", redraw);

type Point = {
    x: number,
    y: number
}
type Line = Point[];

interface DrawableObject {
    drag(point: Point): void,
    display(ctx: CanvasRenderingContext2D): void
}

class MarkerLine implements DrawableObject {
    line: Line;
    lineWidth: number;
    color: string;

    constructor(point: Point, lineWidth: number, color: string) {
        this.line = [point];
        this.lineWidth = lineWidth;
        this.color = color;
    }
    drag(point: Point) {
        this.line.push(point);
    }
    display(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        if (this.line.length > 0) {
            const { x, y } = this.line[0];
            ctx.moveTo(x, y);
        } else {
            return;
        }
        for (const point of this.line) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }
}

class StickerObject implements DrawableObject {
    x: number;
    y: number;
    sticker: string;
    rotation: number;

    constructor(point: Point, sticker: string, rotation: number) {
        this.x = point.x;
        this.y = point.y;
        this.sticker = sticker;
        this.rotation = rotation * Math.PI / 180;
    }
    drag(point: Point) {
        this.x = point.x;
        this.y = point.y;
    }
    display(ctx: CanvasRenderingContext2D): void {
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation);
        const textMetric = ctx.measureText(this.sticker);
        const textWidth = textMetric.width;
        const textHeight = textMetric.actualBoundingBoxAscent - textMetric.actualBoundingBoxDescent;
        ctx.fillText(this.sticker, -textWidth / 2, -textHeight / 2);
        ctx.resetTransform();
    }
}

interface CursorCommand {
    x: number,
    y: number,
    moved(point: Point): void,
    draw(ctx: CanvasRenderingContext2D): void
}

abstract class BasicCursor implements CursorCommand {
    x: number;
    y: number;
    constructor() {
        this.x = 2 * canvas.width;
        this.y = 2 * canvas.height;
    }
    moved(point: Point) {
        this.x = point.x;
        this.y = point.y;
        notifyBus("tool_moved");
    }
    abstract draw(ctx: CanvasRenderingContext2D): void
}

class BrushCursor extends BasicCursor {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.fillStyle = currentColor;
        ctx.arc(this.x, this.y, currentBrush, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class StickerCursor extends BasicCursor {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.translate(this.x, this.y)
        const radians = +rotationSlider!.value * Math.PI / 180;
        ctx.rotate(radians);
        const textMetric = ctx.measureText(currentSticker);
        const textWidth = textMetric.width;
        const textHeight = textMetric.actualBoundingBoxAscent - textMetric.actualBoundingBoxDescent;
        ctx.fillText(currentSticker, -textWidth / 2, -textHeight / 2);
        ctx.resetTransform();
    }
}

const lines: DrawableObject[] = [];
const _redoStack: DrawableObject[] = [];
let _currentDraw: DrawableObject | null = null;
let cursorCommand: BasicCursor = new BrushCursor;

// Add button to clear Canvas
const editButtonsContainer = document.createElement("div");
document.body.append(editButtonsContainer);
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
clearButton.addEventListener("click", () => {
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0;
    _redoStack.length = 0;
});
editButtonsContainer.append(clearButton);

// Add undo and redo buttons
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
editButtonsContainer.append(undoButton);
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        _redoStack.push(lines.pop()!);
        notifyBus("drawing_changed");
    }
});
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
editButtonsContainer.append(redoButton);
redoButton.addEventListener("click", () => {
    if (_redoStack.length > 0) {
        lines.push(_redoStack.pop()!);
        notifyBus("drawing_changed");
    }
});

// Add buttons to change drawn line width
const brushContainer: HTMLDivElement = document.createElement("div");
document.body.append(brushContainer);
const brushContainerLabel: HTMLHeadingElement = document.createElement("h2");
brushContainerLabel.innerText = "Brushes";
brushContainerLabel.style.textAlign = "center";
brushContainer.append(brushContainerLabel);

// Add color picker container after brush container is defined
const colorContainer = document.createElement("div");
document.body.insertBefore(colorContainer, brushContainer);
const colorLabel = document.createElement("h2");
colorLabel.innerText = "Color";
colorLabel.style.textAlign = "center";
colorContainer.append(colorLabel);

// Add color picker
const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.value = "#000000"; // Default black color
colorContainer.append(colorPicker);

let currentColor = "#000000";
colorPicker.addEventListener('input', (e) => {
    currentColor = (e.target as HTMLInputElement).value;
});

// Create a button with a label and click handler
function createButton(
    parent: HTMLElement,
    label: string,
    clickHandler: () => void
): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = label;
    button.addEventListener("click", clickHandler);
    parent.append(button);
    return button;
}

// Add buttons to change brush width
createButton(brushContainer, "thin", () => {
    currentBrush = Brush.thin;
    cursorCommand = new BrushCursor();
});
createButton(brushContainer, "thick", () => {
    currentBrush = Brush.thick;
    cursorCommand = new BrushCursor();
});

function _createDrawableObject(location: Point): DrawableObject {
    if (cursorCommand instanceof StickerCursor) {
        return new StickerObject(location, currentSticker, +rotationSlider!.value);
    } else {
        return new MarkerLine(location, currentBrush, currentColor);
    }
}

// Add mouse detection to Canvas
canvas.addEventListener("mousedown", (e) => {
    const location: Point = { x: e.offsetX, y: e.offsetY };
    _currentDraw = _createDrawableObject(location);
    _redoStack.length = 0;
    lines.push(_currentDraw);
    notifyBus("drawing_changed");
});

canvas.addEventListener("mousemove", (e) => {
    const location: Point = { x: e.offsetX, y: e.offsetY };
    if (e.buttons == 1) {
        _currentDraw!.drag(location);
        notifyBus("drawing_changed");
    }
    cursorCommand!.moved(location);
});

canvas.addEventListener("mouseup", () => {
    _currentDraw = null;
});

canvas.addEventListener("mouseenter", (e) => {
    cursorCommand.moved({ x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener("mouseleave", () => {
    cursorCommand.moved({ x: 2 * canvas.width, y: 2 * canvas.height });
});

// Add div to hold sticker buttons
const stickerContainer: HTMLDivElement = document.createElement("div");
document.body.append(stickerContainer);
const stickerContainerLabel: HTMLHeadingElement = document.createElement("h2");
stickerContainerLabel.innerText = "Stickers";
stickerContainerLabel.style.textAlign = "center";
stickerContainer.append(stickerContainerLabel);

const addStickerButton = document.createElement("button");
addStickerButton.innerText = "Add Sticker";
addStickerButton.style.filter = "drop-shadow(0 0 0.3rem purple)";
stickerContainer.append(addStickerButton);
addStickerButton.addEventListener("click", () => {
    const possibleSticker = prompt("Enter Sticker");
    if (possibleSticker) {
        addSticker(possibleSticker);
    }
});

// Create new Sticker Button with given string
function addSticker(sticker: string) {
    const newStickerButton = document.createElement("button");
    newStickerButton.innerHTML = sticker;
    newStickerButton.addEventListener("click", () => {
        currentSticker = sticker;
        cursorCommand = new StickerCursor();
    });
    stickerContainer.append(newStickerButton);
}

addSticker("⭐");
addSticker("💜");
addSticker("💀");

// Add button to export high res image
const exportButton = document.createElement("button");
exportButton.innerText = "Export (PNG)";
app.append(exportButton);
exportButton.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.style.backgroundColor = "white";
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const export_ctx = exportCanvas.getContext("2d")!;
    export_ctx.scale(4, 4);

    for (const line of lines) {
        line.display(export_ctx);
    }
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
});

function redraw() {
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
        line.display(canvas_ctx);
    }
    if (cursorCommand) {
        cursorCommand.draw(canvas_ctx);
    }
}