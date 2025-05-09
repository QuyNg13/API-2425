import './index.css';

// document.getElementById("getLocation").addEventListener("click", async function() {
//     if (!navigator.geolocation) {
//         alert("Geolocatie wordt niet ondersteund door jouw browser.");
//         return;
//     }

//     navigator.geolocation.getCurrentPosition(async (position) => {
//         const lat = position.coords.latitude;
//         const lng = position.coords.longitude;

//         try {
//             const response = await fetch(`nearest-station?lat=${lat}&lng=${lng}`);
//             const data = await response.json();

//             if (data.error) {
//                 document.getElementById("stationResult").innerText = "Fout: " + data.error;
//             } else {
//                 document.getElementById("stationResult").innerText = "Dichtstbijzijnde station: " + data.station;
//             }
//         } catch (error) {
//             console.error("Fout bij ophalen station:", error);
//         }
//     }, (error) => {
//         alert("Kon locatie niet ophalen: " + error.message);
//     });
// });



// document.getElementById("getLocation").addEventListener("click", async function() {
//     if (!navigator.geolocation) {
//         alert("Geolocatie wordt niet ondersteund door jouw browser.");
//         return;
//     }

//     navigator.geolocation.getCurrentPosition(async (position) => {
//         const lat = position.coords.latitude;
//         const lng = position.coords.longitude;

//         try {
//             // Stap 1: Haal het dichtstbijzijnde station op
//             const stationResponse = await fetch(`/nearest-station?lat=${lat}&lng=${lng}`);
//             const stationData = await stationResponse.json();

//             if (stationData.error) {
//                 document.getElementById("stationResult").innerText = "Fout: " + stationData.error;
//                 return;
//             }

//             document.getElementById("stationResult").innerText = "Dichtstbijzijnde station: " + stationData.station;

//             // Stap 2: Haal de vertrektijden op met de uicCode van het station
//             const departuresResponse = await fetch(`/departures?uicCode=${stationData.uicCode}`);
//             const departuresData = await departuresResponse.json();

//             if (departuresData.error) {
//                 document.getElementById("departuresList").innerHTML = `<li>Fout: ${departuresData.error}</li>`;
//                 return;
//             }

//             // Stap 3: Toon de vertrektijden in een lijst
//             const departuresList = document.getElementById("departuresList");
//             departuresList.innerHTML = ""; // Reset lijst

//             departuresData.departures.forEach((departure) => {
//                 const listItem = document.createElement("li");
//                 listItem.innerText = `${departure.direction} - ${departure.time} - Spoor ${departure.track}`;
//                 departuresList.appendChild(listItem);
//             });

//         } catch (error) {
//             console.error("Fout bij ophalen station of vertrektijden:", error);
//         }
//     }, (error) => {
//         alert("Kon locatie niet ophalen: " + error.message);
//     });
// });
const backButton = document.getElementById('back');
if (backButton) {
    backButton.addEventListener('click', function () {
        window.history.back();
    });
}

document.getElementById("getLocation").addEventListener("click", async function () {
    if (!navigator.geolocation) {
        alert("Geolocatie wordt niet ondersteund door jouw browser.");
        return;
    }

    // Controle geolocatie permissie met permission-API
    try {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

        if (permissionStatus.state === "denied") {
            const messageElement = document.getElementById("permissionMessage");
            messageElement.innerText = "locatie is geblokkeerd. Schakel locatie in via de browserinstellingen.";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    window.location.href = `/nearest-station?lat=${lat}&lng=${lng}`;
                } catch (error) {
                    console.error("Fout bij ophalen station of vertrektijden:", error);
                }
            },
            (error) => {
                alert("Kon locatie niet ophalen: " + error.message);
            }
        );
    } catch (error) {
        console.error("Fout bij controleren van geolocatie-permissie:", error);
    }
});

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
            
            // Maak een button element
            const button = document.createElement("button");
            button.innerText = suggestion.label; //tekst in button
            button.addEventListener("click", () => {
                document.getElementById("adres").value = suggestion.label; // adres in het invoerveld
                suggestionsList.innerHTML = ""; // Wis suggesties
            });

            listItem.appendChild(button);
            suggestionsList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Fout bij ophalen suggesties:", error);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img.train-image[data-offset]").forEach(img => {
      const offset = parseFloat(img.dataset.offset);
      if (!isNaN(offset)) {
        const margin = (offset / 100) * 20; // schaal 0–20rem
        img.style.marginLeft = `${margin}rem`;
      }
    });
  });