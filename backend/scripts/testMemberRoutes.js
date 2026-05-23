/**
 * Smoke tests for member route correctness.
 * Run with: node scripts/testMemberRoutes.js
 * Requires MongoDB and the API server on PORT (default 5001).
 */
const assert = require('assert');

const PORT = process.env.PORT || 5001;
const BASE = `http://127.0.0.1:${PORT}/api/members`;
const HEALTH = `http://127.0.0.1:${PORT}/health`;

async function request(method, path, body, base = BASE) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function countMembers() {
  const { data } = await request('GET', '/');
  return data.length;
}

function ids(data) {
  return data.map((m) => m._id);
}

async function main() {
  const health = await request('GET', '', null, HEALTH);
  assert.strictEqual(health.status, 200, 'health endpoint should return 200 when DB connected');
  assert.strictEqual(health.data.status, 'ok');

  const before = await countMembers();

  const badFormat = await request('POST', '/', {
    name: 'Should Not Persist',
    gender: 'Male',
    childId: 'not-a-valid-objectid',
  });
  assert.strictEqual(badFormat.status, 400, 'malformed childId should return 400');
  assert.match(badFormat.data.message, /Invalid childId/i);
  assert.strictEqual(await countMembers(), before, 'malformed childId must not create members');

  const missingChild = await request('POST', '/', {
    name: 'Should Not Persist',
    gender: 'Male',
    childId: '000000000000000000000001',
  });
  assert.strictEqual(missingChild.status, 404, 'non-existent childId should return 404');
  assert.strictEqual(await countMembers(), before, 'missing childId must not create orphan members');

  const created = await request('POST', '/', { name: 'Relation Wipe Test', gender: 'Male' });
  assert.strictEqual(created.status, 201);
  const id = created.data._id;

  const childRes = await request('POST', '/', { name: 'Child', parentId: id });
  assert.strictEqual(childRes.status, 201);
  const childId = childRes.data._id;

  const wipeAttempt = await request('PUT', `/${id}`, {
    parents: [],
    children: [],
    spouses: [],
    name: 'Relation Wipe Test',
  });
  assert.strictEqual(wipeAttempt.status, 200);

  const fetched = await request('GET', '/');
  const member = fetched.data.find((m) => m._id === id);
  assert.ok(member.children?.length > 0, 'PUT must not wipe graph relationships');

  await request('PUT', `/${id}`, {
    name: 'Relation Wipe Test',
    details: { phone: '555-0100', email: 'keep@example.com' },
  });
  const partial = (await request('GET', '/')).data.find((m) => m._id === id);
  assert.strictEqual(partial.details.phone, '555-0100');
  assert.strictEqual(partial.details.email, 'keep@example.com');

  await request('PUT', `/${id}`, {
    details: { phone: '555-0199' },
  });
  const merged = (await request('GET', '/')).data.find((m) => m._id === id);
  assert.strictEqual(merged.details.phone, '555-0199', 'partial details should update phone');
  assert.strictEqual(merged.details.email, 'keep@example.com', 'unspecified detail fields should be preserved');

  await request('PUT', '/positions/save', {
    nodes: [{ id, type: 'member', position: { x: 42, y: 99 } }],
  });
  const positioned = (await request('GET', '/')).data.find((m) => m._id === id);
  assert.strictEqual(positioned.position.x, 42);
  assert.strictEqual(positioned.position.y, 99);

  const parentA = await request('POST', '/', { name: 'Parent A', gender: 'Male' });
  const parentB = await request('POST', '/', { name: 'Parent B', gender: 'Female', spouseId: parentA.data._id });
  const focus = await request('POST', '/', { name: 'Tree Focus', parentId: parentA.data._id });
  const sibling = await request('POST', '/', { name: 'Sibling', parentId: parentA.data._id });
  const focusChild = await request('POST', '/', { name: 'Focus Child', parentId: focus.data._id });
  const grandchild = await request('POST', '/', { name: 'Grandchild', parentId: focusChild.data._id });

  const tree = await request('GET', `/tree/${focus.data._id}`);
  assert.strictEqual(tree.status, 200);
  const treeIds = new Set(ids(tree.data));
  assert.ok(treeIds.has(focusChild.data._id), 'tree should include child');
  assert.ok(treeIds.has(sibling.data._id), 'tree should include sibling');
  assert.ok(treeIds.has(grandchild.data._id), 'tree should include grandchild');
  assert.ok(treeIds.has(parentA.data._id), 'tree should include parent');
  assert.strictEqual(tree.data.length, treeIds.size, 'tree response should be deduplicated by _id');

  const badTree = await request('GET', '/tree/not-valid');
  assert.strictEqual(badTree.status, 400, 'invalid tree id should return 400');

  await request('DELETE', `/${grandchild.data._id}`);
  await request('DELETE', `/${focusChild.data._id}`);
  await request('DELETE', `/${sibling.data._id}`);
  await request('DELETE', `/${focus.data._id}`);
  await request('DELETE', `/${parentB.data._id}`);
  await request('DELETE', `/${parentA.data._id}`);
  await request('DELETE', `/${childId}`);
  await request('DELETE', `/${id}`);

  const orphans = (await request('GET', '/')).data.filter((m) => m.name === 'Should Not Persist');
  for (const o of orphans) {
    await request('DELETE', `/${o._id}`);
  }

  console.log('All member route smoke tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
