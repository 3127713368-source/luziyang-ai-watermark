let resultImage = "";



document
.getElementById("upload")
.addEventListener(
"change",
function(){

let file=this.files[0];


let img=
document.getElementById(
"imagePreview"
);


img.src=
URL.createObjectURL(file);


resultImage=img.src;


});



function processImage(){

alert(
"AI正在处理中...\n\n正式版本会连接AI去水印系统"
);

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
"请先上传图片"
);

}

}