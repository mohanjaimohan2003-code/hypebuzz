import type { Area } from "react-easy-crop";

const radians=(degrees:number)=>degrees*Math.PI/180;
function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("decode"));image.src=src;});}
export async function cropProductImage(file:File,sourceUrl:string,crop:Area,rotation:number){
  const image=await loadImage(sourceUrl);const angle=radians(rotation);const sin=Math.abs(Math.sin(angle));const cos=Math.abs(Math.cos(angle));const rotatedWidth=Math.ceil(image.naturalWidth*cos+image.naturalHeight*sin);const rotatedHeight=Math.ceil(image.naturalWidth*sin+image.naturalHeight*cos);
  const stage=document.createElement("canvas");stage.width=rotatedWidth;stage.height=rotatedHeight;const context=stage.getContext("2d");if(!context)throw new Error("canvas");context.translate(rotatedWidth/2,rotatedHeight/2);context.rotate(angle);context.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);
  const scale=Math.min(1,1600/Math.max(crop.width,crop.height));const width=Math.max(1,Math.round(crop.width*scale));const height=Math.max(1,Math.round(crop.height*scale));const output=document.createElement("canvas");output.width=width;output.height=height;const outputContext=output.getContext("2d");if(!outputContext)throw new Error("canvas");outputContext.drawImage(stage,crop.x,crop.y,crop.width,crop.height,0,0,width,height);
  const preserveTransparency=file.type==="image/png";const preferredType="image/webp";let blob=await new Promise<Blob|null>(resolve=>output.toBlob(resolve,preferredType,0.85));let type=preferredType;if(!blob){type=preserveTransparency?"image/png":"image/jpeg";blob=await new Promise<Blob|null>(resolve=>output.toBlob(resolve,type,preserveTransparency?undefined:0.88));}if(!blob)throw new Error("export");
  const extension=type==="image/png"?"png":type==="image/webp"?"webp":"jpg";const base=file.name.replace(/\.[^.]+$/,"");return new File([blob],`${base}-edited.${extension}`,{type,lastModified:Date.now()});
}
