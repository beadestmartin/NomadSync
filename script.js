/* ==========================================================
   NomadSync - Script Complet Corrigé & Multilingue (FR, EN, DE, ES)
   Inclut :
   - Correction syntaxique de loadSpots() (zéro erreur d'analyse)
   - Mode VIP / Visiteur avec dodos sauvages grisés et vert forêt profond (#145A32) + icône tente/sapin (🏕️)
   - Traduction complète dynamique (popups, catégories, libellés, alertes)
   ========================================================== */

const translations = {
    fr: {
        free: "Gratuit",
        priceLabel: "Prix :",
        stayLabel: "Séjour max :",
        exchangeLabel: "Échange :",
        elecLabel: "Électricité :",
        vipTitle: "Dodo secret — Réservé VIP",
        vipPreservation: "🌿 Espace Préservation & Discrétion<br>Ce spot secret est restreint pour préserver la quiétude des lieux, éviter la surfréquentation et protéger la nature.",
        vipUnlockBtn: "🔓 Débloquer ce spot",
        vipAlert: "Passez membre VIP pour débloquer les coordonnées GPS et les infos complètes !",
        categoryWild: "Spot sauvage",
        categoryWater: "Point d'eau",
        categoryDrain: "Aire de vidange",
        categoryParking: "Parking",
        categoryNature: "Nature / Nuit",
        categoryFarm: "Ferme",
        categoryFuel: "Carburant",
        aire: "Aire de stationnement"
    },
    en: {
        free: "Free",
        priceLabel: "Price:",
        stayLabel: "Max stay:",
        exchangeLabel: "Exchange:",
        elecLabel: "Electricity:",
        vipTitle: "Secret Spot — VIP Only",
        vipPreservation: "🌿 Preservation & Discretion Area<br>This secret spot is restricted to preserve peace, avoid overcrowding, and protect nature.",
        vipUnlockBtn: "🔓 Unlock this spot",
        vipAlert: "Become a VIP member to unlock GPS coordinates and full info!",
        categoryWild: "Wild spot",
        categoryWater: "Water point",
        categoryDrain: "Dump station",
        categoryParking: "Parking",
        categoryNature: "Nature / Night",
        categoryFarm: "Farm",
        categoryFuel: "Fuel",
        aire: "Parking area"
    },
    de: {
        free: "Kostenlos",
        priceLabel: "Preis:",
        stayLabel: "Max. Aufenthalt:",
        exchangeLabel: "Austausch:",
        elecLabel: "Strom:",
        vipTitle: "Geheimer Stellplatz — Nur VIP",
        vipPreservation: "🌿 Schutz & Diskretion<br>Dieser geheime Platz ist beschränkt, um die Ruhe zu bewahren, Übervölkerung zu vermeiden und die Natur zu schützen.",
        vipUnlockBtn: "🔓 Diesen Platz freischalten",
        vipAlert: "Werden Sie VIP-Mitglied, um GPS-Koordinaten und vollständige Infos freizuschalten!",
        categoryWild: "Wilder Stellplatz",
        categoryWater: "Wasserstelle",
        categoryDrain: "Entsorgung",
        categoryParking: "Parkplatz",
        categoryNature: "Natur / Nacht",
        categoryFarm: "Bauernhof",
        categoryFuel: "Kraftstoff",
        aire: "Wohnmobil-Stellplatz"
    },
    es: {
        free: "Gratis",
        priceLabel: "Precio:",
        stayLabel: "Estancia máx.:",
        exchangeLabel: "Intercambio:",
        elecLabel: "Electricidad:",
        vipTitle: "Lugar secreto — Exclusivo VIP",
        vipPreservation: "🌿 Área de Conservación y Discreción<br>Este lugar secreto está restringido para preservar la tranquilidad, evitar la masificación y proteger la naturaleza.",
        vipUnlockBtn: "🔓 Desbloquear este lugar",
        vipAlert: "¡Hazte miembro VIP para desbloquear las coordenadas GPS y la información completa!",
        categoryWild: "Lugar salvaje",
        categoryWater: "Punto de agua",
        categoryDrain: "Área de vaciado",
        categoryParking: "Aparcamiento",
        categoryNature: "Naturaleza / Noche",
        categoryFarm: "Granja",
        categoryFuel: "Carburante",
        aire: "Área de autocaravanas"
    }
};

