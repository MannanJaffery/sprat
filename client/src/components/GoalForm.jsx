import { useState } from 'react';
import { TextField, TextAreaField, SelectField, CheckboxField } from './FormField';
import { TAXONOMY_SUBTYPES, SUBJECT_CLASSIFICATIONS } from '../constants/taxonomy';

const DEFAULTS = {
  documentId: '',
  goalCode: '',
  description: '',
  taxonomyCategory: 'protection',
  taxonomySubtype: TAXONOMY_SUBTYPES.protection[0],
  granularity: 'policy',
  observable: true,
  actor: '',
  contextExcerpt: '',
  relevantLegislation: '',
  subjectClassifications: [],
};

// FR-GSM 1/3/4: full goal element set, taxonomy classification, and multi-select
// subject classification, shared by the "add goal" modal and the goal edit tab.
export default function GoalForm({ documents, initialValues, onSubmit, submitting, submitLabel, lockDocument }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initialValues });

  const toggleSubject = (value) => {
    setForm((prev) => ({
      ...prev,
      subjectClassifications: prev.subjectClassifications.includes(value)
        ? prev.subjectClassifications.filter((v) => v !== value)
        : [...prev.subjectClassifications, value],
    }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Goal ID"
          required
          placeholder="e.g. G-014"
          value={form.goalCode}
          onChange={(e) => setForm({ ...form, goalCode: e.target.value })}
        />
        <SelectField
          label="Source policy document"
          required
          disabled={lockDocument}
          value={form.documentId}
          onChange={(e) => setForm({ ...form, documentId: e.target.value })}
        >
          <option value="">Select a document…</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        label="Description"
        required
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Taxonomy category"
          value={form.taxonomyCategory}
          onChange={(e) => {
            const taxonomyCategory = e.target.value;
            setForm({
              ...form,
              taxonomyCategory,
              taxonomySubtype: TAXONOMY_SUBTYPES[taxonomyCategory][0],
            });
          }}
        >
          <option value="protection">Protection</option>
          <option value="vulnerability">Vulnerability</option>
        </SelectField>
        <SelectField
          label="Taxonomy subtype"
          value={form.taxonomySubtype}
          onChange={(e) => setForm({ ...form, taxonomySubtype: e.target.value })}
        >
          {TAXONOMY_SUBTYPES[form.taxonomyCategory].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Granularity"
          value={form.granularity}
          onChange={(e) => setForm({ ...form, granularity: e.target.value })}
        >
          <option value="policy">Policy goal</option>
          <option value="scenario">Scenario goal</option>
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Actor"
          value={form.actor}
          onChange={(e) => setForm({ ...form, actor: e.target.value })}
        />
        <TextField
          label="Relevant legislation"
          placeholder="e.g. HIPAA"
          value={form.relevantLegislation}
          onChange={(e) => setForm({ ...form, relevantLegislation: e.target.value })}
        />
      </div>

      <CheckboxField
        label="Observable (an average user would notice this data practice)"
        checked={form.observable}
        onChange={(e) => setForm({ ...form, observable: e.target.checked })}
      />

      <TextAreaField
        label="Context excerpt (verbatim policy text this goal was derived from)"
        rows={3}
        value={form.contextExcerpt}
        onChange={(e) => setForm({ ...form, contextExcerpt: e.target.value })}
      />

      <div>
        <label className="label">Subject classification (select all that apply)</label>
        <div className="grid max-h-48 grid-cols-1 gap-x-4 gap-y-1 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
          {SUBJECT_CLASSIFICATIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary-600"
                checked={form.subjectClassifications.includes(s)}
                onChange={() => toggleSubject(s)}
              />
              {s}
            </label>
          ))}
        </div>
        {form.subjectClassifications.length === 0 && (
          <p className="mt-1 text-xs text-danger">Select at least one subject classification.</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || form.subjectClassifications.length === 0}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
