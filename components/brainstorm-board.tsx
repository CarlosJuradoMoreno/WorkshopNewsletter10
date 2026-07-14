"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive, ArrowLeft, BarChart3, Check, ChevronDown, Clock3, Download, FileSpreadsheet,
  FileText, GripVertical, Heart, Lightbulb, MessageCircle, MoreHorizontal, Plus, Search,
  Settings2, Sparkles, Star, Tag, ThumbsDown, ThumbsUp, Timer, Trophy, Users, X
} from "lucide-react";

type VoteKey = "good" | "bad";
type Idea = {
  id: string; title: string; emoji: string; description: string; category: string;
  tags: string[]; author: string; initials: string; date: string;
  good: number; bad: number; comments: number;
};

const categories = [
  { id: "historia", title: "La historia del canal", description: "Celebrar el camino recorrido", color: "#ff845e", tint: "#fff0eb", icon: "✦" },
  { id: "exclusivo", title: "Contenido exclusivo", description: "Algo que no esté en YouTube", color: "#7c5ce7", tint: "#f0edff", icon: "◇" },
  { id: "participacion", title: "Participación", description: "Dar voz a quienes están ahí", color: "#eaaa21", tint: "#fff6d9", icon: "♡" },
  { id: "sorpresas", title: "Regalos y sorpresas", description: "Detalles para recordar", color: "#29a36a", tint: "#e5f8ed", icon: "♧" },
  { id: "formato", title: "Formato especial", description: "Una edición diferente", color: "#3984dd", tint: "#e7f2ff", icon: "▤" },
  { id: "nostalgia", title: "Nostalgia", description: "Volver al principio", color: "#d77da3", tint: "#fcecf3", icon: "◷" },
  { id: "transparencia", title: "Transparencia", description: "Enseñar lo que no se ve", color: "#3b9a98", tint: "#e5f6f5", icon: "◎" },
  { id: "aprendizaje", title: "Aprendizaje", description: "Compartir lo aprendido", color: "#e07b39", tint: "#fff0e5", icon: "⌁" },
  { id: "gamificacion", title: "Gamificación", description: "Convertir la edición en un juego", color: "#7965ca", tint: "#efedfa", icon: "✣" },
  { id: "comunidad", title: "Comunidad", description: "Historias de los lectores", color: "#4c8f4f", tint: "#e9f5e9", icon: "♢" },
];

const ideaGroups: Record<string, string[]> = {
  historia: ["Los 10 momentos que cambiaron el canal","Carta al yo que publicó el primer vídeo","Antes y después del canal","Qué haría diferente si empezara hoy","Los mayores errores cometidos","Los comentarios que nunca olvidaré","Cómo nació el nombre del canal","Las miniaturas que casi publiqué","Mi escritorio entonces vs ahora","Lo que aprendí creando 10 newsletters"],
  exclusivo: ["El vídeo que nunca publiqué","Audio privado de agradecimiento","Making of de una newsletter","Mi proceso para escribir cada edición","Recursos que utilizo para aprender idiomas","Libros que recomiendo pero nunca mencioné","Plantilla editable de estudio","Mi lista de herramientas favoritas","Borradores descartados","El tema que nunca me atreví a publicar"],
  participacion: ["Los lectores eligen el próximo tema","Envía tu historia aprendiendo idiomas","Publicar los mejores consejos enviados","Completa una encuesta divertida","Votación del mejor vídeo del canal","Comparte tu escritorio de estudio","Tu mayor logro aprendiendo idiomas","Pregunta para la edición 20","Escribe una carta a tu 'yo' futuro","Mapa mundial de lectores"],
  sorpresas: ["Wallpaper edición 10","Pack de fondos para móvil","Calendario imprimible","Checklist para aprender idiomas","Plantilla de objetivos","Pack de iconos","Diez regalos para diez lectores","Código descuento exclusivo","Easter egg escondido","Pegatinas digitales"],
  formato: ["Newsletter estilo revista","Newsletter desplegable","Newsletter dividida en capítulos","Elige tu propio recorrido","Newsletter con ilustraciones exclusivas","Cápsula del tiempo para la edición 20","Una edición completamente visual","Especial '10 cosas que aprendimos'","Especial 'Lo mejor de la comunidad'","Edición escrita como una historia"],
  nostalgia: ["Los primeros correos comparados con los actuales","El primer logo del proyecto","Cómo era mi setup hace años","Los primeros objetivos que tenía","Lo que sí conseguí y lo que no"],
  transparencia: ["Cuánto tarda realmente hacer una newsletter","Qué herramientas pago cada mes","Cómo organizo todas las ideas","Qué métricas miro","Cuánto contenido descarto antes de enviar"],
  aprendizaje: ["Las 10 lecciones más importantes","Errores comunes aprendiendo idiomas","Recursos gratuitos favoritos","Cómo mantengo la motivación","Mi método de estudio actual"],
  gamificacion: ["Encuentra el huevo de Pascua oculto","Consigue los 10 sellos del aniversario","Pequeños logros dentro de la newsletter","Desbloquea contenido oculto","Código secreto escondido entre los textos"],
  comunidad: ["Muro con mensajes de lectores","Frases favoritas enviadas por la comunidad","Los mejores correos recibidos","Historias de éxito de suscriptores","Lo que más ha gustado de las primeras 10 newsletters"],
};

