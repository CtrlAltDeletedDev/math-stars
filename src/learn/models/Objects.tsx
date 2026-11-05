import { ModelProps } from './types';

// Placeholder: being built. Draws the state as text so lessons still run.
export default function Objects({ state }: ModelProps) {
  return <pre style={{ fontSize: 14, whiteSpace: 'pre-wrap', background: '#fff', padding: 12, borderRadius: 12 }}>{JSON.stringify(state)}</pre>;
}
