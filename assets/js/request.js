// Placement inquiry form.
// Submissions go through Web3Forms (https://web3forms.com). Paste the access key
// for the Treasure Drop inbox below. While it is empty the form runs in PREVIEW
// mode: it validates and shows the thank-you message but does not send anything.
var WEB3FORMS_KEY = '';

(function () {
  var form = document.getElementById('inquiry'), err = document.getElementById('form-err'), thanks = document.getElementById('thanks');
  if (!form) return;

  // preselect the machine when arriving from a "Request the Compact" style link
  var want = new URLSearchParams(location.hash.slice(1)).get('machine');
  var map = { compact: 'Compact', standard: 'Standard', xl: 'XL / Premium' };
  if (map[want]) form.querySelector('input[name="machine"][value="' + map[want] + '"]').checked = true;

  function fail(msg) { err.textContent = msg; err.hidden = false; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var bad = Array.prototype.find.call(form.elements, function (el) { return el.willValidate && !el.checkValidity(); });
    if (bad) {
      var name = form.querySelector('label[for="' + bad.id + '"]').textContent;
      fail(bad.validity.typeMismatch ? 'Enter a valid ' + name.toLowerCase() + '.' : name + ' is required.');
      bad.focus();
      return;
    }
    var done = function () { form.hidden = true; thanks.hidden = false; thanks.focus(); };
    if (!WEB3FORMS_KEY) { console.warn('Treasure Drop form is in preview mode: no WEB3FORMS_KEY set, nothing was sent.'); done(); return; }
    var btn = form.querySelector('button[type="submit"]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    var data = new FormData(form);
    data.append('access_key', WEB3FORMS_KEY);
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.success) throw new Error(j.message); done(); })
      .catch(function () {
        btn.disabled = false; btn.textContent = label;
        fail('Your request did not send. Check your connection and try again.');
      });
  });
})();
