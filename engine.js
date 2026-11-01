/* JETLAG ZERO v3.0 - pure itinerary and guidance engine (no browser dependencies). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JetlagEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const H = 3600000, M = 60000, D = 24 * H;
  const airports = {
    NRT:['成田','Asia/Tokyo'], HND:['羽田','Asia/Tokyo'], KIX:['関西','Asia/Tokyo'], NGO:['中部','Asia/Tokyo'], FUK:['福岡','Asia/Tokyo'], CTS:['新千歳','Asia/Tokyo'],
    DOH:['ドーハ','Asia/Qatar'], DXB:['ドバイ','Asia/Dubai'], AUH:['アブダビ','Asia/Dubai'], IST:['イスタンブール','Europe/Istanbul'],
    MUC:['ミュンヘン','Europe/Berlin'], FRA:['フランクフルト','Europe/Berlin'], BER:['ベルリン','Europe/Berlin'], HAM:['ハンブルク','Europe/Berlin'],
    CDG:['パリCDG','Europe/Paris'], ORY:['パリORY','Europe/Paris'], LHR:['ロンドン','Europe/London'], LGW:['ロンドンGatwick','Europe/London'],
    AMS:['アムステルダム','Europe/Amsterdam'], BRU:['ブリュッセル','Europe/Brussels'], FCO:['ローマ','Europe/Rome'], MXP:['ミラノ','Europe/Rome'],
    MAD:['マドリード','Europe/Madrid'], BCN:['バルセロナ','Europe/Madrid'], ZRH:['チューリッヒ','Europe/Zurich'], VIE:['ウィーン','Europe/Vienna'],
    HEL:['ヘルシンキ','Europe/Helsinki'], CPH:['コペンハーゲン','Europe/Copenhagen'], ARN:['ストックホルム','Europe/Stockholm'], ATH:['アテネ','Europe/Athens'],
    ICN:['仁川','Asia/Seoul'], GMP:['金浦','Asia/Seoul'], PVG:['上海浦東','Asia/Shanghai'], SHA:['上海虹橋','Asia/Shanghai'], PEK:['北京','Asia/Shanghai'],
    HKG:['香港','Asia/Hong_Kong'], TPE:['台北','Asia/Taipei'], SIN:['シンガポール','Asia/Singapore'], BKK:['バンコク','Asia/Bangkok'],
    KUL:['クアラルンプール','Asia/Kuala_Lumpur'], DEL:['デリー','Asia/Kolkata'], BOM:['ムンバイ','Asia/Kolkata'],
    NBO:['ナイロビ','Africa/Nairobi'], ADD:['アディスアベバ','Africa/Addis_Ababa'], JNB:['ヨハネスブルク','Africa/Johannesburg'], CPT:['ケープタウン','Africa/Johannesburg'],
    CAI:['カイロ','Africa/Cairo'], RAK:['マラケシュ','Africa/Casablanca'], CMN:['カサブランカ','Africa/Casablanca'],
    JFK:['ニューヨークJFK','America/New_York'], EWR:['ニューアーク','America/New_York'], BOS:['ボストン','America/New_York'], IAD:['ワシントン','America/New_York'],
    ORD:['シカゴ','America/Chicago'], DFW:['ダラス','America/Chicago'], DEN:['デンバー','America/Denver'],
    LAX:['ロサンゼルス','America/Los_Angeles'], SFO:['サンフランシスコ','America/Los_Angeles'], SEA:['シアトル','America/Los_Angeles'],
    YVR:['バンクーバー','America/Vancouver'], YYZ:['トロント','America/Toronto'], HNL:['ホノルル','Pacific/Honolulu'],
    SYD:['シドニー','Australia/Sydney'], MEL:['メルボルン','Australia/Melbourne'], AKL:['オークランド','Pacific/Auckland']
  };
  const demo = [
    {origin:'NRT',dest:'DOH',depInput:'20261213 2155',arrInput:'20261214 0440'},
    {origin:'DOH',dest:'MUC',depInput:'20261214 0925',arrInput:'20261214 1325'}
  ];
  const dtfs=new Map();
  function dtf(tz){if(!dtfs.has(tz))dtfs.set(tz,new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return dtfs.get(tz)}
  function pad(n){return String(n).padStart(2,'0')}
  function parts(ms,tz){return Object.fromEntries(dtf(tz).formatToParts(new Date(ms)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]))}
  function offsetMin(ms,tz){const p=parts(ms,tz);return (Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(ms/1000)*1000)/M}
  function parseDateTime(value){
    const v=String(value||'').trim();let m=v.match(/^(\d{4})(\d{2})(\d{2})\s?(\d{2})(\d{2})$/);
    if(!m)m=v.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})$/);
    if(!m)return null;const [y,mon,d,h,min]=m.slice(1).map(Number),date=new Date(Date.UTC(y,mon-1,d,h,min));
    if(y<2000||y>2100||date.getUTCFullYear()!==y||date.getUTCMonth()+1!==mon||date.getUTCDate()!==d||date.getUTCHours()!==h||date.getUTCMinutes()!==min)return null;
    return {y,mon,d,h,min,iso:`${y}-${pad(mon)}-${pad(d)}T${pad(h)}:${pad(min)}`,compact:`${y}${pad(mon)}${pad(d)} ${pad(h)}${pad(min)}`};
  }
  function localToUtc(value,tz){
    const p=parseDateTime(value);if(!p||!tz)return NaN;
    const wall=Date.UTC(p.y,p.mon-1,p.d,p.h,p.min),offsets=new Set([-36,-12,0,12,36].map(h=>offsetMin(wall+h*H,tz)));
    const matches=[];for(const off of offsets){const ms=wall-off*M,z=parts(ms,tz);if(z.year===p.y&&z.month===p.mon&&z.day===p.d&&z.hour===p.h&&z.minute===p.min)matches.push(ms)}
    // During DST fall-back an hour can occur twice; choose the earlier occurrence.
    return matches.length?Math.min(...matches):NaN;
  }
  function fmt(ms,tz,{date=true,year=false}={}){if(!Number.isFinite(ms))return '—';const p=parts(ms,tz);return `${year?p.year+'/':''}${date?p.month+'/'+pad(p.day)+' ':''}${pad(p.hour)}:${pad(p.minute)}`}
  function iso(ms,tz){const p=parts(ms,tz);return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`}
  function compact(ms,tz){return parseDateTime(iso(ms,tz)).compact}
  function duration(ms){const minutes=Math.max(0,Math.round(ms/M));return `${Math.floor(minutes/60)}時間${minutes%60?pad(minutes%60)+'分':''}`}
  function durationShort(ms){const minutes=Math.max(0,Math.round(ms/M));return `${Math.floor(minutes/60)}h${pad(minutes%60)}m`}
  function hhmm(s,fallback){return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s||''))?s:fallback}
  function addLocalDay(ms,tz,days){const p=parts(ms,tz),z=new Date(Date.UTC(p.year,p.month-1,p.day+days));return [z.getUTCFullYear(),z.getUTCMonth()+1,z.getUTCDate()]}
  function localDayTime(y,m,d,hm,tz){const [h,min]=hm.split(':').map(Number);return localToUtc(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`,tz)}
  function createFlight(input){
    const raw=(input.segments||[]);if(raw.length<1||raw.length>6)throw Error('フライトは1〜6区間で登録してください。');
    let segments=[],warnings=[];
    for(const [i,rawSeg] of raw.entries()){
      const origin=String(rawSeg.origin||'').trim().toUpperCase(),dest=String(rawSeg.dest||'').trim().toUpperCase();
      if(!airports[origin]||!airports[dest])throw Error(`区間${i+1}：空港コードを確認してください（未登録の空港は追加対応が必要です）。`);
      if(origin===dest)throw Error(`区間${i+1}：出発空港と到着空港が同じです。`);
      const depDate=parseDateTime(rawSeg.depInput),arrDate=parseDateTime(rawSeg.arrInput);
      if(!depDate||!arrDate)throw Error(`区間${i+1}：日時は YYYYMMDD HHMM（例 20261213 2155）で入力してください。`);
      const dep=localToUtc(depDate.iso,airports[origin][1]),arr=localToUtc(arrDate.iso,airports[dest][1]);
      if(!Number.isFinite(dep)||!Number.isFinite(arr))throw Error(`区間${i+1}：現地に存在しない日時です。夏時間の切り替わりなどを確認してください。`);
      if(arr<=dep||arr-dep>30*H)throw Error(`区間${i+1}：到着日時が不正です。出発地・到着地の現地時刻を入力してください。`);
      if(i){if(segments[i-1].dest!==origin)throw Error(`区間${i+1}：前便の到着空港と出発空港が違います。`);if(dep<segments[i-1].arr)throw Error(`区間${i+1}：前の便が着陸する前に出発しています。`);if(dep-segments[i-1].arr<50*M)warnings.push(`${origin}の乗り継ぎは${duration(dep-segments[i-1].arr)}。最低乗継時間を航空会社に確認してね。`)}
      segments.push({origin,dest,originTz:airports[origin][1],destTz:airports[dest][1],depInput:depDate.compact,arrInput:arrDate.compact,dep,arr});
    }
    const depart=segments[0].dep,arrive=segments.at(-1).arr,origin=segments[0].origin,destination=segments.at(-1).dest;
    const bedtime=hhmm(input.bedtime,'23:00'),wake=hhmm(input.wake,'07:00'),priority=['balanced','sleep','arrival'].includes(input.priority)?input.priority:'balanced';
    const airMs=segments.reduce((n,s)=>n+s.arr-s.dep,0),layoverMs=arrive-depart-airMs;
    const tzOrigin=airports[origin][1],tzDest=airports[destination][1];
    const shift=(offsetMin(arrive,tzDest)-offsetMin(depart,tzOrigin))/60;
    const f={segments,origin,destination,tzOrigin,tzDest,depart,arrive,airMs,layoverMs,shift,bedtime,wake,priority,warnings};
    f.events=createSchedule(f);return f;
  }
  function stageAt(f,ms){
    if(ms<f.depart)return {type:'pre',label:'出発前',leg:-1,tz:f.tzOrigin};
    for(let i=0;i<f.segments.length;i++){
      const s=f.segments[i];if(ms<s.arr&&ms>=s.dep)return {type:'flight',label:`FLIGHT ${i+1} · ${s.origin} → ${s.dest}`,leg:i,tz:s.originTz};
      if(i<f.segments.length-1&&ms>=s.arr&&ms<f.segments[i+1].dep)return {type:'transfer',label:`${s.dest}で乗り継ぎ中`,leg:i,tz:s.destTz};
    }
    return {type:'post',label:`${f.destination} 到着後`,leg:f.segments.length-1,tz:f.tzDest};
  }
  function add(events,type,ms,title,desc,{leg=-1,kind='general',tone='normal',tz=null}={}){
    if(!Number.isFinite(ms))return;events.push({id:`${kind}-${Math.round(ms/M)}-${leg}`,type,ms,title,desc,leg,kind,tone,tz});
  }
  function sleepWindow(f,s){
    // Destination-night intersection with this one flight, never with the layover.
    const minStart=s.dep+45*M,maxEnd=s.arr-45*M;if(maxEnd-minStart<75*M)return null;
    let best=null;
    for(let day=-2;day<=2;day++){
      const [y,mo,d]=addLocalDay(s.dep,f.tzDest,day);
      const start=localDayTime(y,mo,d,f.bedtime,f.tzDest),next=new Date(Date.UTC(y,mo-1,d+1));
      const end=localDayTime(next.getUTCFullYear(),next.getUTCMonth()+1,next.getUTCDate(),f.wake,f.tzDest);
      if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;
      const a=Math.max(start,minStart),b=Math.min(end,maxEnd);
      if(b-a>=80*M&&(!best||b-a>best.end-best.start))best={start:a,end:b};
    }
    return best;
  }
  function createSchedule(f){
    const out=[],shift=f.shift,preDirection=Math.abs(shift)<2?'普段どおり睡眠を確保':shift<0?'就寝・起床を少し遅らせる':'就寝・起床を少し早める';
    for(let day=3;day>=1;day--)add(out,'pre',f.depart-day*D,`🌙 出発${day}日前 · 睡眠リズム`,`${preDirection}ことを意識。1日30〜60分程度を目安に、無理な寝不足は避けよう。`,{kind:'prep',tone:'sleep',tz:f.tzOrigin});
    add(out,'pre',f.depart-6*H,'🎒 機内で使うものを準備','アイマスク・イヤホン・水を手荷物へ。睡眠不足のまま出発しないように。',{kind:'packing',tz:f.tzOrigin});
    add(out,'pre',f.depart-3*H,'🛫 空港・搭乗の準備','チェックイン・保安検査の締切は航空会社の案内を優先してね。',{kind:'airport',tz:f.tzOrigin});
    for(let i=0;i<f.segments.length;i++){
      const seg=f.segments[i],sleep=sleepWindow(f,seg);
      add(out,'flight',seg.dep,`✈️ Flight ${i+1} 出発 · ${seg.origin} → ${seg.dest}`,'ここからこの便の予定飛行時間。時計は最終目的地にも合わせよう。',{leg:i,kind:'depart',tone:'move',tz:seg.originTz});
      if(!sleep&&f.priority==='sleep'&&seg.arr-seg.dep>=3*H){
        const napAt=seg.dep+Math.max(90*M,Math.round((seg.arr-seg.dep)*.42));
        if(napAt+35*M<seg.arr-45*M)add(out,'flight',napAt,'😴 短い仮眠（任意）','眠気が強ければ20〜30分ほど休んでOK。目的地の夜の睡眠を妨げないよう長寝は避けよう。',{leg:i,kind:'nap',tone:'sleep',tz:seg.originTz});
      }
      if(sleep){
        if(sleep.start-20*M>seg.dep+15*M)add(out,'flight',sleep.start-20*M,'🌗 睡眠の準備','画面を暗くし、アイマスクや耳栓を。目的地の夜に近い時間帯だよ。',{leg:i,kind:'sleep-prep',tone:'sleep',tz:seg.originTz});
        add(out,'flight',sleep.start,'😴 睡眠・休息タイム',`目的地の夜に合わせて休息（目安 ${duration(sleep.end-sleep.start)}）。眠れなければ静かに休むだけでもOK。`,{leg:i,kind:'sleep',tone:'sleep',tz:seg.originTz});
        add(out,'flight',sleep.end,'🌤 起床・リフレッシュ','水分補給、座席で軽いストレッチ。目的地の朝に向けて少しずつ。',{leg:i,kind:'wake',tone:'awake',tz:seg.originTz});
      }
      const from=seg.dep+75*M,until=seg.arr-65*M;
      for(let t=from;t<until;t+=150*M){
        if(sleep&&t>=sleep.start-35*M&&t<=sleep.end+20*M)continue;
        const p=parts(t,f.tzDest),night=p.hour>=22||p.hour<7;
        add(out,'flight',t,night?'🌙 休憩・水分補給':'💧 水分補給と体を動かす',night?'目的地は夜。無理に起き続けず、適度に休息しよう。':'座席で足首を回す・水分を取る。立ち歩く場合は安全なときに。',{leg:i,kind:'hydrate',tz:seg.originTz});
      }
      if(seg.arr-seg.dep>100*M)add(out,'flight',seg.arr-40*M,'🧳 着陸前の準備','着陸に備え、身の回り品を確認。シートベルトの指示を優先。',{leg:i,kind:'land-prep',tone:'move',tz:seg.destTz});
      if(i<f.segments.length-1){
        const next=f.segments[i+1],gap=next.dep-seg.arr;
        add(out,'transfer',seg.arr,`🛬 ${seg.dest} 到着 · 乗り継ぎ開始`,'この時刻から機内ではありません。乗継案内・次のゲートを確認。',{leg:i,kind:'land',tone:'move',tz:seg.destTz});
        if(gap>50*M)add(out,'transfer',seg.arr+20*M,'🚶 乗り継ぎ・休憩','空港内を移動し、軽く歩いて水分補給。次便の搭乗時間を確認。',{leg:i,kind:'transfer-move',tz:seg.destTz});
        if(gap>95*M)add(out,'transfer',next.dep-65*M,'🔎 次の搭乗に備える','ゲート変更や搭乗開始時刻は航空会社の情報が優先。',{leg:i,kind:'gate',tone:'move',tz:seg.destTz});
      }else{
        add(out,'post',seg.arr,`🎉 ${seg.dest} 到着！`,'ここから目的地の現地時間。機内タイムラインは終了。',{leg:i,kind:'arrive',tone:'move',tz:f.tzDest});
        add(out,'post',seg.arr+50*M,'🥤 到着後のリセット',f.priority==='arrival'?'到着後の活動に備え、食事と水分を整えて軽く動こう。眠ければ短い仮眠もOK。':'食事と水分を整え、無理のない範囲で軽く動こう。',{leg:i,kind:'reset',tz:f.tzDest});
      }
    }
    for(let n=0;n<3;n++){
      const [y,mo,d]=addLocalDay(f.arrive,f.tzDest,n),dayStart=localDayTime(y,mo,d,'00:00',f.tzDest),dayEnd=localDayTime(y,mo,d,'23:59',f.tzDest);
      if(!Number.isFinite(dayStart))continue;
      const light=localDayTime(y,mo,d,'12:00',f.tzDest);
      if(light>f.arrive+30*M)add(out,'post',light,'☀️ 日中の散歩・自然光','明るい時間に無理のない活動を。強い光が最適な時間は時差の方向・体内時計によって異なるよ。',{kind:'light',tone:'awake',tz:f.tzDest});
      const bed=localDayTime(y,mo,d,f.bedtime,f.tzDest);
      if(Number.isFinite(bed)&&bed>f.arrive){
        const caffeine=bed-6*H;if(caffeine>f.arrive)add(out,'post',caffeine,'☕ カフェインを控える','今夜の睡眠を妨げないよう、ここからはカフェインを控えめに。',{kind:'caffeine',tz:f.tzDest});
        if(bed-60*M>f.arrive)add(out,'post',bed-60*M,'🌙 明かりを落として就寝準備','スマホの明るさを下げ、静かな時間へ。',{kind:'bed-prep',tone:'sleep',tz:f.tzDest});
        add(out,'post',bed,'🛌 現地時間で就寝','眠れなくても無理せず。長い昼寝は夜の睡眠に響くことも。',{kind:'bed',tone:'sleep',tz:f.tzDest});
      }
    }
    out.sort((a,b)=>a.ms-b.ms||a.title.localeCompare(b.title));return out;
  }
  function elapsedFromDepart(f,ms){if(ms<f.depart)return `出発まで ${duration(f.depart-ms)}`;return `出発から +${duration(ms-f.depart)}`}
  function segmentElapsed(f,ms){const st=stageAt(f,ms);if(st.type==='flight')return `この便の出発から +${duration(ms-f.segments[st.leg].dep)}`;if(st.type==='transfer')return `乗継開始から +${duration(ms-f.segments[st.leg].arr)}`;return ''}
  function route(f){return f.segments.map(s=>s.origin).concat(f.destination).join(' → ')}
  function scheduleKind(f,e){if(e.type==='flight')return `Flight ${e.leg+1}`;if(e.type==='transfer')return `${f.segments[e.leg].dest}乗継`;if(e.type==='pre')return '出発前';return '到着後'}
  function eventPrimaryTz(f,e){return e.tz||(e.type==='post'?f.tzDest:e.type==='pre'?f.tzOrigin:f.segments[e.leg].originTz)}
  function firstRelevant(f,ms){const events=f.events.filter(e=>e.ms>ms);return events[0]||null}
  return {H,M,D,airports,demo,parseDateTime,localToUtc,fmt,iso,compact,parts,offsetMin,duration,durationShort,createFlight,createSchedule,stageAt,elapsedFromDepart,segmentElapsed,route,scheduleKind,eventPrimaryTz,firstRelevant,pad,sleepWindow};
});
