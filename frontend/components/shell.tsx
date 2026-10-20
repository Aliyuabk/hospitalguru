'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, ArrowLeftRight, BarChart3, ChevronDown, ClipboardCheck, FileText, LayoutDashboard, LoaderCircle, LogOut, Menu, Moon, Paintbrush, Pill, Settings, ShieldCheck, ShoppingCart, Sun, Users, Warehouse, Wifi, WifiOff, X, UserRound, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { resolveApiUrl } from '@/lib/api';

type Role='hod'|'store_keeper'|'pharmacy_staff'|'md'|'doctor';
type User={id:number;name:string;email:string;role:Role;department_id:number|null;profile_photo_url?:string|null;department?:{id:number;name:string}|null};
type ThemePreference='light'|'dark'|'system';
type PaletteName='hospital'|'ocean'|'teal'|'plum'|'slate'|'amber';
type Appearance={topbar:PaletteName;sidebar:PaletteName;accent:PaletteName};
const palettes:Record<PaletteName,{label:string;main:string;deep:string;light:string;text:string}>={
  hospital:{label:'Hospital green',main:'#117158',deep:'#103a31',light:'#e5f4ed',text:'#ffffff'},
  ocean:{label:'Ocean blue',main:'#1769aa',deep:'#12385b',light:'#e7f1fb',text:'#ffffff'},
  teal:{label:'Teal',main:'#087f8c',deep:'#10444a',light:'#e3f5f5',text:'#ffffff'},
  plum:{label:'Plum',main:'#76509b',deep:'#3e2c54',light:'#f1eafa',text:'#ffffff'},
  slate:{label:'Slate',main:'#475569',deep:'#1e293b',light:'#edf1f5',text:'#ffffff'},
  amber:{label:'Amber',main:'#a65c12',deep:'#593512',light:'#fff3dc',text:'#ffffff'}
};
const defaultAppearance:Appearance={topbar:'hospital',sidebar:'hospital',accent:'hospital'};
const roleNames:Record<Role,string>={hod:'HOD Super Admin',store_keeper:'Central Store Keeper',pharmacy_staff:'Pharmacy Staff',md:'MD Management',doctor:'Doctor'};
const nav=[
  {label:'Overview',href:'/',icon:LayoutDashboard,roles:['hod','md']},
  {label:'Sell drugs',href:'/pos',icon:ShoppingCart,roles:['hod','pharmacy_staff']},
  {label:'Refunds & returns',href:'/refunds',icon:Activity,roles:['hod','pharmacy_staff']},
  {label:'Patients',href:'/patients',icon:Users,roles:['hod','pharmacy_staff']},
  {label:'Drug master',href:'/drugs',icon:Pill,roles:['hod','store_keeper']},
  {label:'Stock & transfers',href:'/inventory',icon:Warehouse,roles:['hod','store_keeper']},
  {label:'Physical stock counts',href:'/stock-counts',icon:ClipboardCheck,roles:['pharmacy_staff']},
  {label:'Sales reports',href:'/reports',icon:BarChart3,roles:['hod','md']},
  {label:'Staff management',href:'/staff',icon:ShieldCheck,roles:['hod']},
  {label:'Prescriptions',href:'/prescriptions',icon:FileText,roles:['hod','doctor','pharmacy_staff']},
  {label:'Staff chat',href:'/chat',icon:MessageCircle,roles:['hod','store_keeper','pharmacy_staff','md','doctor']},
  {label:'Settings & conflicts',href:'/settings',icon:Settings,roles:['hod']}
];
const homeFor=(role:Role)=>role==='pharmacy_staff'?'/pos':role==='store_keeper'?'/inventory':role==='doctor'?'/prescriptions':'/';
const canVisit=(role:Role,path:string)=>path==='/login'||path==='/account'||path==='/chat'?true:(path==='/'?['hod','md'].includes(role):path==='/pos'||path==='/refunds'?['hod','pharmacy_staff'].includes(role):path==='/patients'?['hod','pharmacy_staff'].includes(role):path==='/prescriptions'?['hod','doctor','pharmacy_staff'].includes(role):path==='/settings'?role==='hod':path==='/stock-counts'?['hod','store_keeper','pharmacy_staff'].includes(role):path==='/inventory'||path==='/drugs'||path==='/transfers'?['hod','store_keeper'].includes(role):path==='/reports'?['hod','md'].includes(role):path==='/staff'?role==='hod':false);

