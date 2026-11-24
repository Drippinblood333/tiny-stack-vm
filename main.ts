import{readdirSync as l,readFileSync as r,mkdirSync as m,writeFileSync as w}from'fs'
const{MAKEFUN_INPUT_DIR:i='/input',MAKEFUN_OUTPUT_DIR:o='/output'}=process.env
const g=['01146abf','999999959995999','999','04400','58','4414'],A=';;;;a;;a;;;;;;;;;;a+b;a-b;Math.imul(a,b);a/b|0;a%b;(a>>>0)/(b>>>0)|0;(a>>>0)%(b>>>0);-a;a&b;a|b;a^b;~a;a<<b;a>>b;a>>>b;;a===b;a<b;a>>>0<b>>>0'.split(';').map(e=>e&&eval('(a,b)=>'+e))
for(const a of l(i)){
const q='/'+a+'/',b=i+q,e=o+q
let t=''
function f(p,u){
const s=new Int32Array(256),h=[],c=[]
let j=0,d=0,n=0,v,b
for(let z=1e6;z--;){
const x=p[j++],k=+('0x'+g[x>>4]?.[x&15])
if(x==null)return 9
if(k!=k)return 5
if(!x)return 0
if(x<3&&x||x>47&&x<52){
b=x<3?x*3-2:2
if(j+b>p.length)return 9
v=p.readIntLE(j,b)
j+=b
}
if((d-=k>>2)<0)return 2
const a=s[d],B=s[d+1]
if((d+=k&3)>256)return 3
if(x>18&&x<23&&!B)return 4
if(A[x])v=A[x](a,B)
else switch(x){
case 3:continue
case 5:s[d-2]=B;v=a;break
case 7:s[d-3]=B;s[d-2]=s[d-1];v=a;break
case 48:case 49:case 50:if(x<49||!a==x<50)j+=v;continue
case 51:if(c.length==64)return 7;c.push(j);j=v&65535;continue
case 52:if(!c.length)return 8;j=c.pop();continue
case 64:if(a&~255)return 6;v=h[a];break
case 65:if(B&~255)return 6;h[B]=a;continue
case 80:case 81:v=x<81?''+a:String.fromCharCode(a&255);if(t.length+v.length>65536)return 11;t+=v;continue
case 82:v=u[n++]??-1;break
case 83:return a&255
}
s[d-1]=v
}
return 10
}
const x=f(r(b+'program.bin'),r(b+'input.bin'))
m(e,{recursive:!0})
w(e+'stdout.bin',t,'latin1')
w(e+'exit.txt',''+x)
}