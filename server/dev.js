// Local development server. On Vercel, api/recipe.js is used instead.
import 'dotenv/config';
import express from 'express';
import handler from './handler.js';

const app = express();
const PORT = Number(process.env.API_PORT) || 3001;

app.use(express.json({ limit: '20kb' }));
app.all('/api/recipe', handler);

// Malformed JSON body from the client -> clean 400 instead of an HTML error page.
app.use((err, _req, res, _next) => {
  const status = err.status === 400 || err.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: { code: status === 400 ? 'INVALID_INPUT' : 'UPSTREAM', message: 'Bad request.' } });
});

app.listen(PORT, () => {
  const keyStatus = process.env.GEMINI_API_KEY ? 'set' : 'MISSING (only ?debug=1 sample modes will work)';
  console.log(`API on http://localhost:${PORT}  ·  GEMINI_API_KEY ${keyStatus}`);
});
