'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import UiIcon from '@/app/UiIcon';

type Theme = { primary:string; sidebar:string; header:string; font:string; iconSize:string };
const defaults:Theme={primary:'#167d8d',sidebar:'#123b63',header:'#ffffff',font:'Inter, Segoe UI, sans-serif',iconSize:'16'};
const choices:{key:keyof Theme;label:string;type:'color'|'font'|'range';options?:string[]}[]=[
  {key:'primary',label:'Primary color',type:'color'},
  {key:'sidebar',label:'Sidebar background',type:'color'},
  {key:'header',label:'Header background',type:'color'},
  {key:'font',label:'Font family',type:'font',options:['Inter, Arial, sans-serif','Arial, sans-serif','Georgia, serif','system-ui, sans-serif']},
  {key:'iconSize',label:'Navigation icon size',type:'range'},
];

export function BrandLogo({small=false}:{small?:boolean}) {
  return <span className={`platform-logo ${small?'platform-logo-small':''}`}><Image src="/logo.jpeg" alt="BKD General Hospital logo" width={48} height={58} priority/><span><strong>BKD <b>PHARMACY</b></strong><small>GENERAL HOSPITAL</small></span></span>;
}

export function ThemeTools(){
  const [open,setOpen]=useState(false);const [tab,setTab]=useState('Sidebar');const [theme,setTheme]=useState<Theme>(defaults);
  useEffect(()=>{try{const saved=localStorage.getItem('bkd-hospital-theme-v2');if(saved)setTheme({...defaults,...JSON.parse(saved)})}catch{}},[]);
  useEffect(()=>{const root=document.documentElement;root.style.setProperty('--color-primary',theme.primary);root.style.setProperty('--color-primary-hover',`color-mix(in srgb, ${theme.primary} 88%, #123b63)`);root.style.setProperty('--color-sidebar',theme.sidebar);root.style.setProperty('--theme-header',theme.header);root.style.setProperty('--theme-font',theme.font);root.style.setProperty('--theme-icon-size',`${theme.iconSize}px`);try{localStorage.setItem('bkd-hospital-theme-v2',JSON.stringify(theme))}catch{}},[theme]);
  const update=(key:keyof Theme,value:string)=>setTheme(t=>({...t,[key]:value}));
  return <>
    <button className="icon-button theme-trigger" aria-label="Customize hospital theme" title="Customize hospital theme" onClick={()=>setOpen(true)}><UiIcon name="settings" /></button>
    {open&&<><button className="theme-scrim" aria-label="Close theme settings" onClick={()=>setOpen(false)}/><aside className="theme-drawer" role="dialog" aria-modal="true" aria-label="Hospital theme settings"><div className="theme-drawer-head"><div><small>PERSONALIZE WORKSPACE</small><h2>Hospital theme</h2></div><button className="theme-close" onClick={()=>setOpen(false)} aria-label="Close"><UiIcon name="close" /></button></div><div className="theme-brand-preview"><BrandLogo small/><span>Live preview</span></div><div className="theme-tabs">{['Sidebar','Header','Tools & icons','Fonts'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div><div className="theme-controls">{choices.filter(x=>tab==='Sidebar'?x.key==='sidebar':tab==='Header'?x.key==='header':tab==='Tools & icons'?x.key==='primary'||x.key==='iconSize':x.key==='font').map(item=><label className="theme-control" key={item.key}><span>{item.label}</span>{item.type==='color'?<input type="color" value={theme[item.key]} onChange={e=>update(item.key,e.target.value)}/>:item.type==='range'?<div className="theme-range"><input aria-label={item.label} type="range" min="12" max="24" value={theme.iconSize} onChange={e=>update('iconSize',e.target.value)}/><b>{theme.iconSize}px</b></div>:<select value={theme.font} onChange={e=>update('font',e.target.value)}>{item.options?.map(o=><option value={o} key={o}>{o.split(',')[0]}</option>)}</select>}</label>)}<p className="theme-help">Your appearance settings are saved in this browser and applied across role workspaces.</p></div><div className="theme-drawer-foot"><button onClick={()=>setTheme(defaults)}>Reset to BKD defaults</button><button className="theme-done" onClick={()=>setOpen(false)}>Done</button></div></aside></>}
  </>;
}

export function ProfileMenu({name,role}:{name:string;role:string}){
  const [open,setOpen]=useState(false);const path=usePathname();const workspace=path.split('/').filter(Boolean)[0]||'super-admin';
  async function signOut(){await fetch('/api/auth/logout',{method:'POST'});location.assign('/login')}
  return <div className="profile-menu-wrap"><button className="profile-trigger" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><div className="avatar">{name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'U'}</div><span><strong>{name}</strong><small>{role}</small></span><b className="profile-chevron"><UiIcon name="chevron" size={14}/></b></button>{open&&<><button className="profile-dismiss" aria-label="Close profile menu" onClick={()=>setOpen(false)}/><div className="profile-dropdown"><div className="profile-drop-head"><div className="avatar">{name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'U'}</div><span><strong>{name}</strong><small>{role}</small></span></div><Link href={`/${workspace}/profile`}>My Profile</Link><Link href={`/${workspace}/profile#security`}>Security & sessions</Link><Link href={`/${workspace}/dashboard`}>My workspace</Link><button onClick={signOut}>Sign out</button></div></>}</div>;
}

export function KeepActiveSidebarLinkVisible(){
  const path=usePathname();
  useEffect(()=>{
    const sidebar=document.querySelector<HTMLElement>('.sidebar');
    const active=sidebar?.querySelector<HTMLElement>('.nav-link-active');
    if(!sidebar||!active)return;
    const sidebarBox=sidebar.getBoundingClientRect();
    const linkBox=active.getBoundingClientRect();
    const topInset=72;
    const bottomInset=56;
    let offset=0;
    if(linkBox.top<sidebarBox.top+topInset)offset=linkBox.top-sidebarBox.top-topInset;
    else if(linkBox.bottom>sidebarBox.bottom-bottomInset)offset=linkBox.bottom-sidebarBox.bottom+bottomInset;
    if(offset)sidebar.scrollBy({top:offset,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  },[path]);
  return null;
}

export function PageLoader(){
  const path=usePathname();const [visible,setVisible]=useState(true);
  useEffect(()=>{setVisible(true);const id=window.setTimeout(()=>setVisible(false),420);return()=>window.clearTimeout(id)},[path]);
  useEffect(()=>{
    if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window))return;
    const announcementKey='bkd-hospital-welcome-female-voice-v2-announced';
    try{if(sessionStorage.getItem(announcementKey))return}catch{}
    const speakWelcome=()=>{
      const voices=window.speechSynthesis.getVoices();
      const preferredVoice=voices.find(voice=>/^en([_-]|$)/i.test(voice.lang)&&/\b(female|woman|zira|samantha|victoria|karen|susan|moira|ava|allison|joanna|salli|tessa|serena|aria|jenny|libby|sonia|natasha|helena|hazel|sara|fiona|michelle|jane|google us english)\b/i.test(voice.name));
      if(!preferredVoice)return false;
      try{sessionStorage.setItem(announcementKey,'1')}catch{}
      const announcement=new SpeechSynthesisUtterance('Welcome to BKD General Hospital');
      announcement.voice=preferredVoice;
      announcement.lang=preferredVoice.lang;announcement.rate=0.86;announcement.pitch=1.25;announcement.volume=0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(announcement);
      return true;
    };
    if(window.speechSynthesis.getVoices().length&&speakWelcome())return;
    window.speechSynthesis.addEventListener('voiceschanged',speakWelcome,{once:true});
    return()=>window.speechSynthesis.removeEventListener('voiceschanged',speakWelcome);
  },[]);
  return visible?<div className="page-loader" aria-label="Loading page"><div className="loader-brand"><Image src="/logo.jpeg" alt="" width={52} height={62}/></div><span className="loader-ring"/><strong>BKD GENERAL HOSPITAL</strong><small>Loading your workspace</small></div>:null;
}
