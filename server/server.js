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
  return res.send(renderTemplate('server/views/index.liquid', { title: 'Home' }));
});

app.get('/departures', async (req, res) => {
  const { lat, lng } = req.query;
  // if (!lat || !lng) return res.status(400).send({ error: "Geef lat en lng op" });

  try {
    // Station ophalen
    const stationResponse = await fetch(`${API_BASE}/nsapp-stations/v3/nearest?lat=${lat}&lng=${lng}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!stationResponse.ok) throw new Error(`API error: ${stationResponse.status}`);
    const stationData = await stationResponse.json();
    const station = stationData.payload[0];

    // Vertrektijden ophalen
    const departuresResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/departures?uicCode=${station.id.uicCode}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!departuresResponse.ok) throw new Error(`API error: ${departuresResponse.status}`);
    const departuresData = await departuresResponse.json();

    //Benodigde data van departures
    const departures = departuresData.payload.departures.map(dep => ({
      direction: dep.direction,
      time: dep.plannedDateTime,
      track: dep.plannedTrack,
      product: dep.product.categoryCode,
      number: dep.product.number
    }));

    //Stationsnaam inladen
    return res.send(renderTemplate('server/views/index.liquid', {
      title: `Vertrektijden van ${station.names.long}`,
      station: station.names.long,
      departures
    }));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/departure/:productNumber', async (req, res) => {
  const productNumber = req.params.productNumber;
  
  try {
    // Haal gedetailleerde informatie op voor dit vertreknummer
    const departureDetailResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/journey?train=${productNumber}&omitCrowdForecast=false`, {
      headers: { 
        "Ocp-Apim-Subscription-Key": NS_API_KEY, 
        "Accept": "application/json" 
      }
    });

    const journeyData = await departureDetailResponse.json();

    const stops = journeyData.payload.stops.map(stop => ({
      id: stop.id,
      stopName: stop.stop.name,
      status: stop.status,
      plannedArrival: (stop.arrivals && stop.arrivals.length > 0) ? stop.arrivals[0].plannedTime : null,
      actualArrival: (stop.arrivals && stop.arrivals.length > 0) ? stop.arrivals[0].actualTime : null,
      plannedDeparture: (stop.departures && stop.departures.length > 0) ? stop.departures[0].plannedTime : null,
      actualDeparture: (stop.departures && stop.departures.length > 0) ? stop.departures[0].actualTime : null,
      platform: (stop.departures && stop.departures.length > 0) ? stop.departures[0].plannedTrack : null,
      crowdForecast: (stop.departures && stop.departures.length > 0) ? stop.departures[0].crowdForecast : "UNKNOWN",
      trainType: stop.actualStock ? stop.actualStock.trainType : null,
      facilities: stop.actualStock ? stop.actualStock.trainParts.map(part => part.facilities).flat() : [],
      trainImage: (stop.actualStock && stop.actualStock.trainParts && stop.actualStock.trainParts.length > 0)
                    ? stop.actualStock.trainParts[0].image.uri
                    : null
    }));

    return res.send(renderTemplate('server/views/detail.liquid', {
      title: `Details voor vertrek ${productNumber}`,
      stops
    }));

  } catch (error) {
    res.status(500).send(`Fout: ${error.message}`);
  }
});

const renderTemplate = (template, data) => {
    const templateData = {
      NODE_ENV: process.env.NODE_ENV || 'production',
      ...data
    };
  
    return engine.renderFileSync(template, templateData);
  };