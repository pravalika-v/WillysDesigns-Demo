document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('.cf-status');
  const button = form.querySelector('.cf-submit');
  let requestId = crypto.randomUUID();
  let lastPayload = '';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const payload = JSON.stringify(values);
    if (lastPayload && lastPayload !== payload) requestId = crypto.randomUUID();
    lastPayload = payload;
    button.disabled = true;
    status.className = 'cf-status';
    status.textContent = 'Saving your enquiry…';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, requestId }),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || !result.id) throw new Error(result.error || 'Unable to save your enquiry. Please try again.');
      form.reset();
      requestId = crypto.randomUUID();
      lastPayload = '';
      status.className = 'cf-status ok';
      status.textContent = 'Your enquiry has been saved. Reference: ' + result.id.slice(0, 8) + '. Email notifications are not enabled in this demo.';
    } catch (error) {
      status.className = 'cf-status err';
      status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'We could not confirm receipt. Please retry; the same enquiry will not be saved twice.'
        : error.message;
    } finally { button.disabled = false; }
  });
});
