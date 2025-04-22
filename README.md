# API
API repository | Quy Nguyen

<details>
<summary><h2>Week 1</h2></summary>

## Doel
In de eerste week van deze opdracht wil ik graag een beeld krijgen van wat ik ga maken. 
Het doel is om een content API dte vinden die goed gedocumenteerd is en en veel mee kan zodat ik mezelf kan uitdagen.
<br>
<br>
Als het lukt wil ik ook graag beginnen met inventariseren wat ik uit de api wil gaan halen en me bedenken met welke web API's ik de informatie wil laten zien.

## Voortgang
### Idee
Na naar verschillende content API's te kijken ben ik er achter gekomen dat ik met de NS API wil gaan werken.
Deze API is goed gedocumenteerd en zo ver ik kan zien, is er geen limiet aan calls die ik kan maken zolang ik geen misbruik maak van mijn toegang tot de API.
<br>
<br>
Ik heb gezien dat ik veel informatie van stations zelf en veel informatie over reisinformatie kan oproepen met de API.
Voor mijn idee wil ik graag dat de gebruiker een station kan opzoeken en dan een soort informatiebord ziet waar alle aankomende vertrekken staan van dat station.
De gebruiker met behulp van `geolocation` het dichtsbijzijnde station opzoeken of een adres invoeren om vanaf daar het dischtsbijzijnde station te krijgen.
<br>
<br>
### Code
Om het dichtsbijzijnde station te vinden op basis van een locatie heb ik de lattitude en longditude nodig. 
Ik heb een knop gemaakt die deze ophalen en het in de URL plaatsen zodat ik die kan ophalen aan in de server.
Dit doe ik in clientside javascript:
<details>
<summary> code lat en lng ophalen</summary>

```
document.getElementById("getLocation").addEventListener("click", async function() {
    if (!navigator.geolocation) {
        alert("Geolocatie wordt niet ondersteund door jouw browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
            window.location.href = `/departures?lat=${lat}&lng=${lng}`;
        } catch (error) {
            console.error("Fout bij ophalen station of vertrektijden:", error);
        }
    }, (error) => {
        alert("Kon locatie niet ophalen: " + error.message);
    });
});
```
</details>

Om het dichtsbijzijnde station op te zoeken op basis van lattitude en longditude met de station API gebruik ik de volgende API call: 
<details>
<summary>code station ophalen op basis van lat en lng</summary>

```
// Route om dichtstbijzijnde station op te halen
app.get('/departures', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "Geef lat en lng op" });

  try {
    // Haal dichtstbijzijnde station op
    const stationResponse = await fetch(`${API_BASE}/nsapp-stations/v3/nearest?lat=${lat}&lng=${lng}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });
```
</details>

Nu ik het station heb gevonden wil ik de aankomde vertrektijden zien van treinen. 
Uit de station API heb ik ook een uiccode gekregen, deze code is bij elk station uniek en kan ik hem dus gebruiken om de vertrektijden op te zoeken in de departures API.
<br>
<br>
Ik heb ChatGPT gebruikt om te helpen met hoe ik specifieke data (trein richting, spoor en tijden) uit de API op roep aangezien er veel data uit komt dat ik niet nodig heb.
de benodigde data roep ik als volgt op:
<details>
<summary>code treintijden data ophalen</summary>

```
// Haal vertrektijden op
    const departuresResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/departures?uicCode=${station.id.uicCode}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!departuresResponse.ok) throw new Error(`API error: ${departuresResponse.status}`);
    const departuresData = await departuresResponse.json();

    const departures = departuresData.payload.departures.map(dep => ({
      direction: dep.direction,
      time: dep.plannedDateTime,
      track: dep.plannedTrack
    }));

    return res.send(renderTemplate('server/views/index.liquid', {
      title: `Vertrektijden van ${station.names.long}`,
      station: station.names.long,
      departures
    }));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```
</details>

De data word vervolgens weergegeven in `index.liquid`. Voor elke trein waar de API een departure kan vinden op de uiccode die is gebruikt in de API call word er een list item gemaakt dat als volgt wordt ingevuld:
<details>
<summary>code data weergeven in liquid</summary>

```
<ul id="departuresList">
  {% if departures %}
    {% for dep in departures %}
      <li>{{ dep.direction }} - {{ dep.time }} - Spoor {{ dep.track }}</li>
    {% endfor %}
  {% else %}
    <li>Nog geen vertrektijden beschikbaar.</li>
  {% endif %}
