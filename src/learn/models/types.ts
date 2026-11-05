import { ModelState } from '../types';

/**
 * Every model component takes its state, and an onChange only when she may
 * change it ("do" steps, and items answered by doing). Without onChange it is
 * a picture. Components must be controlled: draw exactly `state`, and report
 * every change through onChange rather than keeping their own copy.
 */
export interface ModelProps<K extends ModelState['model'] = ModelState['model']> {
  state: Extract<ModelState, { model: K }>;
  onChange?: (next: Extract<ModelState, { model: K }>) => void;
  /** 'small' for a picture beside a question, 'big' for teaching. Default 'big'. */
  size?: 'small' | 'big';
}
