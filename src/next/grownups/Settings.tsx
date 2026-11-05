import { Grade } from '@/core/stages';
import { Learner, Profile } from '@/core/learner';
import { setLearner } from '../store';
import { Segmented } from './ui';

const GRADES = [{ value: 'K', label: 'K' }, { value: '1', label: '1st' }, { value: '2', label: '2nd' }] as const satisfies readonly { value: Grade; label: string }[];
const ON_OFF = [{ value: true, label: 'On' }, { value: false, label: 'Off' }] as const;

function set<K extends keyof Profile>(key: K, value: Profile[K]) {
  setLearner((l) => ({ ...l, profile: { ...l.profile, [key]: value } }));
}

export default function Settings({ learner }: { learner: Learner }) {
  const p = learner.profile;
  return (
    <div className="gu-settings">
      <div className="gu-set">
        <label htmlFor="gu-name">Child&rsquo;s name</label>
        <input
          id="gu-name" className="gu-input" value={p.name} maxLength={40} placeholder="Optional"
          autoComplete="off" onChange={(e) => set('name', e.target.value)}
        />
      </div>
      <div className="gu-set">
        <span>Grade</span>
        <Segmented<Grade> label="Grade" value={p.grade} options={GRADES} onChange={(v) => set('grade', v)} />
      </div>
      <div className="gu-set">
        <span>Sums in a walk</span>
        <Segmented<10 | 20> label="Sums in a walk" value={p.walkLength}
          options={[{ value: 10, label: '10' }, { value: 20, label: '20' }]} onChange={(v) => set('walkLength', v)} />
      </div>
      <div className="gu-set">
        <span>Walks a day</span>
        <Segmented<number> label="Daily goal, walks a day" value={p.dailyWalks}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} onChange={(v) => set('dailyWalks', v)} />
      </div>
      <div className="gu-set">
        <span>Picture help</span>
        <Segmented<Profile['pictures']> label="Picture help" value={p.pictures}
          options={[{ value: 'auto', label: 'Auto' }, { value: 'always', label: 'Always' }, { value: 'off', label: 'Off' }]}
          onChange={(v) => set('pictures', v)} />
      </div>
      <div className="gu-set">
        <span>Read aloud</span>
        <Segmented<boolean> label="Read aloud" value={p.readAloud} options={ON_OFF} onChange={(v) => set('readAloud', v)} />
      </div>
      <div className="gu-set">
        <span>Sound</span>
        <Segmented<boolean> label="Sound" value={p.sound} options={ON_OFF} onChange={(v) => set('sound', v)} />
      </div>
    </div>
  );
}