const categoryEmoji: Record<string,string> = {historia:"🎬",exclusivo:"🔒",participacion:"🗳️",sorpresas:"🎁",formato:"📰",nostalgia:"📼",transparencia:"🔍",aprendizaje:"💡",gamificacion:"🎮",comunidad:"🫶"};
const seed: Idea[] = Object.entries(ideaGroups).flatMap(([category,titles]) => titles.map((title,index) => ({
  id:`${category}-${index}`, title, emoji:categoryEmoji[category], description:"Una propuesta para explorar juntos y convertir la newsletter número 10 en una edición memorable.", category,
  tags:[categories.find(c=>c.id===category)?.title || category], author:"Equipo", initials:"EQ", date:"Idea inicial", good:0, bad:0, comments:0,
})));

function SortableCard({ idea, onVote }: { idea: Idea; onVote: (id:string,key:VoteKey,previous:VoteKey|null)=>void }) {
  const [flipped, setFlipped] = useState(false);
  const [choice, setChoice] = useState<VoteKey|null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined };
  const cat = categories.find(c => c.id === idea.category)!;
  const vote = (e: React.MouseEvent, key: VoteKey) => { e.stopPropagation(); if(choice===key)return; onVote(idea.id,key,choice); setChoice(key); };
  return (
    <motion.article ref={setNodeRef} style={style} layout initial={{ opacity:0, scale:.92 }} animate={{ opacity:isDragging?.65:1, scale:isDragging?1.04:1 }} className="idea-wrap">
      <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>
        <div className="card-face card-front" onClick={()=>setFlipped(true)}>
          <button className="drag" {...attributes} {...listeners} aria-label="Arrastrar"><GripVertical size={15}/></button>
          <div className="mystery-card" style={{color:cat.color}}><span style={{background:cat.tint}}>{idea.emoji}</span><b>IDEA OCULTA</b><small>Haz clic para descubrirla</small><i>#{String(Number(idea.id.split("-").pop())+1).padStart(2,"0")}</i></div>
          <div className="card-accent" style={{background:cat.color}} />
        </div>
        <div className="card-face card-back" onClick={()=>setFlipped(false)} style={{borderColor:cat.color}}>
          <div className="back-head"><span>{idea.emoji} Idea descubierta</span><button><X size={15}/></button></div>
          <h3>{idea.title}</h3>
          <div className="tags">{idea.tags.map(t=><span key={t}>#{t}</span>)}</div>
          <div className="decision-votes">
            <button className={choice==="good"?"voted good":"good"} onClick={e=>vote(e,"good")}><ThumbsUp size={15}/><span>Buena idea</span><b>{idea.good}</b></button>
            <button className={choice==="bad"?"voted bad":"bad"} onClick={e=>vote(e,"bad")}><ThumbsDown size={15}/><span>No encaja</span><b>{idea.bad}</b></button>
          </div>
          <small className="flip-hint">Haz clic fuera de los votos para ocultarla ↻</small>
        </div>
      </div>
    </motion.article>
  );
}

function AddModal({ initialCategory, onClose, onAdd }:{initialCategory:string;onClose:()=>void;onAdd:(i:Idea)=>void}) {
  const [title,setTitle]=useState(""); const [description,setDescription]=useState(""); const [category,setCategory]=useState(initialCategory); const [emoji,setEmoji]=useState("💡"); const [tags,setTags]=useState("");
  return <motion.div className="modal-shade" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={onClose}>
    <motion.form className="modal" initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.95,y:10}} onSubmit={e=>{e.preventDefault();if(!title.trim())return;onAdd({id:crypto.randomUUID(),title,description:description||"Una nueva idea lista para crecer con el equipo.",category,emoji,tags:tags.split(",").map(x=>x.trim()).filter(Boolean),author:"Tú",initials:"TÚ",date:"Ahora",good:0,bad:0,comments:0})}} onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-title"><div><span className="modal-spark"><Sparkles size={20}/></span><span><b>Nueva idea</b><small>Comparte algo que inspire al equipo</small></span></div><button type="button" onClick={onClose}><X size={20}/></button></div>
      <label>Título de la idea<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Un festival de ideas imposibles" maxLength={70}/><small>{title.length}/70</small></label>
      <label>Descripción<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Cuéntanos un poco más..." rows={3}/></label>
      <div className="form-row"><label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label><label>Emoji<div className="emoji-input"><input value={emoji} onChange={e=>setEmoji(e.target.value)} maxLength={2}/><span>Elige uno que la represente</span></div></label></div>
      <label>Etiquetas<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="innovación, comunidad, futuro..."/><small>Sepáralas con comas</small></label>
      <div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!title.trim()}><Sparkles size={16}/>Crear idea</button></div>
    </motion.form>
  </motion.div>
}

