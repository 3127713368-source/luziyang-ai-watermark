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

    const file = upload.files[0];

    if (!file) {
        return;
    }

    resultImage = "";

    selectedWidth = 0;
    selectedHeight = 0;

    const url = URL.createObjectURL(file);

    image.onload = function () {

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

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

        URL.revokeObjectURL(url);
    };

    image.src = url;
});


// =========================
// 鼠标按下
// =========================

canvas.addEventListener("mousedown", function (event) {

    if (!image.src) {
        return;
    }

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

    selectedX = startX;
    selectedY = startY;
    selectedWidth = 0;
    selectedHeight = 0;

});


// =========================
// 鼠标移动
// =========================

canvas.addEventListener("mousemove", function (event) {

    if (!isDragging) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const currentX =
        (event.clientX - rect.left)
        * canvas.width
        / rect.width;

    const currentY =
        (event.clientY - rect.top)
        * canvas.height
        / rect.height;


    selectedX =
        Math.min(startX, currentX);

    selectedY =
        Math.min(startY, currentY);

    selectedWidth =
        Math.abs(currentX - startX);

    selectedHeight =
        Math.abs(currentY - startY);


    // 重新绘制原图

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


    // 绘制红色选择框

    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;

    ctx.strokeRect(
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );

});


// =========================
// 鼠标松开
// =========================

canvas.addEventListener("mouseup", function () {

    isDragging = false;

});


// =========================
// 鼠标离开 Canvas
// =========================

canvas.addEventListener("mouseleave", function () {

    isDragging = false;

});


// =========================
// 创建 Mask
// =========================

function createMask() {

    const maskCanvas =
        document.createElement("canvas");

    maskCanvas.width =
        canvas.width;

    maskCanvas.height =
        canvas.height;

    const maskCtx =
        maskCanvas.getContext("2d");


    // 黑色 = 不处理

    maskCtx.fillStyle = "black";

    maskCtx.fillRect(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
    );


    // 白色 = AI 修复区域

    maskCtx.fillStyle = "white";

    maskCtx.fillRect(
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );


    return maskCanvas.toDataURL(
        "image/png"
    );

}


// =========================
// 图片转 Base64
// =========================

function fileToDataURL(file) {

    return new Promise(function (resolve, reject) {

        const reader =
            new FileReader();

        reader.onload = function () {

            resolve(reader.result);

        };

        reader.onerror = function () {

            reject(
                new Error("图片读取失败")
            );

        };

        reader.readAsDataURL(file);

    });

}


// =========================
// AI 去水印
// =========================

async function processImage() {

    const file =
        upload.files[0];


    if (!file) {

        alert("请先上传图片");

        return;

    }


    if (
        selectedWidth <= 0 ||
        selectedHeight <= 0
    ) {

        alert(
            "请先用鼠标框选水印区域"
        );

        return;

    }


    try {

        alert(
            "LZY AI 正在处理中，请稍候..."
        );


        // 原始图片

        const imageData =
            await fileToDataURL(file);


        // Mask

        const maskData =
            createMask();


        // 发送到 Netlify

        const response =
            await fetch(
                "/.netlify/functions/remove-watermark",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        image: imageData,

                        mask: maskData

                    })
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


        // 保存结果

        resultImage =
            result.image;


        // 显示 AI 结果

        image.onload =
            function () {

                canvas.width =
                    image.naturalWidth;

                canvas.height =
                    image.naturalHeight;

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

            };


        image.src =
            resultImage;


        alert(
            "LZY AI 去水印完成！"
        );

    }
    catch (error) {

        console.error(
            "LZY AI Error:",
            error
        );


        alert(
            "AI处理失败：\n" +
            error.message
        );

    }

}


// =========================
// 下载图片
// =========================

function downloadImage() {

    if (!resultImage) {

        alert(
            "请先完成 AI 去水印"
        );

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
