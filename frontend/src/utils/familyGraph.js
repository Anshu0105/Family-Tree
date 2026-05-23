import dagre from 'dagre';

export function getMarriagePairKey(id1, id2) {
  return [id1, id2].sort().join('-');
}

/**
 * Build React Flow nodes and edges from member documents.
 * @param {Array} members - member documents from the tree API
 * @param {string} focusId - active / focused member id
 * @param {Object} callbacks - { onAddParent, onAddSpouse, onAddChild, onEdit, onDelete }
 * @returns {{ nodes: Array, edges: Array }}
 */
export function buildFamilyGraph(members, focusId, callbacks = {}) {
  if (!focusId || !members?.length) {
    return { nodes: [], edges: [] };
  }

  const {
    onAddParent,
    onAddSpouse,
    onAddChild,
    onEdit,
    onDelete,
  } = callbacks;

  const visibleIds = new Set(members.map((m) => m._id));
  const sorted = [...members].sort(
    (a, b) =>
      (a.details?.dob ? new Date(a.details.dob).getTime() : 0) -
      (b.details?.dob ? new Date(b.details.dob).getTime() : 0)
  );

  const initialNodes = [];
  const initialEdges = [];
  const processedSpousePairs = new Set();

  sorted.forEach((member) => {
    initialNodes.push({
      id: member._id,
      type: 'member',
      data: {
        ...member,
        isActive: member._id === focusId,
        onAddParent,
        onAddSpouse,
        onAddChild,
        onEdit,
        onDelete,
      },
      position: member.position || { x: 0, y: 0 },
    });

    if (member.spouses?.length) {
      member.spouses.forEach((spouseId) => {
        if (!visibleIds.has(spouseId)) return;

        const pairKey = getMarriagePairKey(member._id, spouseId);
        if (processedSpousePairs.has(pairKey)) return;

        processedSpousePairs.add(pairKey);
        const marriageNodeId = `marriage-${pairKey}`;
        initialNodes.push({
          id: marriageNodeId,
          type: 'marriage',
          data: { pairKey, leftId: member._id, rightId: spouseId },
          position: { x: 0, y: 0 },
        });

        initialEdges.push({
          id: `e-spouse-${pairKey}`,
          source: member._id,
          target: spouseId,
          sourceHandle: 'spouse',
          targetHandle: 'spouse-in',
          type: 'curve',
          className: 'edge-spouse',
          data: { kind: 'spouse' },
        });
      });
    }
  });

  sorted.forEach((member) => {
    if (!member.parents?.length) return;

    const visibleParents = member.parents.filter((pid) => visibleIds.has(pid));
    if (visibleParents.length === 0) return;

    let parentSourceId = visibleParents[0];
    if (visibleParents.length >= 2) {
      const pairKey = getMarriagePairKey(visibleParents[0], visibleParents[1]);
      if (processedSpousePairs.has(pairKey)) {
        parentSourceId = `marriage-${pairKey}`;
      }
    }

    const fromMarriage = parentSourceId.startsWith('marriage-');
    initialEdges.push({
      id: `e-${parentSourceId}-${member._id}`,
      source: parentSourceId,
      target: member._id,
      sourceHandle: fromMarriage ? 'bottom' : 'children',
      targetHandle: 'top',
      type: 'curve',
      className: 'edge-parent',
      data: { kind: 'parent' },
    });
  });

  return { nodes: initialNodes, edges: initialEdges };
}

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 120, edgesep: 40, ranksep: 180 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.type === 'marriage' ? 8 : 220,
      height: node.type === 'marriage' ? 8 : 120,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  nodes
    .filter((node) => node.type === 'marriage' && node.data?.leftId && node.data?.rightId)
    .forEach((mNode) => {
      dagreGraph.setEdge(mNode.data.leftId, mNode.id, { minlen: 1, weight: 8 });
      dagreGraph.setEdge(mNode.data.rightId, mNode.id, { minlen: 1, weight: 8 });
    });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    const width = node.type === 'marriage' ? 8 : 220;
    const height = node.type === 'marriage' ? 8 : 120;
    return {
      ...node,
      position: { x: nodeWithPos.x - width / 2, y: nodeWithPos.y - height / 2 },
    };
  });

  const finalNodes = [...newNodes];
  const marriageMap = {};
  nodes.forEach((node) => {
    if (node.type === 'marriage' && node.data?.leftId && node.data?.rightId) {
      marriageMap[node.id] = { left: node.data.leftId, right: node.data.rightId };
    }
  });

  Object.keys(marriageMap).forEach((marriageId) => {
    const mNode = finalNodes.find((n) => n.id === marriageId);
    const leftNode = finalNodes.find((n) => n.id === marriageMap[marriageId].left);
    const rightNode = finalNodes.find((n) => n.id === marriageMap[marriageId].right);

    if (mNode && leftNode && rightNode) {
      rightNode.position.y = leftNode.position.y;
      mNode.position.y = leftNode.position.y + 32;

      const ogMX = mNode.position.x;
      const leftNodeWidth = 200;
      const horizontalGap = 60;

      mNode.position.x = leftNode.position.x + leftNodeWidth + horizontalGap;
      rightNode.position.x = mNode.position.x + horizontalGap;

      const dx = mNode.position.x - ogMX;

      const childrenEdges = edges.filter((e) => e.source === marriageId);
      childrenEdges.forEach((ce) => {
        const childNode = finalNodes.find((n) => n.id === ce.target);
        if (childNode) {
          childNode.position.x += dx;
        }
      });
    }
  });

  return { nodes: finalNodes, edges };
}
