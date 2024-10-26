import "./style.css";

const APP_NAME = "Lets Get Sketchy";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const canvas_ctx = canvas.getContext("2d")!;
canvas_ctx.font = "13px sans-serif";
enum Brush{
    thin = 2,
    thick = 4
};
let currentBrush: Brush = Brush.thin;
let currentSticker: string = "";
const bus = new EventTarget();
/* Possible Event Names:
drawing_changed
tool_moved
*/
function notifyBus (eventName: string){
    bus.dispatchEvent(new Event(eventName));
}
//bus.addEventListener("drawing_changed", refresh(canvas,canvas_ctx));
//bus.addEventListener("tool_moved", refresh(canvas,canvas_ctx));
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
class MarkerLine implements DrawableObject{
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
class StickerObject implements DrawableObject{
    x: number;
    y: number;
    sticker: string;

    constructor (point: Point, sticker: string){
        this.x = point.x;
        this.y = point.y;
        this.sticker = sticker;
    }
    drag(point: Point){
        this.x = point.x;
        this.y = point.y;
    }
    display(ctx: CanvasRenderingContext2D): void {
        ctx.fillText(this.sticker, this.x-7, this.y+4);
    }
}

interface CursorCommand{
    x: number,
    y: number,
    moved(point: Point): void,
    draw(ctx: CanvasRenderingContext2D): void
}
abstract class BasicCursor implements CursorCommand{
    x: number;
    y: number;
    constructor(){
        this.x = 2*canvas.width;
        this.y = 2*canvas.height;
    }
    moved(point: Point){
        this.x = point.x;
        this.y = point.y;
        notifyBus("tool_moved");
    }
    abstract draw(ctx: CanvasRenderingContext2D): void
}
class BrushCursor extends BasicCursor{
    draw(ctx: CanvasRenderingContext2D){
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentBrush, 0, 2*Math.PI);
        ctx.fill();
    }
}
class StickerCursor extends BasicCursor{
    draw(ctx: CanvasRenderingContext2D){
        //ctx.font = "64px"
        ctx.fillText(currentSticker, this.x-7, this.y+4);
    }
}

const lines: DrawableObject[]= [];
const redoStack: DrawableObject[] = [];
let currentDraw: DrawableObject | null = null;
let cursorCommand: BasicCursor = new BrushCursor;

// Add mouse detection to Canvas
canvas.addEventListener("mousedown", (e)=>{
    const location: Point = {x: e.offsetX, y: e.offsetY};
    if (cursorCommand instanceof StickerCursor){
        currentDraw = new StickerObject(location, currentSticker);
    }else{
        currentDraw = new MarkerLine(location, currentBrush);       // default to marker if cannot compute selected cursor
    }
    redoStack.length = 0;
    lines.push(currentDraw);

    notifyBus("drawing_changed");
})
canvas.addEventListener("mousemove", (e)=>{
    const location: Point = {x: e.offsetX, y:e.offsetY};
    if (e.buttons == 1){
        currentDraw!.drag(location);
        notifyBus("drawing_changed");
    }
    cursorCommand!.moved(location);
})
canvas.addEventListener("mouseup", ()=>{
    currentDraw = null;
})
canvas.addEventListener("mouseenter", (e)=>{
    cursorCommand.moved({x: e.offsetX, y: e.offsetY});                // Change to be based on selection
})
canvas.addEventListener("mouseleave", ()=>{
    cursorCommand.moved({x: 2*canvas.width,y: 2*canvas.height});
})


// Add button to clear Canvas
const editButtonsContainer = document.createElement("div");
document.body.append(editButtonsContainer);
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
clearButton.addEventListener("click", ()=>{
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0;
    redoStack.length = 0;
})
editButtonsContainer.append(clearButton);

// Add undo and redo buttons
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
editButtonsContainer.append(undoButton);
undoButton.addEventListener("click", ()=>{
    if (lines.length > 0){
        redoStack.push(lines.pop()!);
        notifyBus("drawing_changed");
    }
})
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
editButtonsContainer.append(redoButton);
redoButton.addEventListener("click", ()=>{
    if (redoStack.length > 0){
        lines.push(redoStack.pop()!);
        notifyBus("drawing_changed");
    }
})


// Add buttons to change drawn line width
const brushContainer: HTMLDivElement = document.createElement("div");
document.body.append(brushContainer);
const thinBrushButton = document.createElement("button");
thinBrushButton.innerHTML = "thin";
brushContainer.append(thinBrushButton);
thinBrushButton.addEventListener("click", ()=>{
    currentBrush = Brush.thin;
    cursorCommand = new BrushCursor();
})
const thickBrushButton = document.createElement("button");
thickBrushButton.innerHTML = "thick";
brushContainer.append(thickBrushButton);
thickBrushButton.addEventListener("click", ()=>{
    currentBrush = Brush.thick;
    cursorCommand = new BrushCursor();
})

// Add div to hold sticker buttons
const stickerContainer: HTMLDivElement = document.createElement("div");
document.body.append(stickerContainer);
const addStickerButton = document.createElement("button");
//addStickerButton.id = "canvas";
addStickerButton.innerText = "Add Sticker";
addStickerButton.style.filter = "drop-shadow(0 0 0.3rem purple)";
stickerContainer.append(addStickerButton);
addStickerButton.addEventListener("click",()=>{
    const possibleSticker = prompt("Enter Sticker");
    if (possibleSticker){
        addSticker(possibleSticker);
    }
})
// Create new Sticker Button with given string
function addSticker(sticker: string){
    const newStickerButton = document.createElement("button");
    newStickerButton.innerHTML = sticker;
    newStickerButton.addEventListener("click",()=>{
        currentSticker = sticker;
        cursorCommand = new StickerCursor();
    })
    stickerContainer.append(newStickerButton);
}
addSticker("⭐");
addSticker("💜");
addSticker("💀");


// Add button to export high res image
const exportButton = document.createElement("button");
exportButton.innerText = "Export";
document.body.append(exportButton);
exportButton.addEventListener("click", ()=>{
    const exportCanvas = document.createElement("canvas");
    exportCanvas.style.backgroundColor = "white";
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const export_ctx = exportCanvas.getContext("2d")!;
    export_ctx.scale(4,4);

    for (const line of lines){
        line.display(export_ctx);
    }
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();

})

// define how to redraw canvas
function redraw(){
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines){
        line.display(canvas_ctx);
    }
    if (cursorCommand){
        cursorCommand.draw(canvas_ctx);
    }
}