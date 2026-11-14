export type Pet = {id:number;name:string;breed:string;type:string;gender:string;age:string;location:string;image:string;color:string};
export const pets:Pet[]=[
{id:1,name:'Cooper',breed:'Golden Retriever',type:'Dog',gender:'Male',age:'2.5 years',location:'Bengaluru',image:'photo-1633722715463-d30f4f325e24',color:'#ece6da'},
{id:2,name:'Luna',breed:'British Shorthair',type:'Cat',gender:'Female',age:'2 years',location:'Chennai',image:'photo-1573865526739-10659fec78a5',color:'#efe9e3'},
{id:3,name:'Milo',breed:'Beagle',type:'Dog',gender:'Male',age:'3 years',location:'Mumbai',image:'photo-1505628346881-b72b27e84530',color:'#e9e7df'},
{id:4,name:'Bella',breed:'Golden Retriever',type:'Dog',gender:'Female',age:'2 years',location:'Bengaluru',image:'photo-1552053831-71594a27632d',color:'#ece5da'},
{id:5,name:'Oliver',breed:'Persian',type:'Cat',gender:'Male',age:'2.5 years',location:'Hyderabad',image:'photo-1514888286974-6c03e2ca1dba',color:'#eee5db'},
{id:6,name:'Daisy',breed:'Labrador',type:'Dog',gender:'Female',age:'3 years',location:'Chennai',image:'photo-1518717758536-85ae29035b6d',color:'#e4e7dd'}];
const bundledPhotos=new Set(['photo-1633722715463-d30f4f325e24','photo-1573865526739-10659fec78a5','photo-1505628346881-b72b27e84530','photo-1552053831-71594a27632d','photo-1514888286974-6c03e2ca1dba','photo-1518717758536-85ae29035b6d','photo-1450778869180-41d0601e046e','photo-1543466835-00a7907e9de1']);
export const photo=(id:string,w=800)=>id.startsWith('/pets/')?id:bundledPhotos.has(id)?`/pets/${id}.jpg`:id.startsWith('https://')||id.startsWith('/uploads/')?id:`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

