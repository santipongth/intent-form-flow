import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const agentId = url.searchParams.get("agent_id");
  const theme = url.searchParams.get("theme") || "light";
  const mode = url.searchParams.get("mode") || "bubble";

  if (!agentId) {
    return new Response("Missing agent_id", { status: 400, headers: corsHeaders });
  }

  // Fetch agent info
  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: agent } = await supabase
    .from("agents")
    .select("name, avatar, objective")
    .eq("id", agentId)
    .single();

  const agentName = agent?.name || "AI Assistant";
  const agentAvatar = agent?.avatar || "🤖";
  const chatUrl = `${SUPABASE_URL}/functions/v1/chat`;

  // If mode=bubble and not fullpage, return a script that injects an iframe
  if (mode === "bubble") {
    const scriptJs = `
(function(){
  if(document.getElementById('tm-widget-frame'))return;
  var f=document.createElement('iframe');
  f.id='tm-widget-frame';
  f.src='${SUPABASE_URL}/functions/v1/widget?agent_id=${agentId}&theme=${theme}&mode=fullpage';
  f.style.cssText='position:fixed;bottom:0;right:0;width:420px;height:700px;border:none;z-index:999999;background:transparent;';
  f.allow='microphone';
  document.body.appendChild(f);
})();
`;
    return new Response(scriptJs, {
      headers: { ...corsHeaders, "Content-Type": "application/javascript; charset=utf-8" },
    });
  }

  // Fullpage mode: return complete chat widget HTML
  const isDark = theme === "dark";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${agentName} Chat</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:${isDark ? "#18181b" : "#ffffff"};
  --bg2:${isDark ? "#27272a" : "#f4f4f5"};
  --bg3:${isDark ? "#3f3f46" : "#e4e4e7"};
  --fg:${isDark ? "#fafafa" : "#18181b"};
  --fg2:${isDark ? "#a1a1aa" : "#71717a"};
  --primary:#6366f1;
  --primary-fg:#fff;
  --border:${isDark ? "#3f3f46" : "#e4e4e7"};
  --shadow:${isDark ? "0 -2px 20px rgba(0,0,0,0.4)" : "0 -2px 20px rgba(0,0,0,0.08)"};
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:transparent;color:var(--fg)}
#widget-root{position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
#bubble{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#8b5cf6);color:#fff;border:none;cursor:pointer;font-size:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,0.4);transition:transform .2s}
#bubble:hover{transform:scale(1.08)}
#chat-window{width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 100px);background:var(--bg);border-radius:16px;box-shadow:var(--shadow);border:1px solid var(--border);display:none;flex-direction:column;overflow:hidden;animation:slideUp .25s ease}
#chat-window.open{display:flex}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:var(--bg2)}
.header .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0}
.header .info{flex:1}
.header .name{font-weight:600;font-size:14px}
.header .status{font-size:11px;color:var(--fg2)}
.header .close{background:none;border:none;color:var(--fg2);cursor:pointer;font-size:20px;padding:4px;line-height:1}
.messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.msg{display:flex;gap:8px;align-items:flex-end;max-width:85%}
.msg.bot{align-self:flex-start}
.msg.user{align-self:flex-end;flex-direction:row-reverse}
.msg .bubble{padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.5;word-break:break-word}
.msg.bot .bubble{background:var(--bg2);border-bottom-left-radius:4px}
.msg.user .bubble{background:linear-gradient(135deg,var(--primary),#8b5cf6);color:var(--primary-fg);border-bottom-right-radius:4px}
.msg .icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.msg.bot .icon{background:var(--bg3)}
.msg.user .icon{background:var(--primary);color:#fff}
.typing{display:flex;gap:4px;padding:10px 14px;background:var(--bg2);border-radius:16px;border-bottom-left-radius:4px;align-self:flex-start;max-width:60px}
.typing span{width:6px;height:6px;border-radius:50%;background:var(--fg2);animation:blink 1.4s infinite both}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.3}40%{opacity:1}}
.input-area{padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;background:var(--bg)}
.input-area input{flex:1;padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg2);color:var(--fg);font-size:13px;outline:none}
.input-area input::placeholder{color:var(--fg2)}
.input-area input:focus{border-color:var(--primary)}
.input-area button{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--primary),#8b5cf6);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity .2s}
.input-area button:disabled{opacity:.4;cursor:not-allowed}
.input-area button svg{width:18px;height:18px}
.powered{text-align:center;padding:6px;font-size:10px;color:var(--fg2)}
</style>
</head>
<body>
<div id="widget-root">
  <div id="chat-window">
    <div class="header">
      <div class="avatar">${agentAvatar}</div>
      <div class="info">
        <div class="name">${agentName}</div>
        <div class="status">● Online</div>
      </div>
      <button class="close" onclick="toggleChat()" aria-label="Close">&times;</button>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <input id="user-input" placeholder="พิมพ์ข้อความ..." autocomplete="off" />
      <button id="send-btn" onclick="sendMessage()" aria-label="Send">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
      </button>
    </div>
    <div class="powered">Powered by ThoughtMind</div>
  </div>
  <button id="bubble" onclick="toggleChat()" aria-label="Open chat">${agentAvatar}</button>
