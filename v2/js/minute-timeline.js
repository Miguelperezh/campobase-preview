import { buildAutoPlan } from './reparto-plan.js';
import { describeMoment, validLineup } from './match-moments.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const models = new Map();
const choices = new Map();

export function planFromMoments(moments, playerIds, keeperIds, duration = 70) {
  const ordered = [...moments].sort((a,b)=>a.minute-b.minute);
  const segs = Object.fromEntries(playerIds.map(id=>[id,[]]));
  const groups = [];
  ordered.forEach((moment,index)=>{
    const from = Math.max(0, Number(moment.minute)||0);
    const to = Math.min(duration, ordered[index+1]?.minute ?? duration);
    if(to>from) for(const slot of moment.team||[]) if(segs[slot.playerId]) segs[slot.playerId].push({from,to});
    if(index) groups.push({m:from,list:describeMoment(ordered[index-1],moment).pairs.map(pair=>({out:pair.outId,inn:pair.inId}))});
  });
  return {D:duration,H:duration/2,field:playerIds.filter(id=>!keeperIds.includes(id)),gks:keeperIds,segs,
    gkPlan:keeperIds.flatMap(id=>segs[id].map(segment=>({id,...segment}))),
    planned:Object.fromEntries(playerIds.map(id=>[id,segs[id].reduce((sum,s)=>sum+s.to-s.from,0)])),groups};
}

