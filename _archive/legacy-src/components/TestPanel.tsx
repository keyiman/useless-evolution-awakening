import { useEffect, useState } from 'react';
import type { TestResult } from '../engine/uselessTest';

export function TestPanel({ result, run, onReplay, onBack }: { result: TestResult; run: number; onReplay: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, result.steps.length)), 1500);
    return () => clearInterval(id);
  }, [run, result]);

  return (
    <div className={`test-panel ${result.success ? 'ok' : 'fail'}`}>
      <div className="test-head">
        <span className="test-badge">{result.success ? '测试通过' : '测试失败'}</span>
        <strong>{result.headline}</strong>
        <span className="test-reason">{result.reason}</span>
      </div>
      <ol className="test-steps">
        {result.steps.map((s, i) => (
          <li key={i} className={i < step ? 'done' : i === step ? 'active' : 'pending'}>
            {s.text}
          </li>
        ))}
      </ol>
      <div className="test-verdict">{step >= result.steps.length ? result.verdict : '观察中…'}</div>
      <div className="test-actions">
        <button className="btn ghost" onClick={onReplay}>
          重放测试
        </button>
        <button className="btn" onClick={onBack}>
          返回观察
        </button>
      </div>
    </div>
  );
}
