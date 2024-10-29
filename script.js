const map = L.map('map').setView([51.505, -0.09], 13);  // Set initial view to a central location

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let popupForm = document.getElementById("popup-form");
let remarkInput = document.getElementById("remarks");
let pinList = document.getElementById("pin-list");
let currentMarker = null;

let savedPins = JSON.parse(localStorage.getItem("pins")) || [];

savedPins.forEach(pin => addPinToMap(pin));

// Map click event to drop a pin and open the popup form
map.on('click', (e) => {
    openPopupForm(e.latlng);
});

function openPopupForm(latlng) {
    popupForm.style.display = 'block';
    remarkInput.value = '';  // Clear previous remark
    currentMarker = L.marker(latlng).addTo(map);  // Add temporary marker on map
}

document.getElementById("save-pin").addEventListener("click", async () => {
    const remark = remarkInput.value;
    const latlng = currentMarker.getLatLng();
    const address = await fetchAddress(latlng);

    const pin = {
        id: Date.now(),
        lat: latlng.lat,
        lng: latlng.lng,
        remark: remark,
        address: address
    };

    savedPins.push(pin);
    localStorage.setItem("pins", JSON.stringify(savedPins));
    addPinToMap(pin);
    closePopupForm();
});

document.getElementById("cancel-pin").addEventListener("click", closePopupForm);

function closePopupForm() {
    popupForm.style.display = 'none';
    if (currentMarker) map.removeLayer(currentMarker);  // Remove temporary marker
    currentMarker = null;
}

async function fetchAddress(latlng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.display_name || "Unknown location";
    } catch (error) {
        console.error("Error fetching address:", error);
        return "Unknown location";
    }
}

function addPinToMap(pin) {
    const marker = L.marker([pin.lat, pin.lng]).addTo(map)
        .bindPopup(`<b>Remark:</b> ${pin.remark}<br><b>Address:</b> ${pin.address}`)
        .on('click', () => map.setView([pin.lat, pin.lng], 13));

    const listItem = document.createElement("li");
    listItem.className = "pin-item";
    listItem.innerHTML = `
        <span>${pin.remark} - ${pin.address}</span>
        <button class="delete-pin" data-id="${pin.id}">Delete</button>
    `;

    listItem.querySelector('.delete-pin').addEventListener('click', () => {
        deletePin(pin.id, marker, listItem);
    });

    listItem.addEventListener("click", () => {
        map.setView([pin.lat, pin.lng], 13);
        marker.openPopup();
    });

    pinList.appendChild(listItem);
}

function deletePin(id, marker, listItem) {
    map.removeLayer(marker);
    
    pinList.removeChild(listItem);

    savedPins = savedPins.filter(pin => pin.id !== id);
    localStorage.setItem("pins", JSON.stringify(savedPins));
}
