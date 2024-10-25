import "./style.css";

const APP_NAME = "Lets Get Sketchy";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const canvas_ctx = canvas.getContext("2d")!;
const cursor = {
    active: false,
    x: 0,
    y: 0
};
const drawing_changed = new Event("drawing_changed")
interface Point{
    x: number,
    y: number
}
const lines: Point[][]= [];
let currentLine: Point[] = [];
const redoStack: Point[][] = [];

document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;

// Add mouse detection to Canvas
canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    
    redoStack.length = 0;
    currentLine.push({x: cursor.x, y: cursor.y});
    lines.push(currentLine);

    canvas.dispatchEvent(drawing_changed);
})
canvas.addEventListener("mousemove", (e)=>{
    if (cursor.active){
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentLine.push({x: cursor.x, y:cursor.y});

        canvas.dispatchEvent(drawing_changed);
    }
})
canvas.addEventListener("mouseup", ()=>{
    cursor.active = false;
    currentLine = [];
})

// Add redraw event to canvas
canvas.addEventListener("drawing_changed", ()=>{
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines){
        if (line.length >= 2){
            canvas_ctx.beginPath();
            const {x,y} = line[0];
            canvas_ctx.moveTo(x, y);
            for (const {x,y} of line){
                canvas_ctx.lineTo(x,y)
            }
            canvas_ctx.stroke();
        }
    }
})


// Add button to clear Canvas
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
clearButton.addEventListener("click", ()=>{
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0;
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
