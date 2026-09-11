function interpretFRES(fres) {
  if (fres == null) return { label: 'Not available', variant: 'neutral' };
  if (fres >= 90) return { label: 'Very easy (5th grade)', variant: 'success' };
  if (fres >= 70) return { label: 'Easy (7th grade)', variant: 'success' };
  if (fres >= 60) return { label: 'Plain English (8th–9th grade)', variant: 'primary' };
  if (fres >= 50) return { label: 'Fairly difficult (10th–12th grade)', variant: 'warning' };
  if (fres >= 30) return { label: 'Difficult (college)', variant: 'warning' };
  return { label: 'Very difficult (college graduate)', variant: 'danger' };
}

export default function FleschScoreCard({ data }) {
  const interpretation = interpretFRES(data.fres);

  return (
    <div className="card space-y-4">
      <h2 className="text-base font-semibold text-text-primary">
        Flesch Readability
      </h2>

      {data.fres == null ? (
        <p className="text-sm text-text-secondary">This document has no content to analyze yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Reading Ease (FRES)" value={data.fres} />
            <Metric label="Grade Level (FGL)" value={data.fgl} />
            <Metric label="Words" value={data.wordCount} />
            <Metric label="Sentences" value={data.sentenceCount} />
          </div>
          <p className="text-sm text-text-secondary">
            Interpretation:{' '}
            <span className="font-medium text-text-primary">{interpretation.label}</span>
          </p>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="text-xl font-bold text-text-primary">{value ?? '—'}</p>
    </div>
  );
}
