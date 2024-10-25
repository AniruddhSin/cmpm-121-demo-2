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
interface straightLine{
    x: number,
    y: number
}
const lines: straightLine[][]= [];
let currentLine: straightLine[] = [];

document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;

// Add mouse detection to Canvas
canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    
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
})
document.body.append(clearButton);

