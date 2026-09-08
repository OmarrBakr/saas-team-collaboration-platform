import { useState } from 'react';
import { askProjectAssistant } from '../../services/boards';

export default function ProjectAssistant({ workspaceId, boardId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await askProjectAssistant(workspaceId, boardId, question.trim());
      setAnswer(result.answer);
    } catch (err) {
      setError(err.message || 'The assistant could not answer right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="project-assistant" aria-labelledby="project-assistant-title">
      <div>
        <p className="dashboard-kicker">AI assistant</p>
        <h2 id="project-assistant-title">Ask about this project</h2>
        <p className="workspace-empty-copy">Get answers from this board’s lists and cards.</p>
      </div>
      <form className="project-assistant-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="project-assistant-question">Your question</label>
        <textarea
          id="project-assistant-question"
          value={question}
          maxLength={1000}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What is blocking this project?"
          rows={3}
        />
        <button type="submit" className="workspace-edit-btn" disabled={loading || !question.trim()}>
          {loading ? 'Thinking…' : 'Ask assistant'}
        </button>
      </form>
      {error && <p className="dashboard-alert" role="alert">{error}</p>}
      {answer && <div className="project-assistant-answer" aria-live="polite"><strong>Assistant</strong><p>{answer}</p></div>}
    </section>
  );
}
