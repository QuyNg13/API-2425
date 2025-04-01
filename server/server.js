// import 'dotenv/config';
// import { App } from '@tinyhttp/app';
// import { logger } from '@tinyhttp/logger';
// import { Liquid } from 'liquidjs';
// import sirv from 'sirv';

// const data = {
//   'beemdkroon': {
//     id: 'beemdkroon',
//     name: 'Beemdkroon',
//     image: {
//       src: 'https://i.pinimg.com/736x/09/0a/9c/090a9c238e1c290bb580a4ebe265134d.jpg',
//       alt: 'Beemdkroon',
//       width: 695,
//       height: 1080,
//     }
//   },
//   'wilde-peen': {
//     id: 'wilde-peen',
//     name: 'Wilde Peen',
//     image: {
//       src: 'https://mens-en-gezondheid.infonu.nl/artikel-fotos/tom008/4251914036.jpg',
//       alt: 'Wilde Peen',
//       width: 418,
//       height: 600,
//     }
//   }
// }

// const engine = new Liquid({
//   extname: '.liquid',
// });

// const app = new App();

// app
//   .use(logger())
//   .use('/', sirv('dist'))
//   .listen(3000, () => console.log('Server available on http://localhost:3000'));

// app.get('/', async (req, res) => {
//   const data = await fetch(ApiURL);
//   const station = await data.json();
//   console.log(station);
//   return res.send(renderTemplate('server/views/index.liquid', { title: 'Home', items: station }));
// });

// app.get('/plant/:id/', async (req, res) => {
//   const id = req.params.id;
//   const item = data[id];
//   if (!item) {
//     return res.status(404).send('Not found');
//   }
//   return res.send(renderTemplate('server/views/detail.liquid', { title: `Detail page for ${id}`, item }));
// });

// const renderTemplate = (template, data) => {
//   const templateData = {
//     NODE_ENV: process.env.NODE_ENV || 'production',
//     ...data
//   };

//   return engine.renderFileSync(template, templateData);
// };

import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

const NS_API_KEY = process.env.NS_API_KEY;
const API_BASE = "https://gateway.apiportal.ns.nl";

const engine = new Liquid({ extname: '.liquid' });
const app = new App();

app
  .use(logger())
  .use('/', sirv('dist'))
  .listen(3000, () => console.log('Server draait op http://localhost:3000'));

// Route voor de homepage
app.get('/', async (req, res) => {
  return res.send(renderTemplate('server/views/index.liquid', { title: 'Home', items: Object.values(data) }));
});

app.get('/plant/:id/', async (req, res) => {
  const id = req.params.id;
  const item = data[id];
  if (!item) {
    return res.status(404).send('Not found');
  }
  return res.send(renderTemplate('server/views/detail.liquid', { title: `Detail page for ${id}`, item }));
});

const renderTemplate = (template, data) => {
    const templateData = {
      NODE_ENV: process.env.NODE_ENV || 'production',
      ...data
    };
  
    return engine.renderFileSync(template, templateData);
  };

  // // API-endpoint om dichtstbijzijnde station op te halen
// app.get('nearest-station', async (req, res) => {
//   const { lat, lng } = req.query;

//   if (!lat || !lng) return res.status(400).json({ error: "Geef lat en lng op" });

//   try {
//     const response = await fetch(`${API_URL}?lat=${lat}&lng=${lng}`, {
//       headers: { "Ocp-Apim-Subscription-Key": API_KEY, "Accept": "application/json" }
//     });

//     if (!response.ok) throw new Error(`API error: ${response.status}`);

//     const data = await response.json();
//     res.json({ station: data.payload[0].names.long });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });