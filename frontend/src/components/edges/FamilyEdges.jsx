import { BaseEdge, getBezierPath } from '@xyflow/react';

/**
 * Simple flexible Bézier connector — soft curves, no rigid elbows.
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
  const curvature = kind === 'spouse' ? 0.18 : 0.42;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const stroke = kind === 'spouse' ? 'var(--edge-spouse)' : 'var(--edge-parent)';

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      className={`family-curve family-curve-${kind}`}
      style={{
        stroke,
        strokeWidth: 2,
        strokeLinecap: 'round',
        fill: 'none',
        ...style,
      }}
    />
  );
}
