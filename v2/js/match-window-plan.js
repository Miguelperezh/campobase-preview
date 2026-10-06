import { validLineup, plannedMinutes } from './match-moments.js';
const clone = value => structuredClone(value);
export function validateWindowPlan(moments, availableIds, duration) {
  if (!moments.length || moments[0].minute !== 0) throw new Error('El plan debe comenzar en el minuto 0.');
  const size = moments[0].team.length;
  for (let i=0;i<moments.length;i++) {
    const moment=moments[i];
    if (!Number.isFinite(moment.minute) || moment.minute < 0 || moment.minute >= duration || (i && moment.minute <= moments[i-1].minute)) throw new Error('Las ventanas deben ir en orden, dentro del partido y sin minutos repetidos.');
    if (!validLineup(moment.team,availableIds,size)) throw new Error(`Completa todos los puestos, sin repetir jugadores, en el minuto ${moment.minute}.`);
  }
  return moments;
}
export function lineupAtMinute(moments, minute) {
  return moments.filter(moment=>moment.minute<=minute).at(-1) || moments[0];
}
export function insertWindowBoundary(moments, minute, duration, idFactory=()=>crypto.randomUUID()) {
  if (!Number.isFinite(minute) || minute<=0 || minute>=duration) throw new Error(`El cambio debe estar entre 0 y ${duration} minutos, sin incluir los extremos.`);
  if (moments.some(moment=>moment.minute===minute)) return clone(moments);
  const before=lineupAtMinute(moments,minute);
  return [...clone(moments),{...clone(before),id:idFactory(),minute}].sort((a,b)=>a.minute-b.minute);
}
export function changeWindowPlayer(moments, index, slotIndex, playerId) {
  const next=clone(moments);const team=next[index]?.team;
  if (!team?.[slotIndex]) throw new Error('Elige una ventana y un puesto.');
  const other=team.findIndex(slot=>slot.playerId===playerId);
  if(other>=0 && other!==slotIndex) team[other].playerId=team[slotIndex].playerId;
  team[slotIndex].playerId=playerId;
  return next;
}
export function normalizePlayerIntervals(intervals, duration) {
  const sorted=intervals.map(({from,to})=>({from:Number(from),to:Number(to)})).sort((a,b)=>a.from-b.from);
  const result=[];
  for(const interval of sorted) {
    if(!Number.isFinite(interval.from)||!Number.isFinite(interval.to)||interval.from<0||interval.to>duration||interval.from>=interval.to) throw new Error(`Cada tramo debe tener inicio menor que fin, entre 0 y ${duration}.`);
    if(result.length && interval.from<result.at(-1).to) throw new Error('Los tramos de un jugador no pueden solaparse.');
    if(result.length && interval.from===result.at(-1).to) result.at(-1).to=interval.to;
    else result.push(interval);
  }
  return result;
}
export function playerIntervals(moments, playerId, duration) {
  const intervals=[];
  moments.forEach((moment,index)=>{if(moment.team.some(slot=>slot.playerId===playerId))intervals.push({from:moment.minute,to:moments[index+1]?.minute??duration});});
  return normalizePlayerIntervals(intervals,duration);
}
// Outside the selected intervals the relief player takes the shared position.
// All other players, existing positional changes and formation changes survive.
export function configurePlayerIntervals({moments,playerId,reliefId,intervals,availableIds,duration,idFactory=()=>crypto.randomUUID()}) {
  validateWindowPlan(moments,availableIds,duration);
  if(playerId===reliefId || !availableIds.includes(playerId)||!availableIds.includes(reliefId)) throw new Error('Elige un jugador y un relevo distintos, ambos convocados.');
  const desired=normalizePlayerIntervals(intervals,duration);
  const template=moments.find(moment=>moment.team.some(slot=>[playerId,reliefId].includes(slot.playerId)));
  if(!template) throw new Error('Alinea primero al jugador o a su relevo en un puesto.');
  const sharedSlot=template.team.find(slot=>[playerId,reliefId].includes(slot.playerId));
  const boundaries=[...new Set([0,...moments.map(m=>m.minute),...desired.flatMap(s=>[s.from,s.to])])].filter(t=>t<duration).sort((a,b)=>a-b);
  const next=boundaries.map(minute=>{
    const original=lineupAtMinute(moments,minute);const team=clone(original.team);
    const present=team.map((slot,index)=>[playerId,reliefId].includes(slot.playerId)?index:-1).filter(index=>index>=0);
    if(present.length>1) throw new Error('Estos dos jugadores coinciden en campo. Elige otro relevo o edita esa ventana completa para recolocarlos.');
    const plays=desired.some(interval=>minute>=interval.from && minute<interval.to);
    const slotIndex=present[0] ?? (plays ? team.findIndex(slot=>slot.pos===sharedSlot.pos) : -1);
    if(slotIndex>=0) team[slotIndex].playerId=plays?playerId:reliefId;
    return {...clone(original),id:minute===original.minute?original.id:idFactory(),minute,team};
  });
  validateWindowPlan(next,availableIds,duration);
  const actual=plannedMinutes(next,duration)[playerId]||0;
  const expected=desired.reduce((sum,s)=>sum+s.to-s.from,0);
  if(Math.abs(actual-expected)>0.001)throw new Error('No se pudieron aplicar todos los tramos de ese jugador.');
  return next;
}
export function recommendedPlayerIntervals(duration,targetMinutes,blockMinutes=10) {
  if(!Number.isFinite(targetMinutes)||targetMinutes<0||targetMinutes>duration||!Number.isFinite(blockMinutes)||blockMinutes<=0)throw new Error('Los minutos objetivo deben estar entre 0 y la duración del partido.');
  const target=Number(targetMinutes);if(!target)return [];
  const count=Math.ceil(target/blockMinutes);
  const rest=(duration-target)/count;
  const intervals=[];let cursor=0,remaining=target;
  for(let i=0;i<count;i++) {
    const span=Math.min(blockMinutes,remaining);
    const from=Number(cursor.toFixed(3));const to=Number((cursor+span).toFixed(3));
    intervals.push({from,to});cursor+=span+rest;remaining-=span;
  }
  return normalizePlayerIntervals(intervals,duration);
}
export function completeProposedStarters(initial,playerIds,keeperIds) {
  const next=clone(initial);const used=new Set();
  for(const slot of next.team) {
    if(slot.playerId && playerIds.includes(slot.playerId) && !used.has(slot.playerId)) used.add(slot.playerId);
    else slot.playerId='';
  }
  for(const slot of next.team.filter(slot=>!slot.playerId).sort((a,b)=>(a.pos==='Portero'?-1:1)-(b.pos==='Portero'?-1:1))) {
    const candidates=slot.pos==='Portero'?keeperIds:playerIds.filter(id=>!keeperIds.includes(id));
    const id=candidates.find(id=>!used.has(id));
    if(!id)throw new Error('No hay suficientes convocados para completar los puestos.');
    slot.playerId=id;used.add(id);
  }
  return next;
}
