export default function routes(app, opts) {
  app.get('/', (req, res) => {
    res.json({ message: 'API de Amigos ativa!' });
  });
}