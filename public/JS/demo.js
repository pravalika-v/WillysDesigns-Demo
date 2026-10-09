document.addEventListener('DOMContentLoaded', () => {
  const notice=document.createElement('div');
  notice.textContent='Demo website · Enquiries are saved for testing · Please use sample details';
  notice.setAttribute('role','note');
  notice.style.cssText='position:relative;z-index:1;padding:10px 18px;background:#29241e;color:#fff;text-align:center;font:13px/1.5 system-ui,sans-serif';
  document.body.prepend(notice);
});
