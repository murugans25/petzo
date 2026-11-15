const VERSION=4;
const SIZE=VERSION*4+17;
const DATA_CODEWORDS=80;
const ECC_CODEWORDS=20;
const UPI_URI='upi://pay?pa=vaishnavi21596-5@okicici&pn=Vaishnavi%20R&am=399&cu=INR';

function gfMultiply(x:number,y:number){let z=0;for(let i=0;i<8;i++){if(y&1)z^=x;const high=x&0x80;x=(x<<1)&0xff;if(high)x^=0x1d;y>>>=1}return z}
function errorCorrection(data:number[],degree:number){let generator=[1];let root=1;for(let i=0;i<degree;i++){const next=Array(generator.length+1).fill(0);for(let j=0;j<generator.length;j++){next[j]^=generator[j];next[j+1]^=gfMultiply(generator[j],root)}generator=next;root=gfMultiply(root,2)}const message=[...data,...Array(degree).fill(0)];for(let i=0;i<data.length;i++){const factor=message[i];for(let j=0;j<generator.length;j++)message[i+j]^=gfMultiply(generator[j],factor)}return message.slice(data.length)}

function qrMatrix(text:string){
 const bytes=Array.from(new TextEncoder().encode(text));
 if(bytes.length>78)throw new Error('Payment QR payload exceeds the built-in QR capacity.');
 const bits:number[]=[];const append=(value:number,count:number)=>{for(let i=count-1;i>=0;i--)bits.push((value>>>i)&1)};
 append(0b0100,4);append(bytes.length,8);for(const byte of bytes)append(byte,8);
 for(let i=0;i<Math.min(4,DATA_CODEWORDS*8-bits.length);i++)bits.push(0);
 while(bits.length%8)bits.push(0);
 const data:number[]=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>(a<<1)|b,0));
 for(let pad=0;data.length<DATA_CODEWORDS;pad++)data.push(pad%2===0?0xec:0x11);
 const codewords=[...data,...errorCorrection(data,ECC_CODEWORDS)];
 const matrix:(boolean|null)[][]=Array.from({length:SIZE},()=>Array<boolean|null>(SIZE).fill(null));
 const set=(x:number,y:number,value:boolean)=>{if(x>=0&&x<SIZE&&y>=0&&y<SIZE)matrix[y][x]=value};
 const finder=(left:number,top:number)=>{for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++){const x=left+dx,y=top+dy;if(x<0||x>=SIZE||y<0||y>=SIZE)continue;const ring=Math.max(Math.abs(dx-3),Math.abs(dy-3));set(x,y,ring!==2&&ring!==4)}};
 finder(0,0);finder(SIZE-7,0);finder(0,SIZE-7);
 for(let i=8;i<SIZE-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(26+dx,26+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 const formatData=0b01000;let remainder=formatData<<10;for(let bit=14;bit>=10;bit--)if((remainder>>>bit)&1)remainder^=0x537<<(bit-10);const format=((formatData<<10)|remainder)^0x5412;
 for(let i=0;i<=5;i++)set(8,i,((format>>>i)&1)!==0);set(8,7,((format>>>6)&1)!==0);set(8,8,((format>>>7)&1)!==0);set(7,8,((format>>>8)&1)!==0);for(let i=9;i<15;i++)set(14-i,8,((format>>>i)&1)!==0);
 for(let i=0;i<8;i++)set(SIZE-1-i,8,((format>>>i)&1)!==0);for(let i=8;i<15;i++)set(8,SIZE-15+i,((format>>>i)&1)!==0);set(8,SIZE-8,true);
 let bitIndex=0,upward=true;
 for(let right=SIZE-1;right>=1;right-=2){if(right===6)right--;for(let step=0;step<SIZE;step++){const y=upward?SIZE-1-step:step;for(let offset=0;offset<2;offset++){const x=right-offset;if(matrix[y][x]!==null)continue;let value=bitIndex<codewords.length*8?((codewords[bitIndex>>>3]>>>(7-(bitIndex&7)))&1)!==0:false;bitIndex++;if((x+y)%2===0)value=!value;set(x,y,value)}}upward=!upward}
 return matrix;
}

export function makeUpiQrSvg(){
 const matrix=qrMatrix(UPI_URI),quiet=4,viewSize=SIZE+quiet*2;
 const path:string[]=[];for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(matrix[y][x])path.push(`M${x+quiet},${y+quiet}h1v1h-1z`);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" role="img" aria-label="UPI QR: pay ₹399 to Vaishnavi R"><rect width="100%" height="100%" fill="#fff"/><path d="${path.join('')}" fill="#111" shape-rendering="crispEdges"/></svg>`;
}
