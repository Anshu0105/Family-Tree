import { BaseEdge, getSmoothStepPath, getStraightPath } from '@xyflow/react';

/**
 * Unified family edge renderer.
 * - spouse edges: straight gray horizontal line (heart marriage node covers the midpoint)
 * - parent edges: smooth step curve in gray, no arrowhead
 */
export function CurveEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) {
  const kind = data?.kind === 'spouse' ? 'spouse' : 'parent';

  let edgePath;
  if (kind === 'spouse') {
    [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else {
    [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 12,
    });
  }

  // Spouse edges use a lighter warm gray; parent edges use a slightly deeper gray
  const stroke = kind === 'spouse' ? '#c8bfb0' : '#b0a090';

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      className={`family-curve family-curve-${kind}`}
      style={{
        stroke,
        strokeWidth: 2,
        fill: 'none',
        strokeLinecap: 'round',
        ...style,
      }}
    />
  );
}
