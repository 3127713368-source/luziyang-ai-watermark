let resultImage = "";

const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let image = new Image();
let isDragging = false;

let startX = 0;
let startY = 0;

let selectedX = 0;
let selectedY = 0;
let selectedWidth = 0;
let selectedHeight = 0;


// 上传图片
upload.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    image.onload = function () {

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );
    };

    image.src = url;
});


// 鼠标按下
canvas.addEventListener("mousedown", function (event) {

    const rect = canvas.getBoundingClientRect();

    startX =
        (event.clientX - rect.left)
        * canvas.width
        / rect.width;

    startY =
        (event.clientY - rect.top)
        * canvas.height
        / rect.height;

    isDragging = true;
});


// 鼠标移动
canvas.addEventListener("mousemove", function (event) {

    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();

    const currentX =
        (event.clientX - rect.left)
        * canvas.width
        / rect.width;

    const currentY =
        (event.clientY - rect.top)
        * canvas.height
        / rect.height;

    selectedX = Math.min(startX, currentX);
    selectedY = Math.min(startY, currentY);

    selectedWidth =
        Math.abs(currentX - startX);

    selectedHeight =
        Math.abs(currentY - startY);

    // 重新绘制图片
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // 绘制选择框
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;

    ctx.strokeRect(
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );
});


// 鼠标松开
canvas.addEventListener("mouseup", function () {

    isDragging = false;

    console.log(
        "选择区域:",
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );
});


// AI 去水印
async function processImage() {

    const file = upload.files[0];

    if (!file) {

        alert("请先上传图片");

        return;
    }

    if (
        selectedWidth <= 0 ||
        selectedHeight <= 0
    ) {

        alert("请先用鼠标框选水印区域");

        return;
    }

    alert("LZY AI 正在处理中...");

    // 下一步这里会连接真正的 AI
}


// 下载
function downloadImage() {

    if (!resultImage) {

        alert("请先处理图片");

        return;
    }

    const a = document.createElement("a");

    a.href = resultImage;

    a.download = "LZY-result.png";

    a.click();
}
