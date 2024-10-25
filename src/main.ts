import "./style.css";

const APP_NAME = "Lets Get Sketchy";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const canvas_ctx = canvas.getContext("2d")!;
let mouseHeld: boolean = false;
enum Brushes{
    thin = 1,
    thick = 3
};
let currentBrush: number = Brushes.thin;          // Index for which brush from possibleBrushes is selected
const drawing_changed = new Event("drawing_changed")
type Point = {
    x: number,
    y: number
}
type Line = Point[];
interface LineObject {
    line: Line,
    drag(point: Point): void,
    display(ctx: CanvasRenderingContext2D): void
}
class MarkerLine implements LineObject{
    line: Line;
    lineWidth: number;

    constructor (point: Point, lineWidth: number){
        this.line = [point];
        this.lineWidth = lineWidth;
    }
    drag(point: Point){
        this.line.push(point);
    }
    display(ctx: CanvasRenderingContext2D){
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        if (this.line.length > 0){
            const {x,y} = this.line[0];
            ctx.moveTo(x,y);
        }else{
            return;
        }
        for (const point of this.line){
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }

}
const lines: MarkerLine[]= [];
let currentLine: MarkerLine | null;
const redoStack: MarkerLine[] = [];

// Add mouse detection to Canvas
canvas.addEventListener("mousedown", (e)=>{
    mouseHeld = true;
    currentLine = new MarkerLine({x: e.offsetX, y: e.offsetY}, currentBrush);
    redoStack.length = 0;
    lines.push(currentLine);

    canvas.dispatchEvent(drawing_changed);
})
canvas.addEventListener("mousemove", (e)=>{
    if (mouseHeld){
        currentLine!.drag({x: e.offsetX, y:e.offsetY})

        canvas.dispatchEvent(drawing_changed);
    }
})
canvas.addEventListener("mouseup", ()=>{
    mouseHeld = false;
    currentLine = null;
})

// Add redraw event to canvas
canvas.addEventListener("drawing_changed", ()=>{
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines){  // line is a MarkerLine object
        line.display(canvas_ctx);
    }
})


// Add button to clear Canvas
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
clearButton.addEventListener("click", ()=>{
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0;
    redoStack.length = 0;
})
document.body.append(clearButton);

// Add undo and redo buttons
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);
undoButton.addEventListener("click", ()=>{
    if (lines.length > 0){
        redoStack.push(lines.pop()!);
        canvas.dispatchEvent(drawing_changed);
    }
})

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);
redoButton.addEventListener("click", ()=>{
    if (redoStack.length > 0){
        lines.push(redoStack.pop()!);
        canvas.dispatchEvent(drawing_changed);
    }
})

// Add buttons to change drawn line width
const brushContainer: HTMLDivElement = document.createElement("div");
document.body.append(brushContainer);

const thinBrushButton = document.createElement("button");
thinBrushButton.innerHTML = "thin";
brushContainer.append(thinBrushButton);
thinBrushButton.addEventListener("click", ()=>{
    currentBrush = Brushes.thin;
})

const thickBrushButton = document.createElement("button");
thickBrushButton.innerHTML = "thick";
brushContainer.append(thickBrushButton);
thickBrushButton.addEventListener("click", ()=>{
    currentBrush = Brushes.thick;
})