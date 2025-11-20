
export function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
