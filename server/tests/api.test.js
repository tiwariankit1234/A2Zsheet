// Integration tests for the REST API. Requires a reachable MongoDB-compatible server.
// Run: TEST_MONGODB_URI=mongodb://127.0.0.1:27017/a2z_sheet_test npm test
process.env.NODE_ENV = 'test';

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';

const { connectDB } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');
const { seedDatabase, loadSheet } = await import('../src/services/dataService.js');

const uri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/a2z_sheet_test';
const app = createApp();
let sheet;

before(async () => {
  await connectDB(uri);
  await mongoose.connection.dropDatabase();
  for (const m of Object.values(mongoose.models)) await m.syncIndexes();
  await seedDatabase();
  sheet = await loadSheet();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('public sheet endpoints', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.problems, sheet.problems.length);
  });

  test('GET /api/topics returns every step in order with correct counts', async () => {
    const res = await request(app).get('/api/topics').expect(200);
    assert.equal(res.body.items.length, sheet.topics.length);
    assert.deepEqual(res.body.items.map((t) => t.step), sheet.topics.map((t) => t.step));
    assert.equal(res.body.totalProblems, sheet.problems.length);
  });

  test('GET /api/problems paginates in sheet order', async () => {
    const res = await request(app).get('/api/problems?limit=10&page=2').expect(200);
    assert.equal(res.body.items.length, 10);
    assert.equal(res.body.items[0].order, 11);
    assert.equal(res.body.pagination.total, sheet.problems.length);
    assert.equal(res.body.pagination.totalPages, Math.ceil(sheet.problems.length / 10));
  });

  test('GET /api/problems?limit=500 returns the full sheet', async () => {
    const res = await request(app).get('/api/problems?limit=500').expect(200);
    assert.equal(res.body.items.length, sheet.problems.length);
    const ids = res.body.items.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('filters: difficulty, platform, step, topic', async () => {
    const pro = await request(app).get('/api/problems?difficulty=Pro&limit=500').expect(200);
    assert.ok(pro.body.items.length > 0);
    assert.ok(pro.body.items.every((p) => p.difficulty === 'Pro'));

    const both = await request(app).get('/api/problems?platform=both&limit=500').expect(200);
    assert.ok(both.body.items.every((p) => p.leetcode && p.gfg));
    assert.equal(both.body.items.length, sheet.problems.filter((p) => p.leetcode && p.gfg).length);

    const none = await request(app).get('/api/problems?platform=none&limit=500').expect(200);
    assert.ok(none.body.items.every((p) => !p.leetcode && !p.gfg));

    const step = await request(app).get('/api/problems?step=16&limit=500').expect(200);
    assert.ok(step.body.items.every((p) => p.step === 16));
    const topic = await request(app).get(`/api/problems?topic=${encodeURIComponent('Graphs')}&limit=500`).expect(200);
    assert.equal(topic.body.items.length, step.body.items.length);
  });

  test('sorting by difficulty is ordinal and by title is alphabetical', async () => {
    const res = await request(app).get('/api/problems?sort=difficulty&limit=500').expect(200);
    const rank = { Basic: 1, Core: 2, Pro: 3 };
    const r = res.body.items.map((p) => rank[p.difficulty] || 9);
    assert.deepEqual(r, [...r].sort((a, b) => a - b));
    const t = await request(app).get('/api/problems?sort=title&order=desc&limit=5').expect(200);
    assert.ok(t.body.items[0].title.localeCompare(t.body.items[4].title, 'en', { sensitivity: 'base' }) >= 0);
  });

  test('search by name (case-insensitive, regex-safe)', async () => {
    const res = await request(app).get('/api/problems/search?q=two%20sum').expect(200);
    assert.ok(res.body.items.some((p) => p.title === 'Two Sum'));
    assert.ok(res.body.items.every((p) => /two sum/i.test(p.title)));
    const weird = await request(app).get('/api/problems/search?q=' + encodeURIComponent('(.*')).expect(200);
    assert.equal(weird.body.items.length, 0);
    await request(app).get('/api/problems/search').expect(400);
  });

  test('GET /api/problems/:id', async () => {
    const res = await request(app).get('/api/problems/a2z-37').expect(200);
    assert.equal(res.body.title, 'Two Sum');
    assert.equal(res.body.leetcode.url, 'https://leetcode.com/problems/two-sum/');
    await request(app).get('/api/problems/a2z-999999').expect(404);
    await request(app).get('/api/problems/not-an-id').expect(400);
  });

  test('validation errors return 400 with a message', async () => {
    const res = await request(app).get('/api/problems?difficulty=Insane').expect(400);
    assert.match(res.body.error.message, /difficulty/);
    await request(app).get('/api/problems?limit=0').expect(400);
    await request(app).get('/api/problems?status=solved').expect(401);
  });

  test('unknown route -> 404 JSON', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    assert.ok(res.body.error.message);
  });

  test('GET /api/meta exposes unverified list', async () => {
    const res = await request(app).get('/api/meta').expect(200);
    assert.equal(res.body.totals.problems, sheet.problems.length);
    assert.ok(Array.isArray(res.body.unverified));
  });
});

