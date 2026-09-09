exports.handler = async function (event) {

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                error: "只允许 POST 请求"
            })
        };
    }

    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "REPLICATE_API_TOKEN 未连接"
            })
        };
    }

    try {

        const body = JSON.parse(event.body);

        const image = body.image;
        const mask = body.mask;

        if (!image || !mask) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "缺少图片或 Mask"
                })
            };
        }

        const response = await fetch(
            "https://api.replicate.com/v1/predictions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    version:
                        "2b91ca2340801c2a5be745612356fac36a17f698354a07f48a62d564d3b3a7a0",

                    input: {
                        image: image,
                        mask: mask
                    }
                })
            }
        );

        const prediction = await response.json();

        if (!response.ok) {

            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: "Replicate 请求失败",
                    details: prediction
                })
            };
        }

        let result = prediction;

        // 等待 AI 完成
        while (
            result.status !== "succeeded" &&
            result.status !== "failed" &&
            result.status !== "canceled"
        ) {

            await new Promise(
                resolve => setTimeout(resolve, 1500)
            );

            const check = await fetch(
                result.urls.get,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

            result = await check.json();
        }

        if (result.status !== "succeeded") {

            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "AI 图片处理失败",
                    details: result.error || result.status
                })
            };
        }

        return {
            statusCode: 200,

            body: JSON.stringify({
                success: true,
                image: result.output
            })
        };

    } catch (error) {

        console.error(error);

        return {
            statusCode: 500,

            body: JSON.stringify({
                error: "服务器处理失败",
                details: error.message
            })
        };
    }
};
