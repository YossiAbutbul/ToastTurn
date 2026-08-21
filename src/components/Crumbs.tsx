import { useCrumbFly } from '../hooks/useCrumbFly';

type CrumbsProps = {
  /** Changes once per pop. Nothing is thrown until it does. */
  trigger: number;
};

/** What the toast leaves behind, all over the counter. */
export function Crumbs({ trigger }: CrumbsProps) {
  const { crumbs, fade } = useCrumbFly(trigger);
  if (crumbs.length === 0) return null;

  return (
    <g className="tt-fly" opacity={fade} aria-hidden="true">
      {crumbs.map((crumb) => (
        <circle
          key={crumb.id}
          cx={crumb.x}
          cy={crumb.y}
          r={crumb.r}
          className={crumb.dark ? 'tt-fly-dark' : undefined}
        />
      ))}
    </g>
  );
}
