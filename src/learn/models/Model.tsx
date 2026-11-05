import { ModelState } from '../types';
import { ModelProps } from './types';
import TenFrame from './TenFrame';
import NumberLine from './NumberLine';
import Objects from './Objects';
import Bond from './Bond';
import Compare from './Compare';
import Blocks from './Blocks';
import Clock from './Clock';
import Coins from './Coins';
import Fraction from './Fraction';
import Shapes from './Shapes';
import Measure from './Measure';
import Graph from './Graph';
import Text from './Text';

// One entry point for every manipulative. A lesson names a state; this picks
// the component that draws it.

type AnyProps = { state: ModelState; onChange?: (s: ModelState) => void; size?: ModelProps['size'] };

export default function Model(props: AnyProps) {
  // Each component is typed for its own kind; the switch is what guarantees
  // the state matches, which TypeScript cannot follow through the spread.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = props as any;
  switch (props.state.model) {
    case 'tenFrame': return <TenFrame {...p} />;
    case 'numberLine': return <NumberLine {...p} />;
    case 'objects': return <Objects {...p} />;
    case 'bond': return <Bond {...p} />;
    case 'compare': return <Compare {...p} />;
    case 'blocks': return <Blocks {...p} />;
    case 'clock': return <Clock {...p} />;
    case 'coins': return <Coins {...p} />;
    case 'fraction': return <Fraction {...p} />;
    case 'shapes': return <Shapes {...p} />;
    case 'measure': return <Measure {...p} />;
    case 'graph': return <Graph {...p} />;
    case 'text': return <Text {...p} />;
  }
}
