import './index.css';

console.log('Hello, world!');

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