function LoadingScreen(){return <main className="grid min-h-screen place-items-center bg-[#f6f8f7] px-5"><div className="w-full max-w-xs text-center"><div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center"><div className="absolute inset-0 rounded-full border-2 border-brand-100"/><div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-600"/><Image src="/logo.jpeg" alt="Birnin Kudu General Hospital" width={40} height={40} className="h-9 w-9 rounded-full bg-white object-contain p-1"/></div><div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-medium text-[#75867e] shadow-soft"><LoaderCircle size={14} className="animate-spin text-brand-600"/>Checking your secure session</div><div className="mx-auto mt-9 h-px w-16 bg-[#dfe9e3]"/><p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#91a099]">Powered by</p><p className="mt-1 text-xs font-bold tracking-wide text-[#536a60]">Kowaguru Technology Limited.</p></div></main>}

export function Shell({children}:{children:React.ReactNode}){
  const path=usePathname();const router=useRouter();const [user,setUser]=useState<User|null>(null);const [authReady,setAuthReady]=useState(false);const [online,setOnline]=useState(true);const [pending,setPending]=useState(0);const [mobileOpen,setMobileOpen]=useState(false);const [profileOpen,setProfileOpen]=useState(false);const [appearanceOpen,setAppearanceOpen]=useState(false);const [theme,setTheme]=useState<ThemePreference>('system');const [appearance,setAppearance]=useState<Appearance>(defaultAppearance);const profileMenuRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const stored=(localStorage.getItem('bkd_theme')||'system') as ThemePreference;const preference=['light','dark','system'].includes(stored)?stored:'system';setTheme(preference);const apply=()=>{const dark=preference==='dark'||(preference==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light'};apply();const media=window.matchMedia('(prefers-color-scheme: dark)');media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[]);
  function selectTheme(value:ThemePreference){setTheme(value);localStorage.setItem('bkd_theme',value);const dark=value==='dark'||(value==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';}
  useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem('bkd_appearance')||'{}');const valid=(value:unknown):value is PaletteName=>typeof value==='string'&&value in palettes;const next={topbar:valid(stored.topbar)?stored.topbar:defaultAppearance.topbar,sidebar:valid(stored.sidebar)?stored.sidebar:defaultAppearance.sidebar,accent:valid(stored.accent)?stored.accent:defaultAppearance.accent};setAppearance(next);document.documentElement.style.setProperty('--accent-main',palettes[next.accent].main);document.documentElement.style.setProperty('--accent-deep',palettes[next.accent].deep);document.documentElement.style.setProperty('--accent-light',palettes[next.accent].light);document.documentElement.classList.add('has-user-appearance')}catch{}},[]);
  function selectAppearance(key:keyof Appearance,value:PaletteName){const next={...appearance,[key]:value};setAppearance(next);localStorage.setItem('bkd_appearance',JSON.stringify(next));document.documentElement.style.setProperty('--accent-main',palettes[next.accent].main);document.documentElement.style.setProperty('--accent-deep',palettes[next.accent].deep);document.documentElement.style.setProperty('--accent-light',palettes[next.accent].light);document.documentElement.classList.add('has-user-appearance')}
  useEffect(()=>{setMobileOpen(false);setProfileOpen(false)},[path]);
  useEffect(()=>{const update=(event:Event)=>{const next=(event as CustomEvent<User>).detail;setUser(next)};window.addEventListener('bkd:profile',update);return()=>window.removeEventListener('bkd:profile',update)},[]);
  useEffect(()=>{if(!profileOpen)return;const outside=(event:PointerEvent)=>{if(!profileMenuRef.current?.contains(event.target as Node))setProfileOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setProfileOpen(false)};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}},[profileOpen]);
  useEffect(()=>{
    if(path==='/login'){setAuthReady(true);return;}
    let active=true;
    setAuthReady(false);

    const token=localStorage.getItem('bkd_token');
    if(!token){setUser(null);router.replace('/login');return()=>{active=false};}

    let cached:User|null=null;
    try{cached=JSON.parse(localStorage.getItem('bkd_user')||'null')}
    catch{localStorage.removeItem('bkd_user')}

    if(cached){
      setUser(cached);
      if(!canVisit(cached.role,path)){
        router.replace(homeFor(cached.role));
        return()=>{active=false};
      }
      setAuthReady(true);
    }

    const controller=new AbortController();
    const sessionTimeout=window.setTimeout(()=>controller.abort(),10000);
    if(navigator.onLine){
      void resolveApiUrl()
        .then(base=>fetch(`${base}/me`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:controller.signal}))
        .then(async response=>{
          if(response.status===401){
            localStorage.removeItem('bkd_token');
            localStorage.removeItem('bkd_user');
            if(active){setUser(null);router.replace('/login');}
            return;
          }
          if(!response.ok){if(active&&cached)setAuthReady(true);return;}
          const actual=await response.json() as User;
          localStorage.setItem('bkd_user',JSON.stringify(actual));
          if(active){
            setUser(actual);
            if(!canVisit(actual.role,path))router.replace(homeFor(actual.role));
            else setAuthReady(true);
          }
        })
        .catch(()=>{
          if(active&&cached)setAuthReady(true);
          else if(active)router.replace('/login');
        }).finally(()=>window.clearTimeout(sessionTimeout));
    }else if(!cached){
      window.clearTimeout(sessionTimeout);
      router.replace('/login');
    }

    return()=>{active=false;window.clearTimeout(sessionTimeout);controller.abort()};
  },[path,router]);
  useEffect(()=>{const sync=()=>setOnline(navigator.onLine);sync();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});window.addEventListener('online',sync);window.addEventListener('offline',sync);const refresh=()=>setPending(Number(localStorage.getItem('bkd_pending_count')||'0'));refresh();window.addEventListener('bkd:pending',refresh);return()=>{window.removeEventListener('online',sync);window.removeEventListener('offline',sync);window.removeEventListener('bkd:pending',refresh)};},[]);
  async function logout(){const token=localStorage.getItem('bkd_token');if(token&&navigator.onLine)try{await fetch(`${await resolveApiUrl()}/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}})}catch{}localStorage.removeItem('bkd_token');localStorage.removeItem('bkd_user');setUser(null);router.replace('/login');}
  if(path==='/login')return <>{children}</>;
  if(!authReady||!user)return <LoadingScreen/>;
  const initials=user.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const links=nav.filter(item=>item.roles.includes(user.role)).map((item,ix)=>{const active=item.href===path;return <Link key={`${item.label}${ix}`} href={item.href} aria-current={active?'page':undefined} onClick={()=>setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active?'bg-brand-50 text-brand-700':'text-[#6f817a] hover:bg-[#f7f9f8] hover:text-[#253e36]'}`}><item.icon size={18} strokeWidth={active?2.3:1.8}/>{item.label}{item.label==='Sell drugs'&&<span className="ml-auto rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">POS</span>}</Link>});
  const sidebarFooter=<div className="mt-auto p-4"><div className="mb-4 rounded-2xl bg-[#f6f9f7] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#37554b]"><Activity size={16} className="text-brand-600"/>System status</div><div className="text-xs text-[#82938c]">{online?'Your workspace is up to date.':'Offline mode is active.'}</div></div><button onClick={()=>setAppearanceOpen(value=>!value)} aria-expanded={appearanceOpen} className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d8d87] hover:bg-gray-50"><Paintbrush size={18}/>Appearance</button><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d8d87] hover:bg-gray-50"><LogOut size={18}/>Sign out</button><div className="mt-3 border-t border-[#edf1ef] pt-3 text-center text-[10px] font-medium text-[#9aa9a3]">Powered by Kowaguru Technology Limited.</div></div>;
  const sidebarLinks=<div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 pt-5"><div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.15em] text-[#a1ada8]">Workspace</div><nav aria-label="Main workspace" className="space-y-1">{links}</nav></div>;
  const brand=<div className="flex h-[78px] items-center justify-center border-b border-[#edf1ef] px-5"><Image src="/logo.jpeg" alt="Birnin Kudu General Hospital" width={56} height={56} className="h-14 w-14 rounded-full bg-white object-contain p-1"/></div>;
  return <div className="min-h-screen"><a href="#main-content" className="skip-link">Skip to main content</a>
    <aside style={{backgroundColor:palettes[appearance.sidebar].deep,color:palettes[appearance.sidebar].text}} className="sidebar-themed fixed inset-y-0 left-0 z-20 hidden w-[270px] flex-col border-r border-[#e7eeea] lg:flex">{brand}{sidebarLinks}{sidebarFooter}</aside>
    {mobileOpen&&<div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close navigation" onClick={()=>setMobileOpen(false)} className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[1px]"/><aside role="dialog" aria-modal="true" aria-label="Main navigation" style={{backgroundColor:palettes[appearance.sidebar].deep,color:palettes[appearance.sidebar].text}} className="sidebar-themed absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col overflow-y-auto border-r border-[#e7eeea] shadow-2xl">{brand}<div className="flex items-center justify-between px-5 pt-5"><span className="text-xs font-bold text-[#5b7067]">{roleNames[user.role]}</span><button onClick={()=>setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-[#71847b] hover:bg-[#f3f6f4]"><X size={20}/></button></div>{sidebarLinks}{sidebarFooter}</aside></div>}
    <main className="lg:pl-[270px]"><header data-topbar-themed="true" style={{backgroundColor:palettes[appearance.topbar].main,color:palettes[appearance.topbar].text}} className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-[#e7eeea] px-4 backdrop-blur sm:px-6 xl:px-9"><div className="flex items-center gap-3"><button onClick={()=>setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5ece8] text-[#425c51] hover:bg-[#f5f8f6] lg:hidden"><Menu size={21}/></button><Image src="/logo.jpeg" alt="Birnin Kudu General Hospital" width={48} height={48} className="h-12 w-12 rounded-full bg-white object-contain p-1"/></div><div className="flex items-center gap-2 sm:gap-3"><div role="status" aria-live="polite" className={`hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold sm:flex ${online?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{online?<Wifi size={14}/>:<WifiOff size={14}/>}<span>{online?'Online':'Offline'} · {online?'Synced':`${pending} pending`}</span></div><div ref={profileMenuRef} className="relative">
  <button type="button" onClick={()=>setProfileOpen(value=>!value)} aria-haspopup="menu" aria-expanded={profileOpen} className="topbar-profile-trigger flex items-center gap-2 rounded-xl p-1.5 text-left hover:bg-[#f3f7f5]">
    {user.profile_photo_url?<img src={user.profile_photo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover"/>:<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f1eb] text-xs font-bold text-brand-700">{initials}</div>}
    <div className="hidden max-w-[180px] sm:block"><div className="topbar-profile-name truncate text-sm font-bold">{user.name}</div><div className="topbar-profile-role truncate text-[11px]">{roleNames[user.role]}</div></div>
    <ChevronDown size={16} className={profileOpen ? "topbar-profile-chevron hidden rotate-180 sm:block" : "topbar-profile-chevron hidden sm:block"}/>
  </button>
  {profileOpen&&<div role="menu" className="absolute right-0 top-full z-50 mt-2 w-[min(86vw,300px)] overflow-hidden rounded-2xl border border-[#e5ece8] bg-white shadow-xl">
    <div className="border-b border-[#edf1ef] px-4 py-4"><div className="flex items-center gap-3">{user.profile_photo_url?<img src={user.profile_photo_url} alt="" className="h-11 w-11 rounded-full object-cover"/>:<div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e3f1eb] text-xs font-bold text-brand-700">{initials}</div>}<div className="min-w-0"><div className="truncate text-sm font-bold text-[#233b33]">{user.name}</div><div className="mt-1 break-all text-xs text-[#7d8d86]">{user.email}</div></div></div><div className="mt-2 inline-flex rounded-full bg-[#edf7f1] px-2.5 py-1 text-[10px] font-semibold text-brand-700">{roleNames[user.role]}</div>{user.department?.name&&<div className="mt-2 text-xs text-[#82928b]">{user.department.name}</div>}</div>
    <Link role="menuitem" href="/account" onClick={()=>setProfileOpen(false)} className="flex w-full items-center gap-3 border-b border-[#edf1ef] px-4 py-3 text-left text-sm font-semibold text-[#425c51] hover:bg-[#f7f9f8]"><UserRound size={17}/>Profile & account settings</Link>
    <button role="menuitem" onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut size={17}/>Sign out</button>
  </div>}
</div></div></header><div id="main-content" tabIndex={-1} className="workspace-content mx-auto max-w-[1680px] p-4 outline-none sm:p-6 xl:p-9 2xl:p-10">{children}</div></main>
    {appearanceOpen&&<><button aria-label="Close appearance settings" onClick={()=>setAppearanceOpen(false)} className="fixed inset-0 z-40 cursor-default bg-black/10 lg:bg-transparent"/><section role="dialog" aria-modal="true" aria-label="Appearance settings" className="fixed bottom-4 left-4 z-50 max-h-[85vh] w-[min(92vw,360px)] overflow-y-auto rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-2xl lg:left-[286px]"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-base font-extrabold text-[#233b33]">Appearance</h2><p className="mt-1 text-[11px] text-[#82928b]">Customize the hospital workspace colors.</p></div><button onClick={()=>setAppearanceOpen(false)} aria-label="Close appearance settings" className="rounded-lg p-1.5 text-[#71847b] hover:bg-[#f3f6f4]"><X size={18}/></button></div>
      {[['topbar','Topbar color'],['sidebar','Sidebar color'],['accent','Icons & tools']].map(([key,label])=><div key={key} className="mb-4"><h3 className="mb-2 text-xs font-bold text-[#52685f]">{label}</h3><div className="grid grid-cols-3 gap-2">{(Object.keys(palettes) as PaletteName[]).map(name=><button key={name} type="button" onClick={()=>selectAppearance(key as keyof Appearance,name)} aria-pressed={appearance[key as keyof Appearance]===name} className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-[10px] font-semibold ${appearance[key as keyof Appearance]===name?'border-brand-500 bg-brand-50 text-brand-700':'border-[#e5ece8] text-[#63786e] hover:bg-[#f7f9f8]'}`}><span className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{backgroundColor:palettes[name].main}}/><span className="truncate">{palettes[name].label}</span></button>)}</div></div>)}
      <label className="mt-1 block border-t border-[#edf1ef] pt-4"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#52685f]"><Sun size={14}/><Moon size={14}/>Display mode</span><select aria-label="Choose display mode" value={theme} onChange={e=>selectTheme(e.target.value as ThemePreference)} className="h-10 w-full rounded-lg border border-[#e5ece8] bg-white px-3 text-xs font-semibold"><option value="system">Use device setting</option><option value="light">Light theme</option><option value="dark">Dark theme</option></select><span className="mt-1 block text-[10px] text-[#8b9a94]">Colors and display mode are saved on this device.</span></label>
    </section></>}
  </div>;
}
export function PageHeading({eyebrow,title,description,action}:{eyebrow?:string;title:string;description:string;action?:React.ReactNode}){return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow&&<div className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-brand-600">{eyebrow}</div>}<h1 className="text-3xl font-extrabold tracking-[-.04em] text-[#18332c] sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-[#82928b]">{description}</p></div>{action}</div>}

