import { useState } from 'react';
import { TextField, TextAreaField, SelectField } from './FormField';

const DEFAULTS = {
  name: '',
  sources: '',
  actors: '',
  events: '',
  actions: '',
  obstacles: '',
  constraints: '',
  preConditions: '',
  postConditions: '',
  status: 'draft',
  issues: '',
  requirementsText: '',
};

// FR-SSM 1/2: the full scenario element set from the SRS.
export default function ScenarioForm({ initialValues, onSubmit, submitting, submitLabel }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initialValues });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Scenario name" required value={form.name} onChange={set('name')} />
        <SelectField label="Status" value={form.status} onChange={set('status')}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Sources" value={form.sources} onChange={set('sources')} />
        <TextField label="Actor(s)" value={form.actors} onChange={set('actors')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextAreaField label="Event(s)" rows={2} value={form.events} onChange={set('events')} />
        <TextAreaField label="Action(s)" rows={2} value={form.actions} onChange={set('actions')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextAreaField label="Obstacle(s)" rows={2} value={form.obstacles} onChange={set('obstacles')} />
        <TextAreaField label="Constraint(s)" rows={2} value={form.constraints} onChange={set('constraints')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextAreaField
          label="Pre-condition(s)"
          rows={2}
          value={form.preConditions}
          onChange={set('preConditions')}
        />
        <TextAreaField
          label="Post-condition(s)"
          rows={2}
          value={form.postConditions}
          onChange={set('postConditions')}
        />
      </div>

      <TextAreaField label="Issue(s)" rows={2} value={form.issues} onChange={set('issues')} />
      <TextAreaField
        label="Requirements"
        rows={2}
        value={form.requirementsText}
        onChange={set('requirementsText')}
      />

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
