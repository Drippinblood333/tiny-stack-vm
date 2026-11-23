import{readdirSync as l,readFileSync as r,mkdirSync as m,writeFileSync as w}from'node:fs'
const{MAKEFUN_INPUT_DIR:i='/input',MAKEFUN_OUTPUT_DIR:o='/output'}=process.env
const g=['01146abf','999999959995999','999','04400','58','4414'],A=[
(a,b)=>a+b,(a,b)=>a-b,Math.imul,(a,b)=>a/b,(a,b)=>a%b,(a,b)=>(a>>>0)/(b>>>0),(a,b)=>(a>>>0)%(b>>>0),a=>-a,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,a=>~a,(a,b)=>a<<b,(a,b)=>a>>b,(a,b)=>a>>>b,,(a,b)=>+(a===b),(a,b)=>+(a<b),(a,b)=>+(a>>>0<b>>>0)]
for(const a of l(i)){
const b=i+'/'+a+'/',e=o+'/'+a+'/'
let t=''
function f(p,u){
const s=new Int32Array(256),h=new Int32Array(256),c=[]
let j=0,d=0,n=0
for(let z=0;z<1e6;z++){
const x=p[j++],k=parseInt(g[x>>4]?.[x&15],16)
if(x===undefined)return 9
if(isNaN(k))return 5
let y,v
if(x===1||x===2||x>=48&&x<52){
const b=x===1?1:x===2?4:2
if(j+b>p.length)return 9
y=b===1?p.readInt8(j):b===2?p.readUInt16LE(j):p.readInt32LE(j)
j+=b
}
d-=k>>2
if(d<0)return 2
const a=s[d],b=s[d+1]
d+=k&3
if(d>256)return 3
if(x>=19&&x<=22&&!b)return 4
if(A[x-16])v=A[x-16](a,b)
else switch(x){
case 0:return 0
case 1:case 2:v=y;break
case 3:continue
case 4:case 6:v=a;break
case 5:s[d-2]=b;v=a;break
case 7:s[d-3]=b;s[d-2]=s[d-1];v=a;break
case 48:case 49:case 50:if(x===48||!a===(x===49))j+=y<<16>>16;continue
case 51:if(c.length===64)return 7;c.push(j);j=y;continue
case 52:if(!c.length)return 8;j=c.pop();continue
case 64:if(a>>>0>255)return 6;v=h[a];break
case 65:if(b>>>0>255)return 6;h[b]=a;continue
case 80:case 81:{
const e=x===80?''+a:String.fromCharCode(a&255)
if(t.length+e.length>65536)return 11
t+=e
continue
}
case 82:v=u[n++]??-1;break
case 83:return a&255
}
s[d-1]=v
}
return 10
}
const x=f(r(b+'program.bin'),r(b+'input.bin'))
m(e,{recursive:true})
w(e+'stdout.bin',t,'latin1')
w(e+'exit.txt',x+'\n')
}
