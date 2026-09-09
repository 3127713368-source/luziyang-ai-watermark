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


// =========================
// 上传图片
// =========================

upload.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    resultImage = "";

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


// =========================
// 鼠标开始选择
// =========================

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


// =========================
// 鼠标移动
// =========================

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


    // 红色选择框
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;

    ctx.strokeRect(
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );

});


// =========================
// 鼠标结束选择
// =========================

canvas.addEventListener("mouseup", function () {

    isDragging = false;

});


// =========================
// 创建 Mask
// =========================

function createMask() {

    const maskCanvas =
        document.createElement("canvas");

    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    const maskCtx =
        maskCanvas.getContext("2d");


    // 黑色背景
    maskCtx.fillStyle = "black";

    maskCtx.fillRect(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
    );


    // 白色 = 需要 AI 修复的区域
    maskCtx.fillStyle = "white";

    maskCtx.fillRect(
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );


    return maskCanvas.toDataURL("image/png");

}


// =========================
// AI 去水印
// =========================

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


    try {

        alert("LZY AI 正在处理中，请稍候...");


        const maskData =
            createMask();


        const formData =
            new FormData();


        formData.append(
            "image",
            file
        );


        formData.append(
            "mask",
            maskData
        );


        const response =
            await fetch(
                "/.netlify/functions/remove-watermark",
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "AI处理失败"
            );

        }


        if (!result.image) {

            throw new Error(
                "AI没有返回图片"
            );

        }


        resultImage =
            result.image;


        // 显示 AI 结果
        image.onload = function () {

            canvas.width =
                image.width;

            canvas.height =
                image.height;

            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

        };


        image.src =
            resultImage;


        alert("AI 去水印完成！");


    } catch (error) {

        console.error(error);

        alert(
            "AI处理失败：\n" +
            error.message
        );

    }

}


// =========================
// 下载
// =========================

function downloadImage() {

    if (!resultImage) {

        alert("请先完成 AI 去水印");

        return;
    }


    const a =
        document.createElement("a");


    a.href =
        resultImage;


    a.download =
        "LZY-result.png";


    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

}