</ul>
```
</details>

</details>

<!-- ////////////////// -->

<details>
<summary><h2>Week 2</h2></summary>

## Doel
Deze week wil ik gaan werken aan de detail pagina. Op de detailpagina wil ik laten zien welke eigenschappen de trein heeft en langs welke stations hij gaat.

## Voortgang

### Idee
Nadat de gebruiker een staion heeft gevonden krijgt hij een lijst met alle treinen die binnenkort vanaf dat station vertrekken.
Als de gebruiker op één van die treinen drukt komt hij op de detailpagina terecht. Hier is te zien waar die trein langs gaat met de tijd van vertrek. 
Hier zijn ook verdere details te zien over het treinstel.

### Code
Om het treinstel op te halen moet ik ook het product nummer van de trein ophalen wanneer ik de departures op haal.
Met dit product nummer kan ik de journey van het treinstel op halen met de reisinformatie journey API. 
Deze API call geeft alle data die ik nodig heb voor de detailpagina. ChatGPT heeft geholpen met data van de API uitlezen zodat ik het kan gebruiken.
<details>
<summary>code journey data ophalen</summary>

```
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
```
</details>

Ik kwam er achter dat bij het ophalen van vertrektijden, hij de niet alleen de uren en minuten geeft maar ook het jaar, maand en datum.
Deze data heb ik niet nodig. ik heb dit opgelost door `date: "%H:%M"` te gebruiken in het liquid bestand waar tijden worden gebruikt zodat alleen uren en minuten zichtbaar zijn.
<details>
<summary> code uren en minuten laten zien </summary>

```
  <li>
    <a href="/departure/{{ dep.number }}">
      {{ dep.direction }} - {{ dep.time | date: "%H:%M"}} - Spoor {{ dep.track }} - {{ dep.product }}
    </a>
  </li>
