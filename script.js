// Set FORM_ENDPOINT to a form service URL (e.g. Formspree) to receive bookings by email.
const FORM_ENDPOINT = '';
const $ = s => document.querySelector(s);
const SERVICES = {
  'Hair': [['Signature haircut','Consultation, cut, wash and style.',55,'45 min'],['Colour and gloss','Root touch-up or full colour with a shine finish.',120,'2 hr'],['Silk press','Smooth, bouncy blowout with heat protection.',75,'1 hr']],
  'Beard and shave': [['Hot towel shave','Classic straight-razor shave with warm towels.',45,'35 min'],['Beard sculpt','Shape, trim and oil for a clean outline.',30,'25 min']],
  'Skin': [['Glass skin facial','Cleanse, exfoliate, mask and massage for all skin types.',90,'60 min'],['Skin consultation','One-on-one routine plan and product picks.',25,'20 min']],
  'Event and bridal': [['Event styling','Hair and finishing touches for your big day.',110,'90 min'],['Bridal party (per person)','Trial included. Book a group note below.',95,'75 min']]
};
let cart = JSON.parse(sessionStorage.getItem('gr-cart')||'[]'); let group = Object.keys(SERVICES)[0];
const save = () => { try{sessionStorage.setItem('gr-cart',JSON.stringify(cart))}catch(e){} };

function renderTabs(){
  $('#tabs').innerHTML = Object.keys(SERVICES).map(g=>`<button class="tab" role="tab" aria-selected="${g===group}" data-g="${g}">${g}</button>`).join('');
}
function renderList(){
  $('#svcList').innerHTML = SERVICES[group].map(s=>{const on=cart.includes(s[0]);return `<div class="svc"><h3>${s[0]}</h3>
  <div class="meta"><span class="price">$${s[2]}<small>${s[3]}</small></span><button class="add" aria-pressed="${on}" aria-label="${on?'Remove':'Add'} ${s[0]}" data-n="${s[0]}">${on?'✓':'+'}</button></div><p>${s[1]}</p></div>`}).join('');
}
function all(){return Object.values(SERVICES).flat()}
function renderCart(){
  const items = all().filter(s=>cart.includes(s[0]));
  $('#cartList').innerHTML = items.length ? items.map(s=>`<li><span>${s[0]}</span><span>$${s[2]}</span></li>`).join('') : '<li class="empty">Nothing added yet.</li>';
  $('#cartTot').textContent = '$'+items.reduce((a,s)=>a+s[2],0);
  $('#picked').textContent = items.length ? 'Services: '+items.map(s=>s[0]).join(', ')+' · about $'+items.reduce((a,s)=>a+s[2],0) : 'No services added yet. You can add them above or tell us in the note.';
}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;group=b.dataset.g;renderTabs();renderList()});
$('#svcList').addEventListener('click',e=>{const b=e.target.closest('.add');if(!b)return;const n=b.dataset.n;cart=cart.includes(n)?cart.filter(x=>x!==n):[...cart,n];save();renderList();renderCart()});
renderTabs();renderList();renderCart();

// open now (New York time)
function hours(){
  const p = new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',hour12:false}).formatToParts(new Date());
  const d = p.find(x=>x.type==='weekday').value, h = +p.find(x=>x.type==='hour').value%24;
  const open = d==='Mon'?false : d==='Sun' ? h>=11&&h<18 : h>=10&&h<20;
  $('#status').classList.toggle('open',open);
  $('#statusText').textContent = open ? 'Open now in New York' : 'Closed right now · book for the next opening';
}
hours();

// slots
const TIMES=['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const dateEl=$('#date'); const today=new Date(); const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
dateEl.min=iso(today); $('#yr').textContent=today.getFullYear();
function fmt(t){const [h,m]=t.split(':');const H=+h;return (H%12||12)+':'+m+(H<12?' am':' pm')}
function renderSlots(){
  const v=dateEl.value; const box=$('#slots');
  if(!v){box.innerHTML='<p style="color:var(--ink2)">Choose a date to see times.</p>';return}
  const d=new Date(v+'T12:00:00'), dow=d.getDay();
  if(dow===1){box.innerHTML='<p>We’re closed on Mondays. Please pick another day.</p>';return}
  const isToday=v===iso(today), nowH=today.getHours()+today.getMinutes()/60;
  const seed=[...v].reduce((a,c)=>a+c.charCodeAt(0),0);
  box.innerHTML=TIMES.map((t,i)=>{
    const H=+t.slice(0,2); const outside=(dow===0&&(H<11||H>=18)); if(outside)return '';
    const taken=(seed+i*7)%5===0 || (isToday&&H<=nowH);
    return `<label class="slot"><input type="radio" name="time" value="${t}" ${taken?'disabled':''}><span>${fmt(t)}</span></label>`}).join('');
}
dateEl.addEventListener('change',renderSlots);renderSlots();

$('#form').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,msg=$('#msg');msg.className='msg';
  const data=Object.fromEntries(new FormData(f));data.services=cart.join(', ');
  if(!data.name?.trim()||!data.contact?.trim()||!data.date){msg.className='msg err';msg.textContent='Add your name, contact details and a date.';return}
  if(!data.time){msg.className='msg err';msg.textContent='Choose an available time.';return}
  msg.textContent='Sending…';
  try{
    if(FORM_ENDPOINT){const r=await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)});if(!r.ok)throw 0}
    f.innerHTML=`<div class="done"><h3>You’re on the list, ${data.name.split(' ')[0]}.</h3><p>We’ll confirm ${new Date(data.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} at ${fmt(data.time)} by ${data.contact.includes('@')?'email':'phone'} shortly.</p></div>`;
    cart=[];save();renderList();renderCart();
  }catch(err){msg.className='msg err';msg.textContent='We couldn’t send that. Please call +1 786 233 7234 instead.'}
});

// reviews
const R=[['Best grooming visit I’ve had. The team is professional and the results are always sharp.','Alex P.'],['Their skincare advice changed my routine for the better. I finally know what my skin needs.','Priya S.'],['The attention to detail is unmatched. I always leave feeling confident and refreshed.','Michael R.']];
let qi=0,timer;
function showQ(i){qi=(i+R.length)%R.length;$('#quote').textContent='“'+R[qi][0]+'”';$('#who').textContent=R[qi][1];$('#qCount').textContent=(qi+1)+' of '+R.length}
function auto(){clearInterval(timer);if(!matchMedia('(prefers-reduced-motion:reduce)').matches)timer=setInterval(()=>showQ(qi+1),7000)}
$('#prev').onclick=()=>{showQ(qi-1);auto()};$('#next').onclick=()=>{showQ(qi+1);auto()};showQ(0);auto();

// mobile menu
const burger=$('#burger'),menu=$('#menu');
function toggleMenu(o){burger.setAttribute('aria-expanded',o);menu.classList.toggle('open',o);document.body.style.overflow=o?'hidden':''}
burger.onclick=()=>toggleMenu(burger.getAttribute('aria-expanded')!=='true');
menu.addEventListener('click',e=>{if(e.target.tagName==='A')toggleMenu(false)});
addEventListener('keydown',e=>{if(e.key==='Escape')toggleMenu(false)});