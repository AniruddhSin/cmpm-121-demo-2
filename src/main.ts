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

document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;

// Add mouse detection to Canvas
canvas.addEventListener("mousedown", (e)=>{
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    console.log("mouse down on canvas")
})
canvas.addEventListener("mousemove", (e)=>{
    if (cursor.active){
        canvas_ctx.beginPath();
        canvas_ctx.moveTo(cursor.x, cursor.y);
        canvas_ctx.lineTo(e.offsetX, e.offsetY);
        canvas_ctx.stroke();
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
})
canvas.addEventListener("mouseup", ()=>{
    cursor.active = false;
})

// Add button to clear Canvas
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
clearButton.addEventListener("click", ()=>{
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height);
})
document.body.append(clearButton);