```
</details>

Bij het testen van de detail pagina kwam ik er achter dat je een trein kan bekijken die nog bezig is met een ander traject als hij ver in de toekomst pas vertrekt van het station dat je hebt gevonden.
Het is dus wel bekend dat de trein langs het station komt dat de gebruiker heeft gevonden maar het moment dat je naar de detailpagina gaat zie je de details van het traject waar hij op dat moment mee bezig is en niet het traject waar de gebruiker op heeft gedrukt.
<br>
<br>
Om dit op te lossen moet ik bij het ophalen van de journey ook de uiccode meegeven van het station dat de gebruiker heeft gevonden. 
Aangezien ik deze code al eerder heb opgehaald bij het ophalen van de departures heb ik er voor gekozen om deze code op te slaan in cookies zodat ik hem later in deze andere rout voor de journeys kan gebruiken.
<details>
<summary> code uiccode opslaan in cookies en later gebruiken in andere route </summary>

```
  try {
    // Station ophalen
    const stationResponse = await fetch(`${API_BASE}/nsapp-stations/v3/nearest?lat=${lat}&lng=${lng}`, {
      headers: { "Ocp-Apim-Subscription-Key": NS_API_KEY, "Accept": "application/json" }
    });

    if (!stationResponse.ok) throw new Error(`API error: ${stationResponse.status}`);
    const stationData = await stationResponse.json();
    const station = stationData.payload[0];

    // Sla de UICCode op in een cookie
    res.cookie('departureUicCode', station.id.uicCode, {
      httpOnly: true,
      secure: false,
    });

app.get('/departure/:productNumber', async (req, res) => {
  const productNumber = req.params.productNumber;

  // Haal UICCode op uit cookies
  const cookies = cookie.parse(req.headers.cookie || '');
  console.log('Cookies:', cookies);  // Debug

  const departureUicCode = cookies.departureUicCode;
  }
  
  try {
    // Haal gedetailleerde informatie op voor dit vertreknummer
    const departureDetailResponse = await fetch(`${API_BASE}/reisinformatie-api/api/v2/journey?train=${productNumber}&departureUicCode=${departureUicCode}&omitCrowdForecast=false`, {
      headers: { 
        "Ocp-Apim-Subscription-Key": NS_API_KEY, 
        "Accept": "application/json" 
      }
    });

    const journeyData = await departureDetailResponse.json();
```
</details>

Op de detail pagina laat ik alleen bij het eerste station de alle details van het treinstel zien met afbeelding.
Bij de rest van stations laat ik alleen de vertrektijden en drukte zien.
<details>
<summary> code weergave detail pagina data </summary>

```
{% block content %}
<h1>{{ title }}</h1>
  {% if stops and stops.size > 0 %}
    {% assign firstStop = stops[0] %} <!-- Krijg het eerste station -->
    {% for stop in stops %}
      <div class="stop">
        {% if stop == firstStop %}
          <h2 class="station-content">{{ stop.stopName }}</h2>
          {% if stop.plannedDeparture %}
            <p>Geplande vertrektijd: {{ stop.plannedDeparture | date: "%H:%M" }}</p>
          {% endif %}
          {% if stop.actualDeparture %}
            <p>Werkelijke vertrektijd: {{ stop.actualDeparture | date: "%H:%M" }}</p>
          {% endif %}
          
          {% if stop.trainImage %}
            <img src="{{ stop.trainImage }}" alt="{{ stop.trainType }}">
          {% endif %}
          <p>Status: {{ stop.status }}</p>
          {% if stop.plannedArrival %}
            <p>Geplande aankomst: {{ stop.plannedArrival | date: "%H:%M" }}</p>
          {% endif %}
          {% if stop.actualArrival %}
            <p>Werkelijke aankomst: {{ stop.actualArrival | date: "%H:%M" }}</p>
          {% endif %}
          {% if stop.platform %}
            <p>Spoor: {{ stop.platform }}</p>
          {% endif %}
          <p>Drukte: {{ stop.crowdForecast }}</p>
          {% if stop.trainType %}
            <p>Trein type: {{ stop.trainType }}</p>
          {% endif %}
          {% if stop.facilities and stop.facilities.size > 0 %}
            <p>Faciliteiten: {{ stop.facilities | join: ", " }}</p>
          {% endif %}
        {% else %}
          <!-- Alleen aankomst- en vertrektijden voor andere stations -->
          <h2 class="station-content">{{ stop.stopName }}</h2>
          {% if stop.plannedArrival %}
            <p>Geplande aankomst: {{ stop.plannedArrival | date: "%H:%M" }}</p>
          {% endif %}
          {% if stop.actualArrival %}
            <p>Werkelijke vertrektijd: {{ stop.actualDeparture | date: "%H:%M" }}</p>
          {% endif %}
        {% endif %}
      </div>
    {% endfor %}
  {% else %}
    <p>Geen stops gevonden.</p>
  {% endif %}

<p><a href="/">← Terug naar Home</a></p>
{% endblock %}
```
</details>

Deze week ben ik ook begonnen met de homepagina stylen zodat alle departures overzichtelijk onder elkaar komen te staan in een lijst.
<!-- styling image -->

De manier waarop chatGPT de data heeft uigelezen voor de detailpagina vond ik erg lang en niet goed leesbaar dus ik heb een poging gedaan om het te verkorten door dingen weg te halen en te kijken of het nog werkt en een aantal keer door chatGPT te halen.
<details>
<summary> code uitlezen data voor detailpagina </summary>

```
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
```
</details>

Bij het ophalen van de departures wil ik ook bij alle departures een plaatje laten zien van het treinstel. 
Het plaatje van het treinstel moet ik ophalen uit de journey API. Ik het een extra API call gedaan bij departures om de img op te halen op weer te geven op /departures.
<details>
<summary> code fetch trainimage voor departures </summary>

```
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

        <li class="departure-item">      
      <a href="/departure/{{ dep.number }}" class="departure-link">
        <div class="departure-info">
          <span>{{ dep.direction }}</span>
          <span>{{ dep.time | date: "%H:%M" }}</span>
          <div><span class="spoor">spoor {{ dep.track }}</span></div>
          <span>{{ dep.product }}</span>
        </div>
        <img src="{{ dep.trainImage }}" alt="Train Image" class="departure-image"/>
      </a>
    </li>
```
</details>


</details>
<!-- ////////////////// -->
<details>
<summary><h2>Week 3</h2></summary>

## Doel
Deze week wil ik me vooral richten op styling zodat het er allemaal goed uit ziet voor de oplevering. 
Ik wil ook dat je als gebruiker een adres kan invullen in plaats van coördinaten om een station te vinden.

## Voortgang

### Idee
In plaats van een invoerveld voor lat en lng wil ik een invoerveld voor het adres die in de places API van NS de lat en lng op haalt en deze invoert bij de API call voor de departures.
tijdens het invullen van dit veld moeten er suggesties komen in een lijst onder het invoerveld, deze suggesties komen ook uit de places API.

### Code
Om een lat en lng uit het adres te krijgen gebruik ik de API om het adres op te zoeken en vervolgens en lat en lng op te halen uit de API.
<details>
<summary> code adres omzetten naar lat en lng </summary>

```
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
```
</details>

Om suggesties op halen doe ik elke keer dat de gebruiker de input veranderd een API call naar de places API. 
Ik maakte me hier zorgen om het maximaal aantal call dat ik kan maken naar de API maar ik kon niks vinden over een max aantal calls.
Ik ben er ook achter gekomen dat NS alleen toegang tot de API blokkeert wanneer ze zien dat je misbruik probeert te maken. Ik heb er dus toch voor gekozen om het op deze manier te doen.
<br>
<br>
Aan de clientzijde kijk ik naar input vanaf drie tekens. Daarna doe ik een oproep naar de server om suggesties op te halen elke keer dat de gebruiker een character typt.
Op de server vang ik deze query op en gebruik ik deze in de API call. de resultaten worden verander ik naar een lijst met straatnamen en staden waar die straten in zitten.
Deze stuur ik terug naar de client.
Ik heb chat GPT gebruik om code te geneneren voor het maken van de lijst van straatnamen in de backend.
<details>
<summary> code adres suggesties clientside </summary>

```
document.getElementById("adres").addEventListener("input", async function (event) {
    const query = event.target.value;

    if (query.length < 3) {
        document.getElementById("suggestions").innerHTML = ""; // Wis suggesties als de invoer te kort is
        return;
    }

    try {
        const response = await fetch(`/autosuggest?query=${query}`);
        const data = await response.json();

        const suggestionsList = document.getElementById("suggestions");
        suggestionsList.innerHTML = ""; // Wis bestaande suggesties

        data.suggestions.forEach((suggestion) => {
            const listItem = document.createElement("li");
            listItem.innerText = suggestion.label;
            listItem.addEventListener("click", () => {
                document.getElementById("adres").value = suggestion.label;
                suggestionsList.innerHTML = ""; // Wis suggesties na selectie
            });
            suggestionsList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Fout bij ophalen suggesties:", error);
    }
});
```
</details>
<details>
<summary> code adres suggesties serverside </summary>

```
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
```
</details>

Ik kwam er achter dat het ophalen van het dichtsbijzijnde station nu niet meer werkt omdat ik de code van station ophalen op basis van adres in dezelfde route heb geschreven.
Om dit op te lossen heb ik een apparte route gemaakt om het dichtsbijzijnde station te vinden.
<details>
<summary> code dichtsbijzinde station vinden route</summary>

```
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
```
</details>

Om de lijst met suggesties onder de input te krijgen heb ik anchor positioning gebruikt.
<details>
<summary> code suggesties anchor positioning</summary>

```
.stationSearch {
    display: flex;
    background: var(--NS-geel);
    border-radius: 5px;
    align-items: center;
    padding: 1rem;

    >form { 
        display: flex;
        align-items: center;

        label {
            margin: 0 0.5rem 0 0;
        }

        input {
            anchor-name: --search;
        }
    
        button{
            background: var(--NS-blauw);
            color: white;
            padding: 1rem 0.5rem 1rem 0.5rem;
            margin: 0 0.5rem 0 0.5rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        }
    }

    >ul {
        position: absolute;
        position-anchor: --search;
        position-area: bottom span-right;
        background: white ;
        box-shadow: #232323 0 2px 5px;
        max-width: fit-content;

        li{
            display: flex;
            padding: 0.2rem 0 0.2rem 0;
            cursor: pointer;
            transition: background-color 0.3s ease-out;
            align-content: center;
        }

        li:hover {
            background: var(--hover-color);
        }
    }
}
```
</details>

Bij het testen kwam ik er achter dat als je return button gebruikt op de detail pagina om de lege versie van de homepage komt,
 en niet vanaf de pagina waar je vandaan kwam waar je het station hebt gevonden met de departures.
<br>
<br>
Om dit op te lossen heb ik aan de clientside gezegd dat de button `window.history.back();` uit voert in plaat van `href="/"`
<details>
<summary> code return button</summary>

```
  <button id="back" class="returnBtn">Terug</button>

document.getElementById('back').addEventListener('click', function() {
    window.history.back();
  });
```
</details>

deze week heb ik de styling afgemaakt voor alle onderdelen:


</details>
<!-- ////////////////// -->
<details>
<summary><h2>Week 4</h2></summary>

### Doel

### Voortgang

</details>
