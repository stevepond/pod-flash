import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.get('/ping', (_req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`API listening on ${port}`));
