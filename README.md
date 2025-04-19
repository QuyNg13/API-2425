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

### Doel

### Voortgang

</details>
<!-- ////////////////// -->
<details>
<summary><h2>Week 3</h2></summary>

### Doel

### Voortgang

</details>
<!-- ////////////////// -->
<details>
<summary><h2>Week 4</h2></summary>

### Doel

### Voortgang

</details>
