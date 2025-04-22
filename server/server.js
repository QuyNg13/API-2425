import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';
import cookie from 'cookie';

const port = process.env.PORT;
const NS_API_KEY = process.env.NS_API_KEY;
const API_BASE = "https://gateway.apiportal.ns.nl";

const engine = new Liquid({ extname: '.liquid' });
const app = new App();

app
  .use(logger())
  .use('/', sirv('dist'))
  .listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

// Route voor de homepage
app.get('/', async (req, res) => {
  return res.send(renderTemplate('server/views/index.liquid', { title: 'Home' }));
});

//==========================
// Adres suggesties
//==========================
app.get('/autosuggest', async (req, res) => {
  const query = req.query.query;

  if (!query) {
      return res.status(400).json({ error: "Query is verplicht." });
  }

  try {
      const response = await fetch(`${API_BASE}/places-api/v2/autosuggest?q=${query}&type=address`, {
          headers: {
              "Ocp-Apim-Subscription-Key": NS_API_KEY,
              "Accept": "application/json"
          }
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      const suggestions = data.payload.flatMap((item) => {
          return item.locations.map((location) => ({
              label: `${location.street}, ${location.city}`
          }));
      });

      res.json({ suggestions });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// ========================================
// Route voor gevonden station op basis van adres
// ========================================
app.get('/departures', async (req, res) => {

  const { adres } = req.query; // Haal 'adres' uit de queryparameters

  if (!adres) {
    return res.status(400).json({ error: "Het adres is verplicht." });
  }

  try {
    const placesResponse = await fetch(`${API_BASE}/places-api/v2/autosuggest?q=${adres}&type=address`, {
      headers: {
        "Ocp-Apim-Subscription-Key": NS_API_KEY,
        "Accept": "application/json"
      }
    });

    const placesData = await placesResponse.json();
    const location = placesData.payload[0]?.locations[0];
    if (!location) throw new Error('Geen locatie gevonden voor het opgegeven adres.');

    const lat = location.lat;
    const lng = location.lng;

    // Station ophalen
    const stationResponse = await fetch(`${API_BASE}/nsapp-stations/v3/nearest?lat=${lat}&lng=${lng}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!stationResponse.ok) throw new Error(`API error: ${stationResponse.status}`);
    const stationData = await stationResponse.json();
    const station = stationData.payload[0];

    // Sla de UICCode op in een cookie
    res.cookie('departureUicCode', station.id.uicCode, {
      httpOnly: true  // voorkomt toegang via JS aan de clientzijde
    });

    // Vertrektijden ophalen
    const departuresResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/departures?uicCode=${station.id.uicCode}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!departuresResponse.ok) throw new Error(`API error: ${departuresResponse.status}`);
    const departuresData = await departuresResponse.json();

    //Benodigde data van departures
    const departures = await Promise.all(departuresData.payload.departures.map(async dep => {

      // Fetch train image
      const departureDetailResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/journey?train=${dep.product.number}&departureUicCode=${station.id.uicCode}&omitCrowdForecast=false`, {
        headers: { 
          "Ocp-Apim-Subscription-Key": NS_API_KEY, 
          "Accept": "application/json" 
        }
      });

      const journeyData = await departureDetailResponse.json();
      const trainImage = journeyData.payload.stops[0]?.actualStock?.trainParts?.[0]?.image?.uri || null;

      return {
        direction: dep.direction,
        time: dep.plannedDateTime,
        track: dep.plannedTrack,
        product: dep.product.categoryCode,
        number: dep.product.number,
        trainImage
      };
    }));

    //Bereken tijd-offsets tussen eerste en laatste vertrek
    const firstTime = new Date(departures[0].time).getTime();
    const lastTime = new Date(departures[departures.length - 1].time).getTime();
    const totalDiff = lastTime - firstTime || 1

    //Voeg offset en imageMargin toe aan elke departure
    departures.forEach(dep => {
    const depTime = new Date(dep.time).getTime();
    const offset = ((depTime - firstTime) / totalDiff) * 100;
    dep.offset = offset;
    });

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

// ========================================
// Route voor gevonden station op basis van locatie
// ========================================
app.get('/nearest-station', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude en longitude zijn verplicht." });
  }

  try {
    // Haal het dichtstbijzijnde station op
    const stationResponse = await fetch(`${API_BASE}/nsapp-stations/v3/nearest?lat=${lat}&lng=${lng}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!stationResponse.ok) throw new Error(`API error: ${stationResponse.status}`);
    const stationData = await stationResponse.json();
    const station = stationData.payload[0];

    // Haal vertrektijden op
    const departuresResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/departures?uicCode=${station.id.uicCode}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!departuresResponse.ok) throw new Error(`API error: ${departuresResponse.status}`);
    const departuresData = await departuresResponse.json();

    // Verwerk de vertrektijden
    const departures = await Promise.all(departuresData.payload.departures.map(async dep => {
      const departureDetailResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/journey?train=${dep.product.number}&departureUicCode=${station.id.uicCode}&omitCrowdForecast=false`, {
        headers: { 
          "Ocp-Apim-Subscription-Key": NS_API_KEY, 
          "Accept": "application/json" 
        }
      });

      const journeyData = await departureDetailResponse.json();
      const trainImage = journeyData.payload.stops[0]?.actualStock?.trainParts?.[0]?.image?.uri || null;

      return {
        direction: dep.direction,
        time: dep.plannedDateTime,
        track: dep.plannedTrack,
        product: dep.product.categoryCode,
        number: dep.product.number,
        trainImage
      };
    }));

        //Bereken tijd-offsets tussen eerste en laatste vertrek
        const firstTime = new Date(departures[0].time).getTime();
        const lastTime = new Date(departures[departures.length - 1].time).getTime();
        const totalDiff = lastTime - firstTime || 1;
    
        //Voeg offset en imageMargin toe aan elke departure
        departures.forEach(dep => {
          const depTime = new Date(dep.time).getTime();
          const offset = ((depTime - firstTime) / totalDiff) * 100;
          dep.offset = offset;
        });

    // Render de template met station- en vertrekgegevens
    return res.send(renderTemplate('server/views/index.liquid', {
      title: `Vertrektijden van ${station.names.long}`,
      station: station.names.long,
      departures
    }));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Route voor details op basis van vertreknummer
// ========================================

app.get('/departure/:productNumber', async (req, res) => {
  const productNumber = req.params.productNumber;

  // Haal UICCode op uit cookies
  const cookies = cookie.parse(req.headers.cookie || ''); 

  const departureUicCode = cookies.departureUicCode;

  if (!departureUicCode) {
    return res.status(400).json({ error: "Geen vertrekstation gevonden in cookies." });
  }
  
  try {
    // Haal informatie op voor dit vertreknummer vanaf het station dat gevonden is
    const departureDetailResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/journey?train=${productNumber}&departureUicCode=${departureUicCode}&omitCrowdForecast=false`, {
      headers: { 
        "Ocp-Apim-Subscription-Key": NS_API_KEY, 
        "Accept": "application/json" 
      }
    });

    const journeyData = await departureDetailResponse.json();

    const stops = journeyData.payload.stops.map(({ id, stop, status, arrivals = [], departures = [], actualStock }) => ({
      id,
      stopName: stop.name,
      status,
      plannedArrival: arrivals[0]?.plannedTime || null,
      actualArrival: arrivals[0]?.actualTime || null,
      plannedDeparture: departures[0]?.plannedTime || null,
      actualDeparture: departures[0]?.actualTime || null,
      platform: departures[0]?.plannedTrack || null,
      crowdForecast: departures[0]?.crowdForecast || "UNKNOWN",
      trainType: actualStock?.trainType || null,
      facilities: actualStock?.trainParts?.flatMap(part => part.facilities) || [],
      trainImage: actualStock?.trainParts?.[0]?.image?.uri || null
    }));

    return res.send(renderTemplate('server/views/detail.liquid', {
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