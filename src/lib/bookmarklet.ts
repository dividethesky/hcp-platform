// Generates the bookmarklet code that the customer drags to their bookmarks bar.
// This bookmarklet captures the HCP session and sends it to the backend.

export function generateBookmarklet(apiUrl: string, userToken: string): string {
  // The bookmarklet code as a readable function
  const code = `
javascript:void(function(){
  if(!window.location.hostname.includes('housecallpro.com')){
    alert('Please run this from your HouseCallPro account!\\nGo to pro.housecallpro.com first.');
    return;
  }

  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(8,8,18,0.92);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;backdrop-filter:blur(4px)';
  var box=document.createElement('div');
  box.style.cssText='background:linear-gradient(145deg,#111827,#0f172a);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:44px;max-width:420px;width:90%;color:#d1d5db;box-shadow:0 30px 80px rgba(0,0,0,0.6);text-align:center';
  box.innerHTML='<div style="font-size:24px;margin-bottom:12px">\\u23f3</div><div style="font-size:16px;font-weight:600;color:#f9fafb;margin-bottom:8px">Capturing session...</div><div style="font-size:13px;color:#6b7280">Sending to your export dashboard</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  var csrf='';
  var m=document.querySelector('meta[name="csrf-token"]');
  if(m)csrf=m.getAttribute('content')||'';

  fetch('${apiUrl}/api/webhooks/session',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      token:'${userToken}',
      sessionCookie:document.cookie,
      csrfToken:csrf
    })
  })
  .then(function(r){return r.json()})
  .then(function(d){
    if(d.success){
      box.innerHTML='<div style="font-size:24px;margin-bottom:12px">\\u2705</div><div style="font-size:16px;font-weight:600;color:#34d399;margin-bottom:8px">Session captured!</div><div style="font-size:13px;color:#9ca3af;margin-bottom:20px">Your export is being processed.</div><a href="'+d.dashboard+'" target="_blank" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Go to Dashboard</a><div style="margin-top:12px"><button onclick="this.closest(\\'div\\').closest(\\'div\\').closest(\\'div\\').remove()" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:12px">Close</button></div>';
    }else{
      box.innerHTML='<div style="font-size:24px;margin-bottom:12px">\\u274c</div><div style="font-size:16px;font-weight:600;color:#ef4444;margin-bottom:8px">Error</div><div style="font-size:13px;color:#9ca3af;margin-bottom:20px">'+(d.error||'Something went wrong')+'</div><button onclick="this.closest(\\'div\\').closest(\\'div\\').remove()" style="padding:8px 20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#9ca3af;border-radius:8px;cursor:pointer;font-size:13px">Close</button>';
    }
  })
  .catch(function(e){
    box.innerHTML='<div style="font-size:24px;margin-bottom:12px">\\u274c</div><div style="font-size:16px;font-weight:600;color:#ef4444;margin-bottom:8px">Connection Error</div><div style="font-size:13px;color:#9ca3af;margin-bottom:20px">Could not reach the export server. Check your internet connection.</div><button onclick="this.closest(\\'div\\').closest(\\'div\\').remove()" style="padding:8px 20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#9ca3af;border-radius:8px;cursor:pointer;font-size:13px">Close</button>';
  });
})();
  `.trim();

  return code;
}