function Results({ideas,onBack}:{ideas:Idea[];onBack:()=>void}) {
  const ranked=[...ideas].sort((a,b)=>(b.good-b.bad)-(a.good-a.bad));
  const tags=Object.entries(ideas.flatMap(i=>i.tags).reduce<Record<string,number>>((a,t)=>(a[t]=(a[t]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
  return <motion.main className="results" initial={{opacity:0}} animate={{opacity:1}}>
    <header className="result-head"><button onClick={onBack}><ArrowLeft size={18}/>Volver al tablero</button><div className="brand"><span><Sparkles/></span><b>Sparkboard</b></div><button className="export"><Download size={17}/>Exportar <ChevronDown size={15}/></button></header>
    <section className="result-hero"><span className="eyebrow"><Trophy size={16}/>Resultados del workshop</span><h1>Las ideas que <em>hicieron chispa.</em></h1><p>Un resumen de todo lo que construimos juntos hoy.</p></section>
    <section className="stat-grid"><div><Lightbulb/><b>{ideas.length}</b><span>Ideas creadas</span></div><div><ThumbsUp/><b>{ideas.reduce((s,i)=>s+i.good,0)}</b><span>Votos positivos</span></div><div><Archive/><b>{categories.length}</b><span>Líneas creativas</span></div><div><Tag/><b>{tags.length}</b><span>Etiquetas</span></div></section>
    <section className="result-grid"><div className="ranking panel"><div className="panel-title"><span><Trophy size={18}/>Ranking de ideas</span><small>Ordenado por valoración</small></div>{ranked.slice(0,10).map((i,n)=><motion.div className="rank-row" key={i.id} initial={{x:-15,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:n*.04}}><b className={`place p${n+1}`}>{n+1}</b><span className="rank-emoji">{i.emoji}</span><div><b>{i.title}</b><small>{categories.find(c=>c.id===i.category)?.title}</small></div><span className="score"><ThumbsUp size={14}/>{i.good} <ThumbsDown size={14}/>{i.bad}</span></motion.div>)}</div>
    <div className="side-results"><div className="panel"><div className="panel-title"><span><Tag size={18}/>Nube de etiquetas</span></div><div className="tag-cloud">{tags.map(([t,n],i)=><span key={t} style={{fontSize:12+Math.min(n,4)*2,opacity:1-i*.035}}>#{t}</span>)}</div></div><div className="panel export-panel"><div className="panel-title"><span><Archive size={18}/>Llévate los resultados</span></div><p>Comparte las conclusiones con todo el equipo.</p><div><button><FileText/>PDF</button><button><FileSpreadsheet/>Excel</button><button><FileText/>Markdown</button></div></div></div></section>
  </motion.main>
}

export function BrainstormBoard() {
  const [ideas,setIdeas]=useState(seed); const [query,setQuery]=useState(""); const [filter,setFilter]=useState("Todas"); const [modal,setModal]=useState<string|null>(null); const [results,setResults]=useState(false);
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}));
  const visible=useMemo(()=>ideas.filter(i=>(filter==="Todas"||i.category===filter)&&(`${i.title} ${i.description} ${i.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))),[ideas,query,filter]);
  const vote=(id:string,key:VoteKey,previous:VoteKey|null)=>setIdeas(old=>old.map(i=>i.id===id?{...i,[key]:i[key]+1,...(previous?{[previous]:Math.max(0,i[previous]-1)}:{})}:i));
  const dragEnd=({active,over}:DragEndEvent)=>{if(!over||active.id===over.id)return;setIdeas(old=>{const a=old.findIndex(i=>i.id===active.id),b=old.findIndex(i=>i.id===over.id);if(a<0||b<0)return old;const target=old[b];const moved={...old[a],category:target.category};const copy=[...old];copy[a]=moved;return arrayMove(copy,a,b)})};
  if(results)return <Results ideas={ideas} onBack={()=>setResults(false)}/>;
  return <div className="app-shell">
    <section className="board-intro"><div><span>NEWSLETTER · EDICIÓN 10</span><h1>¿Cómo hacemos que la nº 10 sea <em>especial?</em></h1><p>Ideas para trabajar junto a la creadora y celebrar este hito con su comunidad.</p></div><button onClick={()=>setModal(categories[0].id)}><Plus size={17}/>Nueva idea</button></section>
    <section className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar ideas..."/></div><div className="filters"><button className={filter==="Todas"?"active":""} onClick={()=>setFilter("Todas")}>Todas <b>{ideas.length}</b></button>{categories.map(c=><button key={c.id} className={filter===c.id?"active":""} onClick={()=>setFilter(c.id)}>{c.title.split(" ")[0]}</button>)}</div><div className="idea-count"><Lightbulb size={17}/><b>{ideas.length}</b> ideas</div></section>
    <DndContext sensors={sensors} onDragEnd={dragEnd}><section className="board">{categories.map(cat=>{const list=visible.filter(i=>i.category===cat.id);return <motion.div layout className="column" key={cat.id}><div className="column-head"><div className="column-title"><span style={{background:cat.tint,color:cat.color}}>{cat.icon}</span><div><b>{cat.title}</b><small>{cat.description}</small></div></div><div><span className="count">{list.length}</span><button onClick={()=>setModal(cat.id)}><Plus size={18}/></button></div></div><SortableContext items={list.map(i=>i.id)} strategy={rectSortingStrategy}><div className="card-list">{list.map(i=><SortableCard key={i.id} idea={i} onVote={vote}/>)}</div></SortableContext><button className="add-idea" onClick={()=>setModal(cat.id)}><Plus size={17}/>Añadir idea</button></motion.div>})}</section></DndContext>
    <button className="finish-button" onClick={()=>setResults(true)}><BarChart3 size={18}/>Ver resultados <span>→</span></button>
    <AnimatePresence>{modal&&<AddModal initialCategory={modal} onClose={()=>setModal(null)} onAdd={i=>{setIdeas(old=>[...old,i]);setModal(null)}}/>}</AnimatePresence>
  </div>;
}