describe('progress, bookmarks and accounts', () => {
  let guestToken;

  test('protected routes need a token', async () => {
    await request(app).get('/api/progress').expect(401);
    await request(app).put('/api/progress/a2z-37').send({ solved: true }).expect(401);
    await request(app).get('/api/progress').set(auth('garbage')).expect(401);
  });

  test('guest session can track progress', async () => {
    const g = await request(app).post('/api/auth/guest').expect(201);
    guestToken = g.body.token;
    assert.equal(g.body.user.isGuest, true);

    const put = await request(app).put('/api/progress/a2z-37').set(auth(guestToken)).send({ solved: true }).expect(200);
    assert.equal(put.body.solved, true);
    assert.ok(put.body.solvedAt);
    await request(app).put('/api/progress/a2z-27').set(auth(guestToken)).send({ solved: true, notes: 'two pointers after sort' }).expect(200);

    const prog = await request(app).get('/api/progress').set(auth(guestToken)).expect(200);
    assert.equal(prog.body.summary.solved, 2);
    assert.equal(prog.body.summary.remaining, sheet.problems.length - 2);
    const arrays = prog.body.summary.byTopic.find((t) => t.name === 'Arrays');
    assert.equal(arrays.solved, 2);
    assert.equal(prog.body.items.find((i) => i.problemId === 'a2z-27').notes, 'two pointers after sort');
  });

  test('unsolving works and status filters use it', async () => {
    await request(app).put('/api/progress/a2z-37').set(auth(guestToken)).send({ solved: false }).expect(200);
    const solved = await request(app).get('/api/problems?status=solved&limit=500').set(auth(guestToken)).expect(200);
    assert.deepEqual(solved.body.items.map((p) => p.id), ['a2z-27']);
    const unsolved = await request(app).get('/api/problems?status=unsolved&limit=500').set(auth(guestToken)).expect(200);
    assert.equal(unsolved.body.items.length, sheet.problems.length - 1);
  });

  test('progress validation', async () => {
    await request(app).put('/api/progress/a2z-37').set(auth(guestToken)).send({}).expect(400);
    await request(app).put('/api/progress/a2z-37').set(auth(guestToken)).send({ solved: 'yes' }).expect(400);
    await request(app).put('/api/progress/a2z-37').set(auth(guestToken)).send({ notes: 'x'.repeat(2001) }).expect(400);
    await request(app).put('/api/progress/a2z-999999').set(auth(guestToken)).send({ solved: true }).expect(404);
    await request(app)
      .put('/api/progress/a2z-37')
      .set(auth(guestToken))
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400);
  });

  test('bookmarks', async () => {
    await request(app).put('/api/bookmarks/a2z-961').set(auth(guestToken)).send({ bookmarked: true }).expect(200);
    await request(app).put('/api/bookmarks/a2z-37').set(auth(guestToken)).send({ bookmarked: true }).expect(200);
    let list = await request(app).get('/api/bookmarks').set(auth(guestToken)).expect(200);
    assert.equal(list.body.total, 2);
    assert.ok(list.body.items.every((p) => p.userState.bookmarked));
    await request(app).put('/api/bookmarks/a2z-37').set(auth(guestToken)).send({ bookmarked: false }).expect(200);
    list = await request(app).get('/api/bookmarks').set(auth(guestToken)).expect(200);
    assert.deepEqual(list.body.items.map((p) => p.id), ['a2z-961']);
    await request(app).put('/api/bookmarks/a2z-37').set(auth(guestToken)).send({}).expect(400);
  });

  test('registering from a guest keeps progress; login works; duplicates rejected', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .set(auth(guestToken))
      .send({ email: 'Ankit@Example.com', password: 'supersecret1', name: 'Ankit' })
      .expect(201);
    assert.equal(reg.body.user.isGuest, false);
    assert.equal(reg.body.user.email, 'ankit@example.com');
    const prog = await request(app).get('/api/progress').set(auth(reg.body.token)).expect(200);
    assert.equal(prog.body.summary.solved, 1);

    await request(app).post('/api/auth/register').send({ email: 'ankit@example.com', password: 'supersecret1' }).expect(409);
    await request(app).post('/api/auth/register').send({ email: 'bad', password: 'supersecret1' }).expect(400);
    await request(app).post('/api/auth/register').send({ email: 'x@y.com', password: 'short' }).expect(400);
    await request(app).post('/api/auth/login').send({ email: 'ankit@example.com', password: 'wrongpass1' }).expect(401);

    const login = await request(app).post('/api/auth/login').send({ email: 'ankit@example.com', password: 'supersecret1' }).expect(200);
    const me = await request(app).get('/api/auth/me').set(auth(login.body.token)).expect(200);
    assert.equal(me.body.user.name, 'Ankit');
  });

  test('logging in from a different guest merges that guest progress', async () => {
    const g = await request(app).post('/api/auth/guest').expect(201);
    await request(app).put('/api/progress/a2z-401').set(auth(g.body.token)).send({ solved: true }).expect(200);
    const login = await request(app)
      .post('/api/auth/login')
      .set(auth(g.body.token))
      .send({ email: 'ankit@example.com', password: 'supersecret1' })
      .expect(200);
    const prog = await request(app).get('/api/progress').set(auth(login.body.token)).expect(200);
    assert.equal(prog.body.summary.solved, 2);
    // the guest account is removed after merging
    await request(app).get('/api/auth/me').set(auth(g.body.token)).expect(401);
  });

  test('re-seeding does not touch user progress', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'ankit@example.com', password: 'supersecret1' });
    await seedDatabase();
    const prog = await request(app).get('/api/progress').set(auth(login.body.token)).expect(200);
    assert.equal(prog.body.summary.solved, 2);
  });
});