// Fonction globale pour obtenir la catégorie normalisée d'un spot
function getSpotCategory(spot) {
    if (!spot) return 'unknown';
    const cat = (spot.category || spot.type || '').toLowerCase();
    if (cat.includes('eau') || cat.includes('water')) return 'water';
    if (cat.includes('vidange') || cat.includes('drain') || cat.includes('service')) return 'drain';
    if (cat.includes('aire') || cat.includes('stationnement')) return 'aire';
    if (cat.includes('parking') || cat.includes('park')) return 'parking';
    if (cat.includes('sauvage') || cat.includes('wild') || spot.vip === true) return 'wild';
    if (cat.includes('nature') || cat.includes('nuit')) return 'nature';
    if (cat.includes('ferme') || cat.includes('farm')) return 'farm';
    if (cat.includes('carburant') || cat.includes('fuel') || cat.includes('station')) return 'fuel';
    return cat || 'aire';
}

// Fonction principale de chargement et d'affichage des spots sur la carte Leaflet
function loadSpots() {
    if (!typeof leafletMap !== 'undefined' && !leafletMap) return;

    if (typeof markersGroup === 'undefined' || !markersGroup) {
        markersGroup = L.layerGroup().addTo(leafletMap);
    }
    markersGroup.clearLayers();

    const activeFilter = window.activeSpotFilter && window.activeSpotFilter !== 'all' 
        ? window.activeSpotFilter 
        : (document.getElementById('servicesFilter') ? document.getElementById('servicesFilter').value : 'all');

    const localSpots = JSON.parse(localStorage.getItem('nomadSyncSpots')) || [];
    const langKey = (typeof currentLang !== 'undefined' && translations[currentLang]) ? currentLang : 'fr';
    const t = translations[langKey];
    const userIsVip = localStorage.getItem('nomadSyncVip') === 'true';
    
    const allDisplaySpots = [
        ...(typeof spots !== 'undefined' ? spots : []), 
        ...(typeof rawWaterPoints !== 'undefined' ? rawWaterPoints : []), 
        ...(typeof rawWastePoints !== 'undefined' ? rawWastePoints : []), 
        ...localSpots
    ];

    for (const spot of allDisplaySpots) {
        const lat = spot.lat;
        const lng = spot.lng || spot.lon;
        if (!lat || !lng) continue;

        // Filtre géographique strict (Europe)
        if (lat < 35 || lat > 60 || lng < -10 || lng > 20) continue;

        const spotCat = getSpotCategory(spot);

        if (activeFilter && activeFilter !== 'all') {
            let matches = false;
            if (activeFilter === 'eau' || activeFilter === 'water') {
                matches = (spotCat === 'water');
            } else if (activeFilter === 'vidange' || activeFilter === 'drain') {
                matches = (spotCat === 'drain');
            } else if (activeFilter === 'aire' || activeFilter === 'aire_stationnement') {
                matches = (spotCat === 'aire');
            } else if (activeFilter === 'parking' || activeFilter === 'park') {
                matches = (spotCat === 'parking');
            } else if (activeFilter === 'sauvage' || activeFilter === 'wild') {
                matches = (spotCat === 'wild');
            } else if (activeFilter === 'nature') {
                matches = (spotCat === 'nature');
            } else if (activeFilter === 'ferme' || activeFilter === 'farm') {
                matches = (spotCat === 'farm');
            } else if (activeFilter === 'carburant' || activeFilter === 'fuel') {
                matches = (spotCat === 'fuel');
            } else {
                matches = (spotCat === activeFilter);
            }
            if (!matches) continue;
        }

        const isWildSpot = (spotCat === 'wild' || spot.vip === true);
        const isLocked = isWildSpot && !userIsVip;

        let markerColor = '#D4621A';
        let emoji = spot.icon || '🚐';

        if (isWildSpot) {
            if (userIsVip) {
                markerColor = '#145A32'; // Vert forêt profond VIP débloqué
                emoji = '🏕️';
            } else {
                markerColor = '#7F8C8D'; // Gris verrouillé
                emoji = '🔒';
            }
        }
        else if (spotCat === 'fuel') { markerColor = '#FF4500'; emoji = '⛽'; }
        else if (spotCat === 'water') { markerColor = '#1E90FF'; emoji = '💧'; }
        else if (spotCat === 'drain') { markerColor = '#8B4513'; emoji = '🚰'; }
        else if (spotCat === 'parking') { markerColor = '#555555'; emoji = '🅿️'; }
        else if (spotCat === 'nature') { markerColor = '#2A1A0E'; emoji = '🌙'; }
        else if (spotCat === 'farm') { markerColor = '#228B22'; emoji = '🚜'; }

        const opacityStyle = isLocked ? 'opacity: 0.85;' : '';
        const markerHtml = '<div style="background-color: ' + markerColor + '; color: white; padding: 5px; border-radius: 50%; text-align: center; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); ' + opacityStyle + '">' + emoji + '</div>';

        const customIcon = L.divIcon({
            className: 'nomadsync-custom-marker',
            html: markerHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const gmapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
        const wazeUrl = 'https://www.waze.com/ul?ll=' + lat + ',' + lng + '&navigate=yes';
        const priceDisplay = (!spot.price || spot.price.toLowerCase() === 'gratuit') ? t.free : spot.price;

        let popupContent = '<div style="font-family: sans-serif; max-width: 240px;">';
        popupContent += '<h4 style="margin: 0 0 5px 0; color: #2A1A0E;">' + (spot.name || 'Lieu') + '</h4>';

        if (isLocked) {
            popupContent += '<span style="font-size: 0.85em; background: #ffeeba; color: #856404; padding: 2px 6px; border-radius: 4px;">🔒 ' + t.vipTitle + '</span><br>';
            popupContent += '<p style="margin: 10px 0; font-size: 12px; color: #856404; background: #fff3cd; padding: 8px; border-radius: 4px; line-height: 1.4;">' + t.vipPreservation + '</p>';
            popupContent += '<button onclick="alert('' + t.vipAlert + '')" style="width: 100%; background: #145A32; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold;">' + t.vipUnlockBtn + '</button>';
        } else {
            const catLabel = t['category' + spotCat.charAt(0).toUpperCase() + spotCat.slice(1)] || spot.category || spot.type || 'aire';
            popupContent += '<span style="font-size: 0.85em; background: #eee; color: #333; padding: 2px 6px; border-radius: 4px;">' + catLabel + '</span><br>';
            popupContent += '<p style="margin: 5px 0; font-size: 12px; color: #666;">📍 ' + (spot.address || '') + '</p>';
            if (spot.description) {
                popupContent += '<p style="margin: 5px 0; font-size: 12px; color: #333;">' + spot.description + '</p>';
            }
            popupContent += '<p style="margin: 3px 0; font-size: 12px;"><strong>' + t.priceLabel + '</strong> ' + priceDisplay + '</p>';
            popupContent += '<p style="margin: 3px 0; font-size: 12px;"><strong>' + t.stayLabel + '</strong> ' + (spot.stay || 'N/A') + '</p>';
            if (spot.exchange) {
                popupContent += '<p style="margin: 3px 0; font-size: 12px;"><strong>' + t.exchangeLabel + '</strong> ' + spot.exchange + '</p>';
            }
            if (spot.electricity) {
                popupContent += '<p style="margin: 3px 0; font-size: 12px;"><strong>' + t.elecLabel + '</strong> ' + spot.electricity + '</p>';
            }
            popupContent += '<div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">';
            popupContent += '<a href="' + gmapsUrl + '" target="_blank" style="background: #4285F4; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 0.9em;">🗺️ Google Maps</a>';
            popupContent += '<a href="' + wazeUrl + '" target="_blank" style="background: #33ccff; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 0.9em;">🚗 Waze</a>';
            popupContent += '</div>';
        }
        popupContent += '</div>';

        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
    }
}

// Fonction pour appliquer les traductions sur toute l'interface (en plus du bandeau)
function applyTranslations(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    const t = translations[lang];

    // Mettre à jour les éléments de l'interface par attributs data-i18n ou sélecteurs
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Recharger la carte pour mettre à jour les popups dans la nouvelle langue
    if (typeof loadSpots === 'function') {
        loadSpots();
    }
}
