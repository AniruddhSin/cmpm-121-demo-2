import "./style.css";

const APP_NAME = "Lets Get Sketchy";
const app = document.querySelector<HTMLDivElement>("#app")!;
//const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;


document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>`;

