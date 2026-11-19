const $ = id => document.getElementById(id);
let tasks = JSON.parse(localStorage.tasks || '[]'), editing = null, deleting = null;
let month = new Date(), selected = new Date().toISOString().slice(0,10);
const today = () => new Date().toISOString().slice(0,10);
const save = () => localStorage.setItem('tasks', JSON.stringify(tasks));
const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status = t => t.completed ? 'completed' : t.dueDate < today() ? 'overdue' : 'pending';
const dateText = d => new Date(d+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
function toast(message) { const n=document.createElement('div'); n.className='toast'; n.textContent=message; $('toastRegion').append(n); setTimeout(()=>n.remove(),2500); }
function render() {
  const done=tasks.filter(t=>t.completed).length, overdue=tasks.filter(t=>status(t)==='overdue').length;
  const soon=tasks.filter(t=>!t.completed && (new Date(t.dueDate+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5>=0 && (new Date(t.dueDate+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5<=3).length;
  [['statTotal',tasks.length],['statCompleted',done],['statDueSoon',soon],['statOverdue',overdue],['navTaskCount',tasks.length-done]].forEach(([id,v])=>$(id).textContent=v);
  const pct=tasks.length?Math.round(done/tasks.length*100):0; $('progressPercent').textContent=pct+'%'; $('progressFill').style.width=pct+'%'; $('progressTrack').setAttribute('aria-valuenow',pct);
  $('progressCaption').textContent=tasks.length?`${done} of ${tasks.length} tasks completed.`:'Add your first task to get started.';
  ['high','medium','low'].forEach(p=>$(`${p}Count`).textContent=tasks.filter(t=>!t.completed&&t.priority===p).length);
  const upcoming=tasks.filter(t=>!t.completed).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  $('focusList').innerHTML=upcoming.slice(0,4).map(t=>`<div class="focus-task"><button class="task-check" data-done="${t.id}">✓</button><div class="focus-task-copy"><strong class="focus-task-title">${safe(t.title)}</strong><small class="focus-task-meta">${safe(t.subject)} · ${dateText(t.dueDate)}</small></div></div>`).join('')||'<p class="empty-state">No tasks yet. Add one to get started.</p>';
  $('deadlineList').innerHTML=upcoming.slice(0,5).map(t=>`<div class="deadline-item"><div class="deadline-copy"><strong>${safe(t.title)}</strong><small>${safe(t.subject)} · ${dateText(t.dueDate)}</small></div><span class="priority-badge ${t.priority}">${t.priority}</span></div>`).join('')||'<p class="empty-state">No upcoming deadlines.</p>';
  renderTasks(); renderSubjects(); if($('calendarView').classList.contains('active')) renderCalendar();
}
function renderTasks() {
  const q=$('searchInput').value.toLowerCase(), st=$('statusFilter').value, pr=$('priorityFilter').value, sort=$('sortSelect').value;
  let list=tasks.filter(t=>(`${t.title} ${t.subject} ${t.description}`.toLowerCase().includes(q))&&(st==='all'||status(t)===st)&&(pr==='all'||t.priority===pr));
  list.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='priority'?['low','medium','high'].indexOf(b.priority)-['low','medium','high'].indexOf(a.priority):sort==='due-desc'?b.dueDate.localeCompare(a.dueDate):a.dueDate.localeCompare(b.dueDate));
  $('taskResultsLabel').textContent=`${list.length} tasks shown`;
  $('taskList').innerHTML=list.length?'<div class="task-table-row task-table-head"><span>Task</span><span>Due date</span><span>Priority</span><span>Status</span><span>Actions</span></div>'+list.map(t=>`<div class="task-table-row"><div class="task-main-cell"><button class="task-check ${t.completed?'checked':''}" data-done="${t.id}">✓</button><div class="task-main-copy"><strong>${safe(t.title)}</strong><small>${safe(t.subject)}</small></div></div><span class="task-table-cell">${dateText(t.dueDate)}</span><span><i class="priority-badge ${t.priority}">${t.priority}</i></span><span><i class="status-badge ${status(t)}">${status(t)}</i></span><div class="task-actions-cell"><button class="mini-action" data-edit="${t.id}">✎</button><button class="mini-action" data-delete="${t.id}">×</button></div></div>`).join(''):'<p class="empty-state">No matching tasks. Try another filter.</p>';
}
function renderSubjects() { const colors=['dot-blue','dot-violet','dot-orange','dot-green']; $('subjectList').innerHTML=[...new Set(tasks.map(t=>t.subject))].map((s,i)=>`<span class="subject-dot ${colors[i%4]}"></span><span>${safe(s)}</span>`).join('')||'<span class="subject-dot dot-blue"></span><span>Add your subjects</span>'; }
function openForm(t) { editing=t?.id||null; $('taskForm').reset(); $('taskId').value=editing||''; $('dialogTitle').textContent=editing?'Edit task':'Add a new task'; $('taskTitle').value=t?.title||''; $('taskSubject').value=t?.subject||''; $('taskPriority').value=t?.priority||'medium'; $('taskDueDate').value=t?.dueDate||today(); $('taskDescription').value=t?.description||''; $('taskDialog').showModal(); }
function renderCalendar() {
  const y=month.getFullYear(), m=month.getMonth(), first=new Date(y,m,1), days=new Date(y,m+1,0).getDate();
  $('calendarMonthLabel').textContent=month.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  $('calendarGrid').innerHTML=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-weekday">${d}</div>`).join('')+Array(first.getDay()).fill('<span></span>').join('')+Array.from({length:days},(_,i)=>{let d=`${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`, count=tasks.filter(t=>t.dueDate===d).length;return `<button class="calendar-day ${d===selected?'selected':''}" data-date="${d}"><span class="day-number">${i+1}</span>${count?`<span class="day-task-count">${count}</span>`:''}</button>`}).join('');
  $('selectedDateTitle').textContent=dateText(selected); $('selectedDateTasks').innerHTML=tasks.filter(t=>t.dueDate===selected).map(t=>`<div class="selected-task-row"><div class="focus-task-copy"><strong>${safe(t.title)}</strong><small>${safe(t.subject)} · ${status(t)}</small></div><button class="mini-action" data-edit="${t.id}">✎</button></div>`).join('')||'<p class="empty-state">No tasks for this date.</p>';
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button'); if(!b)return;
 if(b.dataset.viewLink){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===b.dataset.viewLink+'View'));document.querySelectorAll('[data-view-link]').forEach(n=>n.classList.toggle('active',n===b));$('pageBreadcrumb').textContent=b.dataset.viewLink;render();}
 if(b.dataset.done){tasks=tasks.map(t=>t.id===b.dataset.done?{...t,completed:!t.completed}:t);save();render();}
 if(b.dataset.edit)openForm(tasks.find(t=>t.id===b.dataset.edit));
 if(b.dataset.delete){deleting=b.dataset.delete;$('confirmDialog').showModal();}
 if(b.dataset.date){selected=b.dataset.date;renderCalendar();}
 if(['topAddTask','dashboardAddTask','tasksAddTask','calendarAddTask','addSelectedDateTask'].includes(b.id))openForm();
 if(b.id==='themeToggle'){let dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';localStorage.theme=dark?'dark':'light';$('themeLabel').textContent=dark?'Light appearance':'Dark appearance';}
 if(b.id==='prevMonth'||b.id==='nextMonth'){month.setMonth(month.getMonth()+(b.id==='nextMonth'?1:-1));renderCalendar();}
 if(b.id==='todayMonth'){month=new Date();selected=today();renderCalendar();}
 if(b.id==='confirmDelete'){tasks=tasks.filter(t=>t.id!==deleting);save();$('confirmDialog').close();render();toast('Task deleted');}
 if(b.id==='cancelDelete')$('confirmDialog').close();
 if(b.id==='closeTaskDialog'||b.id==='cancelTaskDialog')$('taskDialog').close();
 if(b.id==='clearFilters'){$('searchInput').value='';$('statusFilter').value=$('priorityFilter').value='all';$('sortSelect').value='due-asc';renderTasks();}
});
$('taskForm').addEventListener('submit',e=>{e.preventDefault();let t={id:editing||crypto.randomUUID(),title:$('taskTitle').value.trim(),subject:$('taskSubject').value.trim(),priority:$('taskPriority').value,dueDate:$('taskDueDate').value,description:$('taskDescription').value.trim(),completed:false};if(!t.title||!t.subject||!t.dueDate){toast('Please complete the required fields');return;}if(editing){let old=tasks.find(x=>x.id===editing);t.completed=old.completed;tasks=tasks.map(x=>x.id===editing?t:x);}else tasks.push(t);save();$('taskDialog').close();render();toast(editing?'Task updated':'Task added');});
['searchInput','statusFilter','priorityFilter','sortSelect'].forEach(id=>$(id).addEventListener('input',renderTasks));
$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open')); $('mobileScrim').addEventListener('click',()=>$('sidebar').classList.remove('open'));
document.documentElement.dataset.theme=localStorage.theme||'light'; $('themeLabel').textContent=localStorage.theme==='dark'?'Light appearance':'Dark appearance';
$('topDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}); $('footerYear').textContent=new Date().getFullYear(); render();
