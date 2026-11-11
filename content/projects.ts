export type Img={src?:string;kind:string;ratio:string;size:'full'|'half'}
export type Project={slug:string;n:string;title:string;type:string;date:string;place:string;guests?:string;lines:string[];context?:string;layout:'full'|'asym'|'pair';images?:Img[]}
export const gallery:Img[]=[{kind:'HERO IMAGE',ratio:'3/2',size:'full'},{kind:'PROCESS IMAGE',ratio:'4/5',size:'half'},{kind:'FOOD IMAGE',ratio:'4/5',size:'half'},{kind:'SERVICE IMAGE',ratio:'3/2',size:'full'},{kind:'DETAIL',ratio:'1/1',size:'half'},{kind:'BACKSTAGE',ratio:'1/1',size:'half'}]
const P='BUENOS AIRES',D='MMM 2026'
export const projects:Project[]=[
{slug:'burga',n:'001',title:'BURGA',type:'EVENT',date:'SEP 2026',place:P,guests:'150 GUESTS',lines:['Hamburguesas, fuego, producción y servicio.'],layout:'full'},
{slug:'rock-n-roll',n:'002',title:'ROCK N’ ROLL',type:'EVENT — PARRILLA',date:D,place:P,guests:'50 GUESTS',lines:['Parrilla.'],layout:'asym'},
{slug:'peru',n:'003',title:'PERÚ',type:'PRIVATE DINING',date:'SEP 2026',place:P,guests:'5 GUESTS',lines:['Gatuzo.','Aguachile.','Lomo saltado.','Suspiro limeño.'],layout:'pair'},
{slug:'mar',n:'004',title:'MAR',type:'PRIVATE DINING',date:D,place:P,lines:['Handrolls.','Sashimi.','Trucha.','Lisa.','Langostinos.'],layout:'asym'},
{slug:'pulpo',n:'005',title:'PULPO',type:'PRIVATE DINING',date:D,place:P,lines:['Gilda.','Pasta.','Pulpo.','Pavlova.'],layout:'full'},
{slug:'pizza-omakase',n:'006',title:'PIZZA OMAKASE',type:'EVENT',date:D,place:P,guests:'20–30 GUESTS',lines:[],layout:'pair'},
{slug:'collaborations',n:'007',title:'COLLABORATIONS',type:'COLLABORATIONS',date:D,place:P,lines:['Proyectos gastronómicos y colaboraciones.'],layout:'asym'},
{slug:'referencias',n:'008',title:'REFERENCIAS',type:'REFERENCES',date:'MAR 2026',place:'JAPÓN',lines:['Fotografía, producto, cultura y referencias.'],layout:'full'}]
