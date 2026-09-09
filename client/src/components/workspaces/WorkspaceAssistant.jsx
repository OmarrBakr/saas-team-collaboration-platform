import { useState } from 'react';
import { askWorkspaceAssistant } from '../../services/workspaces';

export default function WorkspaceAssistant({ workspaceId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true); setError('');
    try {
      setAnswer((await askWorkspaceAssistant(workspaceId, question.trim())).answer);
    } catch (err) { setError(err.message || 'The assistant could not answer right now.'); }
    finally { setLoading(false); }
  };

  return (
    <section className="project-assistant" aria-labelledby="workspace-assistant-title">
      <div>
        <p className="dashboard-kicker">AI assistant</p>
        <h2 id="workspace-assistant-title">Ask about this workspace</h2>
        <p className="workspace-empty-copy">Search across cards in all workspace boards.</p>
      </div>
      <form className="project-assistant-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="workspace-assistant-question">Your question</label>
        <textarea id="workspace-assistant-question" rows={3} maxLength={1000} value={question}
          onChange={(event) => setQuestion(event.target.value)} placeholder="What is blocking the workspace?" />
        <button type="submit" className="workspace-edit-btn" disabled={loading || !question.trim()}>
          {loading ? 'Thinking…' : 'Ask assistant'}
        </button>
      </form>
      {error && <p className="dashboard-alert" role="alert">{error}</p>}
      {answer && <div className="project-assistant-answer" aria-live="polite"><strong>Assistant</strong><p>{answer}</p></div>}
    </section>
  );
}
