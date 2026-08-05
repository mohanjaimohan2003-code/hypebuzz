export function parseCsv(text:string):Array<Record<string,string>> {
  const rows:string[][]=[];let row:string[]=[];let value="";let quoted=false;
  for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(char===','&&!quoted){row.push(value.trim());value="";}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(value.trim());value="";if(row.some(Boolean))rows.push(row);row=[];}else value+=char;}
  row.push(value.trim());if(row.some(Boolean))rows.push(row);if(rows.length<2)return[];
  const headers=rows[0].map((header)=>header.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""));
  return rows.slice(1).map((values)=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??""])));
}
