import "~/styles/global.css"

import { ArrowLeft, ShieldCheck, Square } from "lucide-react"
import { useEffect, useState } from "react"
import { Brand } from "~/components/Brand"
import { applyTheme } from "~/hooks/useClearhead"
import { remainingMs } from "~/lib/time"
import { send } from "~/types/messages"
import type { ClearheadState } from "~/types/state"

export default function Blocked(){
  const [state,setState]=useState<ClearheadState|null>(null),[,tick]=useState(0),[notice,setNotice]=useState("")
  useEffect(()=>{const load=()=>send<ClearheadState>({type:"GET_STATE"}).then(response=>{if(response.ok){setState(response.data);applyTheme(response.data.settings.theme)}});void load();const interval=setInterval(()=>{void load();tick(value=>value+1)},1_000);return()=>clearInterval(interval)},[])
  if(!state)return <main className="blocked-page"><Brand/></main>
  const focus=state.focus,milliseconds=focus.active?remainingMs(focus.endsAt):0,minutes=Math.floor(milliseconds/60_000),seconds=Math.floor(milliseconds%60_000/1_000),target=new URLSearchParams(location.search).get("domain"),blocked=focus.active?focus.distractionsBlocked:0
  return <main className="blocked-page"><div className="blocked-glow"/><section className="blocked-card"><div className="mountains" aria-hidden="true"><svg viewBox="0 0 900 260" preserveAspectRatio="none"><defs><linearGradient id="mountain-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4f46e5" stopOpacity=".28"/><stop offset="1" stopColor="#4f46e5" stopOpacity="0"/></linearGradient></defs><path d="M0 248 L115 98 L190 180 L300 50 L392 177 L478 118 L560 210 L685 70 L780 180 L860 120 L900 165 L900 260 L0 260 Z" fill="url(#mountain-fill)"/><path d="M0 248 L115 98 L190 180 L300 50 L392 177 L478 118 L560 210 L685 70 L780 180 L860 120 L900 165" fill="none" stroke="#6366f1" strokeWidth="2"/><path d="M70 208 L115 98 L150 175 M245 130 L300 50 L350 150 M635 135 L685 70 L735 142 M820 176 L860 120 L884 153" fill="none" stroke="#a5b4fc" strokeOpacity=".55" strokeWidth="1.5"/></svg></div><div className="blocked-content"><Brand/><span className="blocked-shield"><ShieldCheck size={24}/></span><p className="eyebrow-extension">A conscious pause</p><h1>{focus.active?"You chose something else":"Focus has ended"}</h1>{focus.active?<><p className="muted"><strong>{target||"This site"}</strong> can wait. You are here to:</p><h2 className="blocked-objective">{focus.objective}</h2><div className="blocked-timer"><strong>{minutes}:{String(seconds).padStart(2,"0")}</strong><span>{blocked} distraction{blocked===1?"":"s"} kept out. Your momentum is intact.</span></div></>:<p className="muted">Your next step is waiting in Clearhead.</p>}{notice&&<div className="notice" role="status">{notice}</div>}<button className="btn" onClick={()=>history.length>1?history.back():window.close()}><ArrowLeft size={16}/>Return to my outcome</button>{focus.active&&<button className="text-button danger-text" onClick={async()=>{const response=await send({type:"END_FOCUS",outcome:"paused",nextStep:focus.objective});setNotice(response.ok?"Your place is saved for when you return.":response.error)}}><Square size={14}/>Save my place and pause</button>}</div></section></main>
}
