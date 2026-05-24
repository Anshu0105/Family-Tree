const Member = require('../models/Member');

function uniqueObjectIds(ids) {
  const seen = new Set();
  const result = [];
  for (const id of ids) {
    const key = String(id);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(id);
    }
  }
  return result;
}

/**
 * Collect member ids for the full family context of a focus member:
 *   - The focus member themselves and their spouses
 *   - ALL ancestors (parents, grandparents, … up to the root) with no depth limit,
 *     plus each ancestor's spouses and siblings at every generation level
 *   - All descendants downward up to `depth` generations, including their spouses
 *
 * @param {Object} focusMember  - Mongoose/lean document of the focus member
 * @param {number} depth        - Maximum downward generations (default 2)
 * @returns {Promise<Array>}    - Deduplicated array of ObjectId-like values
 */
async function collectTreeMemberIds(focusMember, depth = 2) {
  const focusId = String(focusMember._id);
  const ids = new Set([focusId]);

  // Always include the focus member's own spouses
  (focusMember.spouses || []).forEach((s) => ids.add(String(s)));

  // ── Upward BFS: ancestors, their spouses, and siblings at every level ──
  // Start from the focus member's direct parents and walk upward until there
  // are no more parents to follow. At each level we also pull in:
  //   • the ancestor's spouses
  //   • the ancestor's siblings (other children sharing the same parents)
  let ancestorFrontier = (focusMember.parents || []).map(String);

  while (ancestorFrontier.length > 0) {
    // Add this generation of ancestors to the collected set
    ancestorFrontier.forEach((id) => ids.add(id));

    // Fetch full docs for this ancestor generation
    const ancestorDocs = await Member.find({ _id: { $in: ancestorFrontier } })
      .select('parents spouses')
      .lean();

    // Collect every unique parent-of-ancestor id (next frontier up)
    const grandparentIds = [];
    for (const anc of ancestorDocs) {
      // Add the ancestor's spouses
      (anc.spouses || []).forEach((s) => ids.add(String(s)));

      // Collect their parents for the next BFS level
      (anc.parents || []).forEach((p) => grandparentIds.push(String(p)));
    }

    // Add siblings of this ancestor generation:
    // siblings = other children of any grandparent who share a parent with this ancestor
    const allGrandparentIds = [...new Set(grandparentIds)];
    if (allGrandparentIds.length > 0) {
      const siblings = await Member.find({
        parents: { $in: allGrandparentIds },
        _id: { $nin: ancestorFrontier },
      })
        .select('_id')
        .lean();
      siblings.forEach((s) => ids.add(String(s._id)));
    }

    // Next BFS level = grandparents not yet visited
    ancestorFrontier = allGrandparentIds.filter((id) => !ids.has(id));
    // Mark grandparents as seen before next iteration to avoid re-processing
    allGrandparentIds.forEach((id) => ids.add(id));
  }

  let frontier = (focusMember.children || []).map(String);
  for (let generation = 1; generation <= depth; generation += 1) {
    for (const id of frontier) {
      ids.add(id);
    }
    if (generation === depth || frontier.length === 0) {
      break;
    }

    const docs = await Member.find({ _id: { $in: frontier } })
      .select('children spouses')
      .lean();

    const nextFrontier = [];
    for (const doc of docs) {
      (doc.spouses || []).forEach((s) => ids.add(String(s)));
      (doc.children || []).forEach((c) => nextFrontier.push(String(c)));
    }
    frontier = [...new Set(nextFrontier)];
  }

  return uniqueObjectIds([...ids]);
}

module.exports = { collectTreeMemberIds, uniqueObjectIds };
