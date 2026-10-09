// The archive does not contain Elementor's dynamically loaded widget bundles.
// Static exported content needs only reveal behavior and the services FAQ here.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.elementor-invisible').forEach(el => el.classList.remove('elementor-invisible'));
  document.querySelectorAll('.e-con.e-parent').forEach(el => el.classList.add('e-lazyloaded'));
  document.querySelectorAll('.elementor-accordion').forEach(group => {
    const titles = [...group.querySelectorAll('.elementor-tab-title')];
    const update = (title, open) => {
      const panel = document.getElementById(title.getAttribute('aria-controls'));
      if (!panel) return;
      title.setAttribute('aria-expanded', String(open));
      title.classList.toggle('elementor-active', open);
      panel.classList.toggle('elementor-active', open);
      panel.hidden = !open;
      panel.style.display = open ? 'block' : 'none';
    };
    titles.forEach((title, index) => {
      title.tabIndex = 0;
      title.querySelectorAll('a').forEach(a => a.tabIndex = -1);
      update(title, index === 0);
      const toggle = () => {
        const open = title.getAttribute('aria-expanded') !== 'true';
        titles.forEach(other => update(other, other === title && open));
      };
      title.addEventListener('click', toggle);
      title.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
      });
    });
  });
  const toggle = document.getElementById('menu-toggle');
  if (toggle) {
    const sync = () => {
      const open = document.body.classList.contains('active');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('keydown', event => {
      if(event.key === 'Escape' && document.body.classList.contains('active')) {
        document.body.classList.remove('active');
        document.querySelectorAll('.pbmit-navbar > div').forEach(el => el.classList.remove('active'));
        toggle.focus();
      }
    });
    sync();
  }
});
