export function getApiUrl(){return '/api';}
export async function resolveApiUrl(){return '/api';}
export class ApiError extends Error{status:number;constructor(message:string,status:number){super(message);this.name='ApiError';this.status=status;}}
export async function apiFetch<T=any>(path:string,init:RequestInit={}):Promise<T>{
  const token=typeof window!=='undefined'?localStorage.getItem('bkd_token'):null;
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!(init.body instanceof FormData)&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  if(token)headers.set('Authorization',`Bearer ${token}`);
  const controller=new AbortController();
  const abortFromCaller=()=>controller.abort();
  if(init.signal?.aborted)controller.abort();
  else init.signal?.addEventListener('abort',abortFromCaller,{once:true});
  const timeout=typeof window!=='undefined'?window.setTimeout(()=>controller.abort(),30000):undefined;
  try{
    const response=await fetch(`${await resolveApiUrl()}${path.startsWith('/')?path:`/${path}`}`,{...init,headers,signal:controller.signal});
    const data=await response.json().catch(()=>null);
    if(!response.ok){
      if(response.status===401&&typeof window!=='undefined'){
        localStorage.removeItem('bkd_token');
        localStorage.removeItem('bkd_user');
        window.location.assign('/login');
      }
      const validation=data?.errors?Object.values(data.errors).flat().join(' '):'';
      throw new ApiError(validation||data?.message||`Request failed (${response.status}).`,response.status);
    }
    return data as T;
  }catch(error){
    if(controller.signal.aborted)throw new ApiError('The server took too long to respond. Please retry.',0);
    if(error instanceof ApiError)throw error;
    throw new ApiError(error instanceof Error?error.message:'Could not reach the Next.js application.',0);
  }finally{
    if(timeout!==undefined)window.clearTimeout(timeout);
    init.signal?.removeEventListener('abort',abortFromCaller);
  }
}
export function rows<T>(payload:any):T[]{return Array.isArray(payload)?payload:(Array.isArray(payload?.data)?payload.data:[]);}
