import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLeagueSummary, sessionMinutes} from '../js/today-dashboard.js';
test('la temporada solo suma resultados finalizados de Liga, sin amistosos ni marcadores ausentes',()=>{
 const summary=buildLeagueSummary([{id:'1',type:'league',status:'finished',goalsFor:2,goalsAgainst:1},{id:'2',type:'friendly',status:'finished',goalsFor:10,goalsAgainst:0},{id:'3',type:'league',status:'planned',goalsFor:4,goalsAgainst:0},{id:'4',type:'league',status:'finished',goalsFor:null,goalsAgainst:null}]);
 assert.equal(summary.games.length,1);assert.equal(summary.goalsFor,2);assert.equal(summary.goalsAgainst,1);assert.equal(summary.points,3);
});
test('una sesión vacía no presenta la duración objetivo como minutos completados',()=>{
 assert.equal(sessionMinutes({blocks:[],totalDuration:0,targetDuration:75}),0);
 assert.equal(sessionMinutes({blocks:[{duration:15},{duration:20}],targetDuration:75}),35);
});

test('Lo próximo conserva la sesión posterior aunque también haya una hoy', async()=>{
 const {buildTodaySummary}=await import('../js/today-dashboard.js');
 const summary=buildTodaySummary({now:new Date('2026-09-28T12:00:00'),sessions:[{id:'today',date:'2026-09-28'},{id:'next',date:'2026-09-29'},{id:'later',date:'2026-10-01'}]});
 assert.equal(summary.nextSession.id,'today');assert.equal(summary.upcomingSession.id,'next');
 assert.deepEqual(summary.upcomingSessions.map(session=>session.id),['next','later']);
});
