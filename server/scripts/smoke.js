// Vaultic end-to-end smoke test — exercises every backend function.
// Run: npm run smoke   (backend on :5000, mongo up, seeded)
const BASE = 'http://127.0.0.1:5000/api';
const SFX = Date.now().toString(36);
let pass = 0, fail = 0;
const fails = [];

async function req(method, path, token, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let b;
  if (body instanceof FormData) b = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; b = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: b });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  try { data = ct.includes('json') ? await res.json() : await res.text(); } catch { /* ignore */ }
  return { status: res.status, data, headers: res.headers };
}

function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; fails.push(name); console.log(`  FAIL ${name} ${extra}`); }
}

const login = async (email, pw = 'password123') => req('POST', '/auth/login', null, { email, password: pw });

(async () => {
  console.log('== health ==');
  let r = await req('GET', '/health', null);
  check('GET /api/health', r.status === 200);

  console.log('== auth ==');
  const A = (await login('admin@vaultic.local')).data?.data;
  const M = (await login('manager@vaultic.local')).data?.data;
  const E = (await login('employee@vaultic.local')).data?.data;
  check('admin login', !!A?.token && A.user.role === 'admin');
  check('manager login', !!M?.token && M.user.role === 'manager');
  check('employee login', !!E?.token && E.user.role === 'employee');
  const tA = A.token, tM = M.token, tE = E.token;

  r = await req('GET', '/auth/me', tE);
  check('GET /auth/me', r.status === 200 && r.data?.data?.email === 'employee@vaultic.local');
  r = await login('admin@vaultic.local', 'wrongpw');
  check('wrong password -> 401', r.status === 401);
  r = await req('GET', '/documents', null);
  check('no token -> 401', r.status === 401);
  const newEmail = `qa-${SFX}@vaultic.local`;
  r = await req('POST', '/auth/signup', null, { name: 'QA Bot', email: newEmail, password: 'password123', team: 'qa' });
  check('signup employee', r.status === 201 && !!r.data?.data?.token);
  r = await req('POST', '/auth/signup', null, { name: 'QA Bot', email: newEmail, password: 'password123' });
  check('duplicate signup -> 409', r.status === 409);

  console.log('== RBAC gates ==');
  r = await req('GET', '/users', tE);
  check('employee GET /users -> 403', r.status === 403);
  r = await req('POST', '/documents/000000000000000000000000/approve', tE);
  check('employee approve -> 403', r.status === 403);
  r = await req('GET', '/analytics/overview', tM);
  check('manager analytics -> 403', r.status === 403);
  r = await req('POST', '/faqs', tE, { question: 'hijack?', answer: 'no' });
  check('employee FAQ create -> 403', r.status === 403);

  console.log('== document lifecycle ==');
  const content = `Vaultic QA ${SFX}: the quarterly disaster recovery drill restores snapshots and backups retained for thirty days.`;
  const fd = new FormData();
  fd.append('title', `QA Backup Policy ${SFX}`);
  fd.append('description', 'disaster recovery retention');
  fd.append('category', 'SOP');
  fd.append('team', 'engineering');
  fd.append('visibility', 'public');
  fd.append('tags', 'qa, backup');
  fd.append('file', new Blob([content], { type: 'text/plain' }), 'policy.txt');
  r = await req('POST', '/documents', tM, fd);
  check('manager upload -> 201 pending', r.status === 201 && r.data?.data?.status === 'pending');
  const docId = r.data?.data?._id;

  r = await req('GET', '/documents?status=pending', tA);
  check('admin sees pending', r.status === 200 && (r.data?.data || []).some((d) => String(d._id) === String(docId)));
  r = await req('GET', '/documents', tE);
  check('employee cannot see pending', r.status === 200 && !(r.data?.data || []).some((d) => String(d._id) === String(docId)));

  r = await req('POST', `/documents/${docId}/approve`, tA);
  check('admin approve', r.status === 200 && r.data?.data?.status === 'approved');
  r = await req('GET', '/documents', tE);
  check('employee sees approved public doc', (r.data?.data || []).some((d) => String(d._id) === String(docId)));
  r = await req('GET', `/documents/${docId}`, tE);
  check('employee get by id', r.status === 200 && r.data?.data?.title.includes(SFX));

  console.log('== gated file download ==');
  r = await req('GET', `/documents/${docId}/file`, tE);
  check('employee downloads approved file', r.status === 200 && String(r.data).includes('thirty days'));
  r = await req('GET', `/documents/${docId}/file`, null);
  check('anon download -> 401', r.status === 401);

  console.log('== semantic search ==');
  r = await req('GET', `/search?q=${encodeURIComponent('how long are backups kept')}`, tE);
  const hits = r.data?.data || [];
  check('search returns results', r.status === 200 && hits.length > 0, JSON.stringify(hits.length));
  check('search finds QA doc (meaning match)', hits.some((h) => String(h.document?._id) === String(docId)));
  check('search returns score+snippet', hits[0] && typeof hits[0].score === 'number' && Array.isArray(hits[0].snippets));

  console.log('== faqs in search ==');  r = await req('POST', '/faqs', tM, { question: `How do I reset the ${SFX} widget?`, answer: 'Open settings and press reset.', visibility: 'public' });
  check('manager faq create', r.status === 201);
  const faqId = r.data?.data?._id;
  r = await req('GET', `/search?q=${encodeURIComponent(`reset the ${SFX} widget how`)}`, tE);
  check('search surfaces FAQ', (r.data?.data || []).some((h) => h.type === 'faq'));

  console.log('== private docs + share ==');
  const fd2 = new FormData();
  fd2.append('title', `QA Private ${SFX}`);
  fd2.append('category', 'Project');
  fd2.append('team', 'engineering');
  fd2.append('visibility', 'private');
  fd2.append('file', new Blob(['private content ' + SFX], { type: 'text/plain' }), 'p.txt');
  r = await req('POST', '/documents', tM, fd2);
  const privId = r.data?.data?._id;
  check('manager private upload', r.status === 201);
  await req('POST', `/documents/${privId}/approve`, tA);
  r = await req('GET', `/documents/${privId}`, tE);
  check('employee blocked from private -> 403', r.status === 403);
  r = await req('GET', `/documents/${privId}/file`, tE);
  check('employee blocked from private file -> 403', r.status === 403);
  r = await req('POST', `/documents/${privId}/share`, tM, { userIds: [E.user.id] });
  check('manager shares with employee', r.status === 200);
  r = await req('GET', `/documents/${privId}`, tE);
  check('employee sees shared private doc', r.status === 200);
  r = await req('GET', `/documents/${privId}/file`, tE);
  check('employee downloads shared private file', r.status === 200 && String(r.data).includes(SFX));

  console.log('== update + bookmarks ==');
  r = await req('PATCH', `/documents/${docId}`, tM, { description: 'updated by owner ' + SFX });
  check('owner update', r.status === 200 && r.data?.data?.description.includes(SFX));
  r = await req('PATCH', `/documents/${docId}`, tE, { description: 'hijack' });
  check('non-owner update -> 403', r.status === 403);
  r = await req('POST', '/bookmarks', tE, { documentId: docId });
  check('bookmark add', r.status === 201 || r.status === 200);
  r = await req('GET', '/bookmarks', tE);
  check('bookmark list', (r.data?.data || []).some((b) => String(b.documentId?._id || b.documentId) === String(docId)));
  r = await req('DELETE', `/bookmarks/${docId}`, tE);
  check('bookmark remove', r.status === 200);

  console.log('== faqs ==');
  r = await req('GET', '/faqs', tE);
  check('faq list (employee)', (r.data?.data || []).some((f) => String(f._id) === String(faqId)));
  r = await req('PATCH', `/faqs/${faqId}`, tM, { answer: 'Updated answer.' });
  check('faq manager update', r.status === 200);

  console.log('== users + analytics (admin) ==');
  r = await req('GET', '/users', tA);
  check('admin user list', r.status === 200 && (r.data?.data || []).length >= 3);
  const empUser = (r.data?.data || []).find((u) => u.email === 'employee@vaultic.local');
  r = await req('PATCH', `/users/${empUser._id}/role`, tA, { role: 'employee' });
  check('admin set role', r.status === 200);
  r = await req('PATCH', `/users/${empUser._id}/status`, tA, { isActive: true });
  check('admin set status', r.status === 200);
  r = await req('GET', '/analytics/overview', tA);
  check('analytics overview', r.status === 200 && typeof r.data?.data?.documents === 'number');
  r = await req('GET', '/analytics/searches', tA);
  check('search was logged', (r.data?.data || []).some((s) => (s.query || '').includes('backups')));

  console.log('== ask + recent ==');
  r = await req('POST', '/search/ask', tE, { q: 'how long are backups kept' });
  check('ask returns citations', r.status === 200 && (r.data?.data?.citations || []).length > 0);
  r = await req('GET', '/search/recent', tE);
  check('recent searches', r.status === 200 && (r.data?.data || []).some((x) => (x.query || '').includes('backups')));

  console.log('== review scheduling ==');
  r = await req('GET', '/documents?stale=true', tA);
  check('stale list (admin)', r.status === 200 && Array.isArray(r.data?.data));
  r = await req('POST', `/documents/${docId}/review`, tM);
  check('owner mark reviewed', r.status === 200 && !!r.data?.data?.nextReviewAt);
  r = await req('POST', `/documents/${docId}/review`, tE);
  check('non-owner review -> 403', r.status === 403);

  console.log('== audit csv + rate limits ==');
  r = await req('GET', '/analytics/activity?action=search&limit=5&format=csv', tA);
  check('audit csv export', r.status === 200 && String(r.data).split('\n')[0] === 'action,user,query,documentId,at');
  r = await req('POST', '/auth/login', null, { email: 'admin@vaultic.local', password: 'password123' });
  check('rate-limit headers present', r.headers.get('x-ratelimit-limit') === '60');

  console.log('== soft delete ==');
  r = await req('DELETE', `/documents/${privId}`, tM);
  check('owner soft delete', r.status === 200);
  r = await req('GET', `/documents/${privId}`, tA);
  check('deleted doc -> 404', r.status === 404);
  r = await req('GET', `/documents/${privId}/file`, tA);
  check('deleted file -> 404', r.status === 404);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  if (fails.length) { console.log('FAILED:', fails.join(' | ')); process.exit(1); }
})().catch((e) => { console.error('SMOKE CRASH:', e.message); process.exit(1); });
