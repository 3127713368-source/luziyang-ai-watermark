import { MoebiusPipeline } from "./pipeline.ts";
import { IMG, toSquareCanvas } from "./imaging.ts";

let originalImage: HTMLImageElement | null = null;
let fittedRect: { x: number; y: number; w: number; h: number } | null = null;
let pipeline: MoebiusPipeline | null = null;
let loading: Promise<MoebiusPipeline | null> | null = null;

let selecting = false;
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const upload = document.getElementById("upload") as HTMLInputElement;

function getPosition(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
}

function drawSelection() {
    if (!originalImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
}

function startSelection(clientX: number, clientY: number) {
    if (!originalImage) return;

    const p = getPosition({
        clientX,
        clientY
    } as MouseEvent);

    selecting = true;

    startX = p.x;
    startY = p.y;
    endX = p.x;
    endY = p.y;
}

function moveSelection(clientX: number, clientY: number) {
    if (!selecting) return;

    const p = getPosition({
        clientX,
        clientY
    } as MouseEvent);

    endX = p.x;
    endY = p.y;

    drawSelection();
}

function stopSelection() {
    selecting = false;
}

canvas.addEventListener("mousedown", e => {
    startSelection(e.clientX, e.clientY);
});

canvas.addEventListener("mousemove", e => {
    moveSelection(e.clientX, e.clientY);
});

canvas.addEventListener("mouseup", stopSelection);

canvas.addEventListener("mouseleave", stopSelection);

canvas.addEventListener(
    "touchstart",
    e => {
        e.preventDefault();

        const touch = e.touches[0];

        startSelection(
            touch.clientX,
            touch.clientY
        );
    },
    { passive: false }
);

canvas.addEventListener(
    "touchmove",
    e => {
        e.preventDefault();

        const touch = e.touches[0];

        moveSelection(
            touch.clientX,
            touch.clientY
        );
    },
    { passive: false }
);

canvas.addEventListener(
    "touchend",
    e => {
        e.preventDefault();
        stopSelection();
    },
    { passive: false }
);

upload.addEventListener("change", () => {
    const file = upload.files?.[0];

    if (!file) return;

    const img = new Image();

    img.onload = () => {
        originalImage = img;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        /*
         * 防止手机上出现超大 Canvas
         */
        const maxSize = 1600;

        if (
            canvas.width > maxSize ||
            canvas.height > maxSize
        ) {
            const scale = Math.min(
                maxSize / canvas.width,
                maxSize / canvas.height
            );

            canvas.width *= scale;
            canvas.height *= scale;
        }

        ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
        );
    };

    img.src = URL.createObjectURL(file);
});


function createMask() {
    const mask = document.createElement("canvas");

    mask.width = IMG;
    mask.height = IMG;

    const mctx = mask.getContext("2d")!;

    mctx.fillStyle = "black";
    mctx.fillRect(
        0,
        0,
        IMG,
        IMG
    );

    /*
     * 当前网页上的红框
     */
    const x1 = Math.min(startX, endX);
    const y1 = Math.min(startY, endY);

    const x2 = Math.max(startX, endX);
    const y2 = Math.max(startY, endY);

    /*
     * 转换成 512×512 坐标
     */
    const sx =
        (x1 / canvas.width) * IMG;

    const sy =
        (y1 / canvas.height) * IMG;

    const sw =
        ((x2 - x1) / canvas.width) * IMG;

    const sh =
        ((y2 - y1) / canvas.height) * IMG;

    mctx.fillStyle = "white";

    mctx.fillRect(
        sx,
        sy,
        sw,
        sh
    );

    return mask;
}


async function loadAI() {
    if (pipeline) return pipeline;

    if (loading) return loading;

    loading = (async () => {

        try {

            /*
             * Hugging Face 官方 Moebius ONNX 模型
             */
            const modelBase =
                "https://huggingface.co/simonw/Moebius-ONNX/resolve/main";

            /*
             * ONNX Runtime
             */
            MoebiusPipeline.configureRuntime(
                "/"
            );

            const p =
                new MoebiusPipeline();

            const status =
                document.createElement("p");

            status.id = "ai-status";

            status.innerText =
                "正在加载 AI 模型，第一次可能需要下载约 1.27GB…";

            document
                .querySelector(".tool")
                ?.appendChild(status);

            await p.load(
                modelBase,
                (stage, current, total) => {

                    if (!status) return;

                    if (
                        current !== undefined &&
                        total !== undefined
                    ) {

                        const percent =
                            Math.round(
                                (current / total) * 100
                            );

                        status.innerText =
                            `${stage} ${percent}%`;

                    } else {

                        status.innerText =
                            stage;

                    }
                }
            );

            pipeline = p;

            status.innerText =
                `AI 已准备完成：${p.backend.toUpperCase()}`;

            return p;

        } catch (error) {

            console.error(error);

            alert(
                "AI 模型加载失败：" +
                (error as Error).message
            );

            loading = null;

            return null;
        }

    })();

    return loading;
}


async function processImage() {

    if (!originalImage) {

        alert("请先上传图片");

        return;
    }

    if (
        Math.abs(endX - startX) < 5 ||
        Math.abs(endY - startY) < 5
    ) {

        alert("请先框选水印区域");

        return;
    }

    const button =
        document.querySelector(
            'button[onclick="processImage()"]'
        ) as HTMLButtonElement | null;

    if (button) {

        button.disabled = true;

        button.innerText =
            "AI处理中…";
    }

    try {

        const fitted =
            toSquareCanvas(
                originalImage,
                originalImage.naturalWidth,
                originalImage.naturalHeight
            );

        fittedRect = fitted.rect;

        const imageCanvas =
            fitted.canvas;

        const maskCanvas =
            createMask();

        /*
         * 这里调用真正的 Moebius AI
         */
        const ai =
            await loadAI();

        if (!ai) return;

        const result =
            await ai.run(
                imageCanvas,
                maskCanvas,
                {
                    steps: 19,
                    guidance: 2.0,
                    seed: Math.floor(
                        Math.random() * 2147483647
                    ),
                    paste: true,

                    onProgress:
                        (stage, current, total) => {

                            console.log(
                                stage,
                                current,
                                total
                            );

                        }
                }
            );

        /*
         * 把 AI 结果放回网页 Canvas
         */
        canvas.width =
            fittedRect.w;

        canvas.height =
            fittedRect.h;

        ctx.drawImage(
            result,
            fittedRect.x,
            fittedRect.y,
            fittedRect.w,
            fittedRect.h,
            0,
            0,
            fittedRect.w,
            fittedRect.h
        );

        alert(
            "AI 去水印完成！"
        );

    } catch (error) {

        console.error(error);

        alert(
            "AI处理失败：" +
            (error as Error).message
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.innerText =
                "开始去水印";
        }
    }
}


function downloadImage() {

    if (!originalImage) {

        alert("请先处理图片");

        return;
    }

    const link =
        document.createElement("a");

    link.download =
        "LZY-AI-去水印.png";

    link.href =
        canvas.toDataURL(
            "image/png"
        );

    link.click();
}


/*
 * 保留你原来的 HTML 按钮
 *
 * <button onclick="processImage()">
 * <button onclick="downloadImage()">
 */
(window as any).processImage =
    processImage;

(window as any).downloadImage =
    downloadImage;
