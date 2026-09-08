let resultImage = "";


document
.getElementById("upload")
.addEventListener(
"change",
function(){

    let file = this.files[0];

    let img = document.getElementById(
        "imagePreview"
    );

    img.src = URL.createObjectURL(file);

});



async function processImage(){

    let fileInput = document.getElementById("upload");


    if(!fileInput.files[0]){

        alert("请先上传图片");

        return;

    }


    let file = fileInput.files[0];


    let formData = new FormData();

    formData.append(
        "image",
        file
    );


    alert("LZY AI 正在处理中...");


    try{


        let response = await fetch(
            "/.netlify/functions/remove-watermark",
            {

                method:"POST",

                body:formData

            }
        );


        let result = await response.json();


        alert(result.message);



    }

    catch(error){


        alert(
            "AI连接失败"
        );


        console.log(error);


    }


}




function downloadImage(){


    if(resultImage){


        let a=document.createElement("a");


        a.href=resultImage;


        a.download="LZY-result.png";


        a.click();


    }


    else{


        alert(
            "请先处理图片"
        );


    }

}