// Permute the automatic rotation to preserve the chosen starting lineup. Each
// later lineup is materialized simultaneously, so crossed changes stay unique.
export function proposePrepMoments({initial,playerIds,keeperIds,format='F7',mode='escalonado',playerNumbers={},idFactory=()=>crypto.randomUUID()}) {
  const auto = buildAutoPlan({format,playerIds,keeperIds,planMode:mode,playerNumbers});
  if(!validLineup(initial.team,playerIds,auto.slots+1)) throw new Error('Completa los titulares antes de proponer cambios.');
  const keeperSlot=initial.team.findIndex(slot=>slot.pos==='Portero');
  if(keeperSlot<0 || !keeperIds.includes(initial.team[keeperSlot].playerId)) throw new Error('Elige un portero convocado como titular.');
  const fieldSlots=initial.team.map((slot,index)=>index).filter(index=>index!==keeperSlot);
  if(fieldSlots.some(index=>keeperIds.includes(initial.team[index].playerId))) throw new Error('Los porteros se reparten por separado.');
  const first=auto.lineupAt(0);
  const replacements=new Map([[first.gk,initial.team[keeperSlot].playerId]]);
  first.slots.forEach((id,index)=>replacements.set(id,initial.team[fieldSlots[index]].playerId));
  for(const ids of [auto.gks,auto.field]) {
    const unused=ids.filter(id=>![...replacements.values()].includes(id));
    ids.filter(id=>!replacements.has(id)).forEach((id,index)=>replacements.set(id,unused[index]));
  }
  const moments=[{...initial,minute:0,team:initial.team.map(slot=>({...slot}))}];
  for(const group of auto.groups.filter(group=>group.m>0&&group.m<auto.D)) {
    const team=moments.at(-1).team.map(slot=>({...slot}));
    for(const change of group.list) {
      const slot=change.slot==='gk'?keeperSlot:fieldSlots[Number(change.slot)];
      if(slot!==undefined)team[slot].playerId=replacements.get(change.inn);
    }
    if(!validLineup(team,playerIds,auto.slots+1)) throw new Error('No se pudo construir una rotación completa.');
    moments.push({id:idFactory(),minute:group.m,formation:initial.formation,team});
  }
  return moments;
}
export function rotationPlanMoments(plan, template, idFactory=()=>crypto.randomUUID()) {
  if (!plan?.lineupAt || !template?.team?.length) throw new Error('El plan no contiene una alineación completa.');
  const keeperSlot=template.team.findIndex(slot=>slot.pos==='Portero');
  const fieldSlots=template.team.map((slot,index)=>index).filter(index=>index!==keeperSlot);
  const first=plan.lineupAt(0);
  const team=template.team.map(slot=>({...slot}));
  if(keeperSlot<0 || first.slots.length!==fieldSlots.length) throw new Error('La formación no coincide con el plan.');
  team[keeperSlot].playerId=first.gk;
  first.slots.forEach((id,index)=>team[fieldSlots[index]].playerId=id);
  const moments=[{...template,id:idFactory(),minute:0,team}];
  const boundaries=[...new Set([...(plan.gkPlan||[]).map(s=>s.from),...Object.values(plan.segs||{}).flat().map(s=>s.from)])].filter(t=>t>0&&t<plan.D).sort((a,b)=>a-b);
  for(const time of boundaries) {
    const lineup=plan.lineupAt(time+0.00001);
    const next=team.map(slot=>({...slot}));
    next[keeperSlot].playerId=lineup.gk;
    lineup.slots.forEach((id,index)=>next[fieldSlots[index]].playerId=id);
    if(!validLineup(next,[...plan.gks,...plan.field],team.length)) throw new Error('El plan tiene jugadores duplicados.');
    moments.push({id:idFactory(),minute:Number(time.toFixed(2)),formation:template.formation,team:next});
  }
  return moments;
}
const exact = value => Number(Number(value).toFixed(2)).toLocaleString('es-ES');
export function accumulatedMinutes(segments, minute) {
  return segments.reduce((sum,segment)=>sum+Math.max(0,Math.min(minute,segment.to)-segment.from),0);
}
export function renderMinuteTimeline(plan, players, key) {
  const ids=[...(plan.gks||[]),...(plan.field||[])];
  const rows=ids.map(id=>({id,player:players.find(p=>p.id===id),segments:(plan.gks||[]).includes(id)?plan.gkPlan.filter(s=>s.id===id):(plan.segs[id]||[])}));
  models.set(key,{plan,rows});
  const previous=choices.get(key)||{};
  const selected=ids.includes(previous.selected)?previous.selected:ids[0];
  const minute=Math.min(plan.D,previous.minute??0);
  choices.set(key,{selected,minute});
  return `<section class="cbx-minute-timeline" data-minute-timeline="${esc(key)}"><p class="meta">Toca un jugador o su barra y mueve el minuto para ver cuánto lleva jugado.</p><div class="cbx-minute-shortcuts"><button type="button" class="secondary" data-minute-jump="0">Inicio · 0′</button><button type="button" class="secondary" data-minute-jump="${plan.H}">Descanso · ${plan.H}′</button><button type="button" class="secondary" data-minute-jump="${plan.D}">Final · ${plan.D}′</button></div><label class="cbx-minute-control">Consultar minuto <output>${minute}′</output><input type="range" min="0" max="${plan.D}" value="${minute}" aria-label="Minuto del plan"></label><div class="cbx-minute-axis"><span>0′</span><span>${plan.H}′ · descanso</span><span>${plan.D}′</span></div><div class="cbx-minute-rows">${rows.map(row=>`<button type="button" class="cbx-minute-row secondary" data-minute-player="${esc(row.id)}" aria-pressed="${row.id===selected}" title="${esc(row.player?.name||row.id)}"><span class="cbx-minute-person"><b>${esc(row.player?.number||'—')}</b><span>${esc(row.player?.name||'Jugador')}</span></span><span class="cbx-minute-track">${row.segments.map(s=>`<i style="left:${s.from/plan.D*100}%;width:${(s.to-s.from)/plan.D*100}%" title="${s.from}′ a ${s.to}′"></i>`).join('')}<em style="left:${minute/plan.D*100}%"></em></span><span class="cbx-minute-total"><b>${exact(accumulatedMinutes(row.segments,minute))}′</b><small>de ${exact(plan.planned[row.id]||0)}′</small></span><span class="cbx-minute-spans">${row.segments.map(s=>`${exact(s.from)}′–${exact(s.to)}′ · ${exact(s.to-s.from)} min`).join(' / ')||'Sin minutos'}</span></button>`).join('')}</div><div class="cbx-minute-selection" aria-live="polite"></div></section>`;
}
function update(root) {
  const key=root.dataset.minuteTimeline;
  const model=models.get(key);const choice=choices.get(key);
  if(!model||!choice) return;
  root.querySelector('output').textContent=choice.minute+'′';
  root.querySelectorAll('[data-minute-player]').forEach(button=>{
    const row=model.rows.find(row=>row.id===button.dataset.minutePlayer);
    button.setAttribute('aria-pressed',String(row.id===choice.selected));
    button.querySelector('.cbx-minute-total b').textContent=exact(accumulatedMinutes(row.segments,choice.minute))+'′';
    button.querySelector('em').style.left=choice.minute/model.plan.D*100+'%';
  });
  const row=model.rows.find(row=>row.id===choice.selected);
  if(row) root.querySelector('.cbx-minute-selection').innerHTML=`<strong>${esc(row.player?.name||'Jugador')}</strong><span>En el minuto ${choice.minute}′: <b>${exact(accumulatedMinutes(row.segments,choice.minute))}′ jugados</b> · total previsto ${exact(model.plan.planned[row.id]||0)}′</span><small>${row.segments.map(s=>`${exact(s.from)}′–${exact(s.to)}′ (${exact(s.to-s.from)} min)`).join(' · ')||'Sin tramo asignado'}</small>`;
}
export function wireMinuteTimelines(doc=document) {
  if(doc.__minuteTimelineWired)return;doc.__minuteTimelineWired=true;
  doc.addEventListener('click',event=>{const jump=event.target.closest?.('[data-minute-jump]');if(jump){const root=jump.closest('[data-minute-timeline]');choices.get(root.dataset.minuteTimeline).minute=Number(jump.dataset.minuteJump);root.querySelector('input[type=range]').value=jump.dataset.minuteJump;update(root);return;}const button=event.target.closest?.('[data-minute-player]');if(!button)return;const root=button.closest('[data-minute-timeline]');choices.get(root.dataset.minuteTimeline).selected=button.dataset.minutePlayer;update(root);});
  doc.addEventListener('input',event=>{const root=event.target.closest?.('[data-minute-timeline]');if(!root||event.target.type!=='range')return;choices.get(root.dataset.minuteTimeline).minute=Number(event.target.value);update(root);});
}
