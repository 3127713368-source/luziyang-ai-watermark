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

    if (!file) return;

    resultImage = "";

    selectedX = 0;
    selectedY = 0;
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
// 获取鼠标 / 手指在图片上的坐标
// =========================

function getPosition(clientX, clientY) {

    const rect = canvas.getBoundingClientRect();

    let x =
        (clientX - rect.left)
        * canvas.width
        / rect.width;

    let y =
        (clientY - rect.top)
        * canvas.height
        / rect.height;

    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));

    return {
        x: x,
        y: y
    };
}


// =========================
// 开始选择
// =========================

function startSelection(clientX, clientY) {

    if (!image.src) return;

    const position =
        getPosition(clientX, clientY);

    startX = position.x;
    startY = position.y;

    selectedX = startX;
    selectedY = startY;

    selectedWidth = 0;
    selectedHeight = 0;

    isDragging = true;
}


// =========================
// 移动选择框
// =========================

function moveSelection(clientX, clientY) {

    if (!isDragging) return;

    const position =
        getPosition(clientX, clientY);

    const currentX = position.x;
    const currentY = position.y;

    selectedX =
        Math.min(startX, currentX);

    selectedY =
        Math.min(startY, currentY);

    selectedWidth =
        Math.abs(currentX - startX);

    selectedHeight =
        Math.abs(currentY - startY);


    // 重画原图

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
    ctx.lineWidth = 5;

    ctx.strokeRect(
        selectedX,
        selectedY,
        selectedWidth,
        selectedHeight
    );
}


// =========================
// 结束选择
// =========================

function stopSelection() {

    isDragging = false;

}


// =========================
// 电脑鼠标
// =========================

canvas.addEventListener(
    "mousedown",
    function (event) {

        event.preventDefault();

        startSelection(
            event.clientX,
            event.clientY
        );

    }
);


canvas.addEventListener(
    "mousemove",
    function (event) {

        if (!isDragging) return;

        event.preventDefault();

        moveSelection(
            event.clientX,
            event.clientY
        );

    }
);


canvas.addEventListener(
    "mouseup",
    function (event) {

        event.preventDefault();

        stopSelection();

    }
);


// =========================
// iPhone / Android 手指
// =========================

canvas.addEventListener(
    "touchstart",
    function (event) {

        event.preventDefault();

        if (!event.touches.length) return;

        const touch =
            event.touches[0];

        startSelection(
            touch.clientX,
            touch.clientY
        );

    },
    { passive: false }
);


canvas.addEventListener(
    "touchmove",
    function (event) {

        event.preventDefault();

        if (!event.touches.length) return;

        const touch =
            event.touches[0];

        moveSelection(
            touch.clientX,
            touch.clientY
        );

    },
    { passive: false }
);


canvas.addEventListener(
    "touchend",
    function (event) {

        event.preventDefault();

        stopSelection();

    },
    { passive: false }
);


canvas.addEventListener(
    "touchcancel",
    function () {

        stopSelection();

    }
);


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

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();

            reader.onload =
                function () {

                    resolve(
                        reader.result
                    );

                };

            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "图片读取失败"
                        )
                    );

                };

            reader.readAsDataURL(file);

        }
    );
}


// =========================
// AI 去水印
// =========================

async function processImage() {

    const file =
        upload.files[0];


    if (!file) {

        alert(
            "请先上传图片"
        );

        return;
    }


    if (
        selectedWidth <= 0 ||
        selectedHeight <= 0
    ) {

        alert(
            "请先框选水印区域"
        );

        return;
    }


    try {

        alert(
            "LZY AI 正在处理中，请稍候..."
        );


        const imageData =
            await fileToDataURL(file);


        const maskData =
            createMask();


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
                result.details?.error ||
                JSON.stringify(
                    result.details
                ) ||
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
// 下载
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