</div>

<script>
const CHAT_URL="${chatUrl}";
const AGENT_ID="${agentId}";
const ANON_KEY="${SUPABASE_ANON_KEY}";
let messages=[];
let isOpen=false;
let isSending=false;

function toggleChat(){
  isOpen=!isOpen;
  document.getElementById('chat-window').classList.toggle('open',isOpen);
  document.getElementById('bubble').style.display=isOpen?'none':'flex';
  if(isOpen&&messages.length===0){
    addBotMessage("สวัสดีค่ะ! 👋 มีอะไรให้ช่วยไหมคะ?");
  }
  if(isOpen)document.getElementById('user-input').focus();
}

function addBotMessage(text){
  messages.push({role:'assistant',content:text});
  renderMessages();
}

function renderMessages(){
  const el=document.getElementById('messages');
  el.innerHTML=messages.map(m=>{
    const cls=m.role==='user'?'user':'bot';
    const icon=m.role==='user'?'👤':'${agentAvatar}';
    return '<div class="msg '+cls+'"><span class="icon">'+icon+'</span><div class="bubble">'+escapeHtml(m.content)+'</div></div>';
  }).join('');
  el.scrollTop=el.scrollHeight;
}

function escapeHtml(t){
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showTyping(){
  const el=document.getElementById('messages');
  el.innerHTML+='<div class="typing" id="typing-indicator"><span></span><span></span><span></span></div>';
  el.scrollTop=el.scrollHeight;
}

function hideTyping(){
  const t=document.getElementById('typing-indicator');
  if(t)t.remove();
}

async function sendMessage(){
  if(isSending)return;
  const input=document.getElementById('user-input');
  const text=input.value.trim();
  if(!text)return;
  
  input.value='';
  messages.push({role:'user',content:text});
  renderMessages();
  
  isSending=true;
  document.getElementById('send-btn').disabled=true;
  showTyping();
  
  try{
    const apiMessages=messages.map(m=>({role:m.role,content:m.content}));
    const resp=await fetch(CHAT_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+ANON_KEY},
      body:JSON.stringify({messages:apiMessages,agent_id:AGENT_ID})
    });
    
    hideTyping();
    
    if(!resp.ok){
      const err=await resp.json().catch(()=>({error:'Error'}));
      addBotMessage('⚠️ '+(err.error||'เกิดข้อผิดพลาด'));
      return;
    }
    
    // Stream response
    const reader=resp.body.getReader();
    const decoder=new TextDecoder();
    let buffer='';
    let assistantMsg='';
    messages.push({role:'assistant',content:''});
    
    while(true){
      const{done,value}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      
      let idx;
      while((idx=buffer.indexOf('\\n'))!==-1){
        let line=buffer.slice(0,idx);
        buffer=buffer.slice(idx+1);
        if(line.endsWith('\\r'))line=line.slice(0,-1);
        if(!line.startsWith('data: '))continue;
        const json=line.slice(6).trim();
        if(json==='[DONE]')break;
        try{
          const parsed=JSON.parse(json);
          const content=parsed.choices&&parsed.choices[0]&&parsed.choices[0].delta&&parsed.choices[0].delta.content;
          if(content){
            assistantMsg+=content;
            messages[messages.length-1].content=assistantMsg;
            renderMessages();
          }
        }catch(e){}
      }
    }
    
    if(!assistantMsg){
      messages.pop();
      addBotMessage('ไม่ได้รับคำตอบ กรุณาลองใหม่อีกครั้ง');
    }
  }catch(e){
    hideTyping();
    addBotMessage('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }finally{
    isSending=false;
    document.getElementById('send-btn').disabled=false;
  }
}

document.getElementById('user-input').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}
});

// Auto-open if fullpage mode in iframe
if(window.self!==window.top||new URLSearchParams(location.search).get('auto_open')==='true'){
  toggleChat();
}
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});
