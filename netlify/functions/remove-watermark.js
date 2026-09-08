exports.handler = async function(event) {

    const token = process.env.HF_TOKEN;


    if(!token){

        return {

            statusCode:500,

            body:JSON.stringify({

                message:"AI Token 未连接"

            })

        };

    }


    return {

        statusCode:200,

        body:JSON.stringify({

            message:"LZY AI 已连接，准备处理图片"

        })

    };


};
