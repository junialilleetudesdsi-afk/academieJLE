export const poleColors={'Bureau':'#193653','ActiCo':'#f15b38','Qualité':'#7358b5','Marketing':'#168b87','DSI':'#b48825','Non affecté':'#71818d'};
export const success=row=>row.total?row.score/row.total*100:null;
export const participation=row=>row.members?row.active/row.members*100:0;
export const perMember=row=>row.members?row.total/row.members:0;
export function summarize(rows){return rows.reduce((sum,r)=>({attempts:sum.attempts+r.attempts,score:sum.score+r.score,total:sum.total+r.total,active:sum.active+r.active,members:sum.members+r.members}),{attempts:0,score:0,total:0,active:0,members:0})}
export function weekEnd(week){const date=new Date(week+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+6);return date.toISOString().slice(0,10)}
export function lineSegments(points){const segments=[];let segment=[];for(const p of points){if(p===null){if(segment.length)segments.push(segment);segment=[]}else segment.push(p)}if(segment.length)segments.push(segment);return segments}
