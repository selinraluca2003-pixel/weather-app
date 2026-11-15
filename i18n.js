// ----- Languages (English / Romanian) and time formatting -----

const TEXT = {
  en: {
    // Page and menu
    home: "Home", tabToday: "Today", tab48: "48 hours", tab14: "14 days", radar: "Radar",
    todayTitle: "Today", next48: "Next 48 hours", forecast14: "14-day forecast", next24: "Next 24 hours",
    settings: "Settings", back: "‹ Back", earlier: "‹ Earlier", later: "Later ›",
    prevDay: "‹ Previous day", nextDay: "Next day ›", hourByHour: "Hour by hour",
    // Home
    searchPlaceholder: "Search for a city...", search: "Search", useLocation: "Use my location",
    saveCity: "Save city", feelsLike: "Feels like", humidity: "Humidity", wind: "Wind",
    favorites: "Favorite cities", moreDetails: "More details", airQuality: "Air quality",
    chanceOfRain: "💧 {p}% chance of rain", feelsShort: "feels {t}°", now: "Now", today: "Today",
    todayLower: "today", tomorrowLower: "tomorrow", unknown: "Unknown",
    tapStar: "Tap ☆ next to a city to save it here.", unavailable: "Unavailable",
    moveCity: "Drag to reorder {city}", removeCity: "Remove {city}", highLow: "↑{max}° ↓{min}°",
    couldNotLoad: "Could not load weather", cityNotFound: "City not found", searchFailed: "Search failed",
    noCities: "No cities found",
    updated: "Updated {time} · ↻ Refresh", updating: "Updating…", updateFailed: "Update failed · ↻ Try again",
    offlineBanner: "You're offline. Showing weather from {time}.",
    staleBanner: "Couldn't update. Showing weather from {time}.",
    loadFailedBanner: "Couldn't load the weather. Check your connection.", retry: "Try again",
    noGeo: "Your browser doesn't support location.", findingLocation: "Finding your location…",
    geoDenied: "Location permission was denied. You can allow it in the browser's site settings.",
    geoFailed: "Couldn't find your location. Try again, or search for a city.", myLocation: "My location",
    pullRefresh: "Pull to refresh", releaseRefresh: "Release to refresh",
    toggleDark: "Toggle dark mode", unitsAria: "Switch between Celsius and Fahrenheit",
    // Details
    uvIndex: "UV index", uvPeak: "{label} · peak {n} today",
    uvLow: "Low", uvModerate: "Moderate", uvHigh: "High", uvVeryHigh: "Very high", uvExtreme: "Extreme",
    pressure: "Pressure", seaLevel: "Sea level", visibility: "Visibility",
    visClear: "Clear", visModerate: "Moderate", visPoor: "Poor", visVeryPoor: "Very poor (fog)",
    dewPoint: "Dew point", dewDry: "Dry", dewComfortable: "Comfortable", dewSlightly: "Slightly humid",
    dewHumid: "Humid", dewOppressive: "Oppressive",
    cloudCover: "Cloud cover", cloudsClear: "Mostly clear", cloudsPartly: "Partly cloudy", cloudsOvercast: "Overcast",
    windFrom: "Wind from", gusts: "Gusts {n} {u}", speedGusts: "{s} {u} · gusts {g}",
    sunriseSunset: "Sunrise · Sunset", daylight: "{d} of daylight", duration: "{h}h {m}m",
    moon: "Moon", rainChance: "Rain chance", rainAmount: "Rain amount",
    moonNames: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
    compass: ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"],
    // Day page
    dayHiLo: "High {max}° · Low {min}°", rain: "Rain", dayRainSub: "{p}% chance · {h} h of rain",
    dayWindSub: "From {dir} · gusts {g}", sunshine: "Sunshine", sunshineSub: "{pct}% of daylight",
    dayFeelsValue: "{max}° / {min}°", dayFeelsSub: "Highest / lowest",
    // Alerts
    forecastBased: "Forecast-based, not an official warning", strongGusts: "Strong wind gusts",
    gustsText: "Gusts up to {v} expected around {when}.", stormText: "Possible from {when}.",
    heavyRain: "Heavy rain", rainText: "About {mm} mm of rain expected {when}.",
    extremeHeat: "Extreme heat", heatText: "High of {t}° expected {when}.",
    severeCold: "Severe cold", coldText: "Low of {t}° expected {when}.",
    noAlerts: "No weather alerts", officialSource: "Official warnings: WMO via LibreWXR ·",
    officialUnavailable: "Official warnings unavailable right now. Check",
    officialWarning: "Official warning", weatherWarning: "Weather warning",
    // Air quality
    aqiGood: "Good", aqiFair: "Fair", aqiModerate: "Moderate", aqiPoor: "Poor", aqiVeryPoor: "Very poor", aqiExtreme: "Extremely poor",
    adviceGood: "A great time to be outside.", adviceFair: "Fine for most people.",
    adviceModerate: "Sensitive people may want to limit long outdoor effort.",
    advicePoor: "Consider shorter outdoor activity, especially if you're sensitive.",
    adviceVeryPoor: "Limit time outdoors, especially children and people with breathing problems.",
    adviceExtreme: "Avoid strenuous outdoor activity.",
    fineParticles: "µg/m³ · fine particles", coarseParticles: "µg/m³ · coarse particles",
    ozone: "Ozone (O₃)", no2: "Nitrogen dioxide", no2Sub: "µg/m³ · traffic, industry",
    so2: "Sulphur dioxide", dust: "Dust", dustSub: "µg/m³ · e.g. Saharan dust",
    pollutants: "Pollutants", pollenTitle: "Pollen (grains/m³)",
    pollenNames: { alder: "Alder", birch: "Birch", grass: "Grass", mugwort: "Mugwort", olive: "Olive", ragweed: "Ragweed" },
    pollenLow: "Low", pollenModerate: "Moderate", pollenHigh: "High", pollenVeryHigh: "Very high",
    noPollen: "No pollen detected right now", pollenNA: "Pollen data isn't available for this location.",
    europeanAqi: "European AQI", airCredit: "Air quality data:", via: "via",
    airLoading: "Loading air quality…", airNA: "Air quality data isn't available for this location.",
    airUnavailable: "Air quality is unavailable right now.",
    // Charts, rain, radar
    chartNow: "Now {t}° · feels {f}°", temperature: "Temperature", chartAria: "Temperature and feels-like chart",
    rainNext12: "Chance of rain, next 12 hours",
    rainForHours: "Rain for at least the next 2 hours", rainEasing: "Raining now, easing in about {m} min",
    noRain2h: "No rain expected in the next 2 hours", rainStarting: "Rain starting in about {m} min",
    rainSub: "{mm} mm expected in 2 h · 15-minute estimate",
    radarNote: "Past 2 hours of rain radar · Radar by", radarUnavailable: "Radar unavailable",
    radarAgo: "{clock} ({n} min ago)", loading: "Loading…", playPause: "Play or pause",
    // Settings page
    language: "Language", theme: "Theme", themeAuto: "Automatic", themeLight: "Light", themeDark: "Dark",
    units: "Units", clock: "Time format", clock24: "24-hour", clock12: "12-hour",
    startCity: "Start city", startLast: "Last city I viewed", startFixed: "Always open {city}",
    startHint: "To pick a different start city, open it first, then come back here.",
    motion: "Animations", motionHint: "Rain and snow effects, moving icons", on: "On", off: "Off",
    about: "About", aboutText: "Weather data by Open-Meteo. Radar by RainViewer. Place names by BigDataCloud.",
    // ---- Round 2 ----
    vsWarmer: "{n}° warmer than yesterday", vsColder: "{n}° colder than yesterday", vsSame: "About the same as yesterday",
    normalTitle: "Normal for today", normalLabel: "Normal", aboveNormal: "{n}° above normal", belowNormal: "{n}° below normal",
    nearNormal: "close to normal", forecastVsNormal: "Forecast {max}° / {min}° · {diff}",
    recordsTitle: "Records for this date", recordHigh: "Highest {t}° ({y})", recordLow: "Lowest {t}° ({y})",
    climateSource: "1991–2020 average · records since 1940 (ERA5)",
    share: "Share", shareTitle: "Weather in {city}", shareText: "{city}: {t}°, {cond}", shareSaved: "Image saved to your downloads",
    sunMoon: "Sun & moon", sunrise: "Sunrise", sunset: "Sunset", moonrise: "Moonrise", moonset: "Moonset",
    goldenHour: "Golden hour", goldenMorning: "Morning {a} – {b}", goldenEvening: "Evening {a} – {b}",
    daylightLeft: "{d} of daylight left", sunriseIn: "Sunrise in {d}", sunDown: "The sun has set",
    sRainNowUntil: "Rain until about {time}.", sRainNowLong: "Rain for the next several hours.",
    sRainFrom: "Rain likely from {time}.", sRainFromTo: "Rain likely from {from} to {to}.",
    sSnowFrom: "Snow likely from {time}.", sStorm: "Thunderstorms possible around {time}.",
    sDry: "Dry for the next 24 hours.", sClearTonight: "Clear skies tonight.", sCloudy: "Mostly cloudy.", sSunny: "Mostly sunny.",
    sWarmerTomorrow: "Warmer tomorrow, up to {t}°.", sColderTomorrow: "Colder tomorrow, up to {t}°.",
    sSimilarTomorrow: "Similar tomorrow, up to {t}°.", sWindy: "Windy, with gusts up to {v}.", sFog: "Fog around {time}.",
    activities: "Activities", actRestOfToday: "Rest of today", actTomorrow: "Tomorrow", actTonight: "Tonight",
    running: "Running", cycling: "Cycling", laundry: "Drying laundry", outdoors: "Outdoors & picnic",
    driving: "Driving", stargazing: "Stargazing", wear: "What to wear",
    great: "Great", good: "Good", fair: "Fair", poor: "Poor",
    rCold: "too cold", rHot: "too hot", rRain: "rain likely", rWind: "strong wind", rHumid: "damp air", rClouds: "cloudy",
    rIce: "risk of ice", rFog: "fog", rSnow: "snow", rHeavyRain: "heavy rain", rAir: "poor air quality",
    rMoon: "bright moon", rIdeal: "ideal conditions", rFine: "no problems expected", rDark: "short daylight",
    wearWinter: "Winter coat, hat and gloves", wearWarm: "Warm coat", wearJacket: "Light jacket",
    wearLayer: "Long sleeves or a light layer", wearTshirt: "T-shirt weather", wearUmbrella: "take an umbrella",
    wearSun: "sunglasses and sunscreen",
    metricHigh: "Highest {v}", metricLow: "Lowest {v}", metricGusts: "Gusts", metricSpeed: "Speed",
    metricAmount: "Amount (mm)", metricChance: "Chance",
    exUV: "The UV index measures how strong the sun's burning rays are. From 3 up, use sunscreen around midday; from 8 up, avoid the midday sun.",
    exPressure: "Falling pressure often means clouds and rain are on the way. Rising pressure usually brings calmer, drier weather.",
    exVisibility: "How far you can see clearly. Fog, heavy rain, snow and haze lower it.",
    exDew: "The dew point shows how humid the air feels. Below 10° feels dry, above 18° feels sticky.",
    exClouds: "How much of the sky is covered by clouds.",
    exWind: "Average wind speed (solid line) and gusts, the strongest short bursts (dashed line).",
    exHumidity: "How close the air is to holding all the water it can. High humidity feels muggy when it's warm and raw when it's cold.",
    exFeels: "The temperature as your body feels it, combining the real temperature (dashed line), wind and humidity.",
    exRain: "Bars show the chance of rain for each hour. The line shows the expected amount in millimetres.",
    compareModels: "Compare forecast models", modelsTitle: "Forecast models",
    modelsIntro: "Three of the world's main weather models. When they agree, the forecast is more certain.",
    agreement: "Agreement", agreeHigh: "High", agreeMedium: "Medium", agreeLow: "Low",
    modelsAll: "The models agree well for the whole week.",
    modelsUntil: "The models agree well until {day}. After that, the forecast is less certain.",
    modelsNone: "The models disagree, so this forecast is uncertain.",
    modelsHighs: "Daily highs", modelsUnavailable: "Model comparison is unavailable right now.",
    sea: "Sea", waterTemp: "Water temperature", waves: "Waves", wavesFrom: "from {dir}", wavePeriod: "Wave period",
    wavePeriodSub: "seconds between waves", maxWaves: "Highest waves", maxWavesSub: "next 3 days",
    seaNote: "Sea data from Open-Meteo Marine. Not for navigation.",
    snow: "Snow", snowDepth: "Snow depth", snowDepthSub: "on the ground now", newSnow: "New snow", newSnowSub: "next 7 days",
    freezingLevel: "Freezing level", freezingSub: "height where it's 0 °C", elevation: "Elevation", elevationSub: "of this place",
    layerRain: "Rain", layerWind: "Wind", layerTemp: "Temperature", mapLoading: "Loading map data…",
    mapUnavailable: "Map data unavailable right now", mapNote: "Current Open-Meteo forecast, refreshed as you move the map",
  },

  ro: {
    home: "Acasă", tabToday: "Azi", tab48: "48 de ore", tab14: "14 zile", radar: "Radar",
    todayTitle: "Astăzi", next48: "Următoarele 48 de ore", forecast14: "Prognoza pe 14 zile", next24: "Următoarele 24 de ore",
    settings: "Setări", back: "‹ Înapoi", earlier: "‹ Mai devreme", later: "Mai târziu ›",
    prevDay: "‹ Ziua anterioară", nextDay: "Ziua următoare ›", hourByHour: "Oră cu oră",
    searchPlaceholder: "Caută un oraș...", search: "Caută", useLocation: "Folosește locația mea",
    saveCity: "Salvează orașul", feelsLike: "Resimțită", humidity: "Umiditate", wind: "Vânt",
    favorites: "Orașe favorite", moreDetails: "Mai multe detalii", airQuality: "Calitatea aerului",
    chanceOfRain: "💧 {p}% șanse de ploaie", feelsShort: "resimțit {t}°", now: "Acum", today: "Azi",
    todayLower: "azi", tomorrowLower: "mâine", unknown: "Necunoscut",
    tapStar: "Apasă ☆ de lângă un oraș ca să-l salvezi aici.", unavailable: "Indisponibil",
    moveCity: "Trage pentru a muta {city}", removeCity: "Șterge {city}", highLow: "↑{max}° ↓{min}°",
    couldNotLoad: "Vremea nu a putut fi încărcată", cityNotFound: "Orașul nu a fost găsit", searchFailed: "Căutarea a eșuat",
    noCities: "Niciun oraș găsit",
    updated: "Actualizat la {time} · ↻ Reîmprospătează", updating: "Se actualizează…",
    updateFailed: "Actualizare eșuată · ↻ Reîncearcă",
    offlineBanner: "Ești offline. Se afișează vremea de la {time}.",
    staleBanner: "Actualizarea a eșuat. Se afișează vremea de la {time}.",
    loadFailedBanner: "Vremea nu a putut fi încărcată. Verifică conexiunea.", retry: "Reîncearcă",
    noGeo: "Browserul tău nu permite localizarea.", findingLocation: "Se caută locația ta…",
    geoDenied: "Permisiunea de localizare a fost refuzată. O poți permite din setările site-ului în browser.",
    geoFailed: "Locația nu a putut fi găsită. Reîncearcă sau caută un oraș.", myLocation: "Locația mea",
    pullRefresh: "Trage pentru reîmprospătare", releaseRefresh: "Eliberează pentru reîmprospătare",
    toggleDark: "Comută modul întunecat", unitsAria: "Comută între Celsius și Fahrenheit",
    uvIndex: "Indice UV", uvPeak: "{label} · maxim {n} azi",
    uvLow: "Scăzut", uvModerate: "Moderat", uvHigh: "Ridicat", uvVeryHigh: "Foarte ridicat", uvExtreme: "Extrem",
    pressure: "Presiune", seaLevel: "La nivelul mării", visibility: "Vizibilitate",
    visClear: "Bună", visModerate: "Moderată", visPoor: "Slabă", visVeryPoor: "Foarte slabă (ceață)",
    dewPoint: "Punct de rouă", dewDry: "Uscat", dewComfortable: "Confortabil", dewSlightly: "Ușor umed",
    dewHumid: "Umed", dewOppressive: "Apăsător",
    cloudCover: "Nebulozitate", cloudsClear: "Predominant senin", cloudsPartly: "Parțial noros", cloudsOvercast: "Acoperit",
    windFrom: "Vânt dinspre", gusts: "Rafale {n} {u}", speedGusts: "{s} {u} · rafale {g}",
    sunriseSunset: "Răsărit · Apus", daylight: "{d} de lumină", duration: "{h} h {m} min",
    moon: "Luna", rainChance: "Șanse de ploaie", rainAmount: "Cantitate de ploaie",
    moonNames: ["Lună nouă", "Semilună în creștere", "Primul pătrar", "Lună gibboasă în creștere", "Lună plină", "Lună gibboasă în descreștere", "Ultimul pătrar", "Semilună în descreștere"],
    compass: ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSV", "SV", "VSV", "V", "VNV", "NV", "NNV"],
    dayHiLo: "Max. {max}° · Min. {min}°", rain: "Ploaie", dayRainSub: "{p}% șanse · {h} h de ploaie",
    dayWindSub: "Dinspre {dir} · rafale {g}", sunshine: "Soare", sunshineSub: "{pct}% din durata zilei",
    dayFeelsValue: "{max}° / {min}°", dayFeelsSub: "Maximă / minimă",
    forecastBased: "Pe baza prognozei, nu este o avertizare oficială", strongGusts: "Rafale puternice de vânt",
    gustsText: "Rafale de până la {v}, {when}.", stormText: "Posibilă de la {when}.",
    heavyRain: "Ploi abundente", rainText: "Aproximativ {mm} mm de ploaie {when}.",
    extremeHeat: "Caniculă", heatText: "Maxima de {t}° {when}.",
    severeCold: "Ger", coldText: "Minima de {t}° {when}.",
    noAlerts: "Nicio avertizare meteo", officialSource: "Avertizări oficiale: WMO prin LibreWXR ·",
    officialUnavailable: "Avertizările oficiale nu sunt disponibile acum. Verifică",
    officialWarning: "Avertizare oficială", weatherWarning: "Avertizare meteo",
    aqiGood: "Bună", aqiFair: "Acceptabilă", aqiModerate: "Moderată", aqiPoor: "Slabă", aqiVeryPoor: "Foarte slabă", aqiExtreme: "Extrem de slabă",
    adviceGood: "Un moment foarte bun pentru a ieși afară.", adviceFair: "În regulă pentru majoritatea oamenilor.",
    adviceModerate: "Persoanele sensibile ar putea evita efortul prelungit afară.",
    advicePoor: "Scurtează activitățile în aer liber, mai ales dacă ești sensibil.",
    adviceVeryPoor: "Limitează timpul petrecut afară, mai ales copiii și persoanele cu probleme respiratorii.",
    adviceExtreme: "Evită efortul intens în aer liber.",
    fineParticles: "µg/m³ · particule fine", coarseParticles: "µg/m³ · particule grosiere",
    ozone: "Ozon (O₃)", no2: "Dioxid de azot", no2Sub: "µg/m³ · trafic, industrie",
    so2: "Dioxid de sulf", dust: "Praf", dustSub: "µg/m³ · de ex. praf saharian",
    pollutants: "Poluanți", pollenTitle: "Polen (granule/m³)",
    pollenNames: { alder: "Arin", birch: "Mesteacăn", grass: "Graminee", mugwort: "Pelin", olive: "Măslin", ragweed: "Ambrozie" },
    pollenLow: "Scăzut", pollenModerate: "Moderat", pollenHigh: "Ridicat", pollenVeryHigh: "Foarte ridicat",
    noPollen: "Nu s-a detectat polen acum", pollenNA: "Datele despre polen nu sunt disponibile pentru această locație.",
    europeanAqi: "Indicele european AQI", airCredit: "Date despre calitatea aerului:", via: "prin",
    airLoading: "Se încarcă calitatea aerului…", airNA: "Datele despre calitatea aerului nu sunt disponibile pentru această locație.",
    airUnavailable: "Calitatea aerului nu este disponibilă acum.",
    chartNow: "Acum {t}° · resimțit {f}°", temperature: "Temperatură", chartAria: "Grafic cu temperatura reală și cea resimțită",
    rainNext12: "Șanse de ploaie, următoarele 12 ore",
    rainForHours: "Ploaie cel puțin în următoarele 2 ore", rainEasing: "Plouă acum, se oprește în circa {m} min",
    noRain2h: "Nu se așteaptă ploaie în următoarele 2 ore", rainStarting: "Începe să plouă în circa {m} min",
    rainSub: "{mm} mm estimați în 2 ore · estimare la 15 minute",
    radarNote: "Radar de precipitații, ultimele 2 ore · Radar de la", radarUnavailable: "Radarul nu este disponibil",
    radarAgo: "{clock} (acum {n} min)", loading: "Se încarcă…", playPause: "Pornește sau oprește",
    language: "Limbă", theme: "Temă", themeAuto: "Automată", themeLight: "Luminoasă", themeDark: "Întunecată",
    units: "Unități", clock: "Format oră", clock24: "24 de ore", clock12: "12 ore",
    startCity: "Orașul de pornire", startLast: "Ultimul oraș vizualizat", startFixed: "Deschide mereu {city}",
    startHint: "Ca să alegi alt oraș de pornire, deschide-l întâi, apoi revino aici.",
    motion: "Animații", motionHint: "Efecte de ploaie și ninsoare, pictograme animate", on: "Pornit", off: "Oprit",
    about: "Despre", aboutText: "Date meteo de la Open-Meteo. Radar de la RainViewer. Nume de locuri de la BigDataCloud.",
    // ---- Round 2 ----
    vsWarmer: "Cu {n}° mai cald decât ieri", vsColder: "Cu {n}° mai rece decât ieri", vsSame: "Cam la fel ca ieri",
    normalTitle: "Normal pentru azi", normalLabel: "Normal", aboveNormal: "cu {n}° peste normal", belowNormal: "cu {n}° sub normal",
    nearNormal: "aproape de normal", forecastVsNormal: "Prognoză {max}° / {min}° · {diff}",
    recordsTitle: "Recorduri pentru această dată", recordHigh: "Maxima {t}° ({y})", recordLow: "Minima {t}° ({y})",
    climateSource: "Media 1991–2020 · recorduri din 1940 (ERA5)",
    share: "Distribuie", shareTitle: "Vremea în {city}", shareText: "{city}: {t}°, {cond}", shareSaved: "Imaginea a fost salvată în descărcări",
    sunMoon: "Soare și lună", sunrise: "Răsărit", sunset: "Apus", moonrise: "Răsăritul lunii", moonset: "Apusul lunii",
    goldenHour: "Ora de aur", goldenMorning: "Dimineața {a} – {b}", goldenEvening: "Seara {a} – {b}",
    daylightLeft: "Mai sunt {d} de lumină", sunriseIn: "Răsăritul în {d}", sunDown: "Soarele a apus",
    sRainNowUntil: "Ploaie până pe la {time}.", sRainNowLong: "Ploaie în următoarele ore.",
    sRainFrom: "Probabil ploaie de la {time}.", sRainFromTo: "Probabil ploaie între {from} și {to}.",
    sSnowFrom: "Probabil ninsoare de la {time}.", sStorm: "Posibile furtuni pe la {time}.",
    sDry: "Fără precipitații în următoarele 24 de ore.", sClearTonight: "Cer senin la noapte.", sCloudy: "Predominant noros.", sSunny: "Predominant însorit.",
    sWarmerTomorrow: "Mai cald mâine, până la {t}°.", sColderTomorrow: "Mai rece mâine, maxima {t}°.",
    sSimilarTomorrow: "Asemănător mâine, până la {t}°.", sWindy: "Vânt puternic, cu rafale de până la {v}.", sFog: "Ceață pe la {time}.",
    activities: "Activități", actRestOfToday: "Restul zilei", actTomorrow: "Mâine", actTonight: "La noapte",
    running: "Alergare", cycling: "Ciclism", laundry: "Uscat rufe", outdoors: "Afară și picnic",
    driving: "Condus", stargazing: "Observat stelele", wear: "Cum să te îmbraci",
    great: "Excelent", good: "Bun", fair: "Acceptabil", poor: "Slab",
    rCold: "prea frig", rHot: "prea cald", rRain: "ploaie probabilă", rWind: "vânt puternic", rHumid: "aer umed", rClouds: "înnorat",
    rIce: "risc de polei", rFog: "ceață", rSnow: "ninsoare", rHeavyRain: "ploaie puternică", rAir: "aer poluat",
    rMoon: "lună strălucitoare", rIdeal: "condiții ideale", rFine: "fără probleme", rDark: "zi scurtă",
    wearWinter: "Geacă de iarnă, căciulă și mănuși", wearWarm: "Haină groasă", wearJacket: "Geacă subțire",
    wearLayer: "Mâneci lungi sau un strat subțire", wearTshirt: "Vreme de tricou", wearUmbrella: "ia o umbrelă",
    wearSun: "ochelari de soare și cremă",
    metricHigh: "Maxim {v}", metricLow: "Minim {v}", metricGusts: "Rafale", metricSpeed: "Viteză",
    metricAmount: "Cantitate (mm)", metricChance: "Șanse",
    exUV: "Indicele UV arată cât de puternice sunt razele soarelui. De la 3 în sus, folosește cremă la prânz; de la 8 în sus, evită soarele de la prânz.",
    exPressure: "Presiunea în scădere anunță adesea nori și ploaie. Presiunea în creștere aduce de obicei vreme mai calmă și mai uscată.",
    exVisibility: "Cât de departe poți vedea clar. Ceața, ploaia puternică, ninsoarea și pâcla o reduc.",
    exDew: "Punctul de rouă arată cât de umed se simte aerul. Sub 10° pare uscat, peste 18° pare lipicios.",
    exClouds: "Cât din cer este acoperit de nori.",
    exWind: "Viteza medie a vântului (linia continuă) și rafalele, cele mai puternice pale scurte (linia punctată).",
    exHumidity: "Cât de aproape este aerul de cantitatea maximă de apă pe care o poate ține. Umiditatea mare pare înăbușitoare la cald și pătrunzătoare la frig.",
    exFeels: "Temperatura așa cum o simte corpul, combinând temperatura reală (linia punctată), vântul și umiditatea.",
    exRain: "Barele arată șansele de ploaie pentru fiecare oră. Linia arată cantitatea estimată în milimetri.",
    compareModels: "Compară modelele de prognoză", modelsTitle: "Modele de prognoză",
    modelsIntro: "Trei dintre cele mai importante modele meteo din lume. Când sunt de acord, prognoza este mai sigură.",
    agreement: "Acord", agreeHigh: "Mare", agreeMedium: "Mediu", agreeLow: "Mic",
    modelsAll: "Modelele sunt de acord pentru toată săptămâna.",
    modelsUntil: "Modelele sunt de acord până {day}. După aceea, prognoza este mai nesigură.",
    modelsNone: "Modelele nu sunt de acord, așa că prognoza este nesigură.",
    modelsHighs: "Maxime zilnice", modelsUnavailable: "Compararea modelelor nu este disponibilă acum.",
    sea: "Mare", waterTemp: "Temperatura apei", waves: "Valuri", wavesFrom: "dinspre {dir}", wavePeriod: "Perioada valurilor",
    wavePeriodSub: "secunde între valuri", maxWaves: "Cele mai mari valuri", maxWavesSub: "următoarele 3 zile",
    seaNote: "Date despre mare de la Open-Meteo Marine. Nu se folosesc pentru navigație.",
    snow: "Zăpadă", snowDepth: "Stratul de zăpadă", snowDepthSub: "acum, la sol", newSnow: "Zăpadă nouă", newSnowSub: "următoarele 7 zile",
    freezingLevel: "Izoterma de 0 °C", freezingSub: "altitudinea la care sunt 0 °C", elevation: "Altitudine", elevationSub: "a acestui loc",
    layerRain: "Ploaie", layerWind: "Vânt", layerTemp: "Temperatură", mapLoading: "Se încarcă datele hărții…",
    mapUnavailable: "Datele hărții nu sunt disponibile acum", mapNote: "Prognoza actuală Open-Meteo, actualizată când muți harta",
  },
};

const WEATHER_TEXT = {
  en: {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Freezing fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Light freezing drizzle", 57: "Freezing drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Light freezing rain", 67: "Freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Rain showers", 81: "Heavy showers", 82: "Violent showers", 85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
  },
  ro: {
    0: "Cer senin", 1: "Predominant senin", 2: "Parțial noros", 3: "Cer acoperit", 45: "Ceață", 48: "Ceață cu chiciură",
    51: "Burniță slabă", 53: "Burniță", 55: "Burniță densă", 56: "Burniță slabă care îngheață", 57: "Burniță care îngheață",
    61: "Ploaie slabă", 63: "Ploaie", 65: "Ploaie puternică", 66: "Ploaie slabă care îngheață", 67: "Ploaie care îngheață",
    71: "Ninsoare slabă", 73: "Ninsoare", 75: "Ninsoare abundentă", 77: "Grăunțe de zăpadă",
    80: "Averse de ploaie", 81: "Averse puternice", 82: "Averse torențiale", 85: "Averse de ninsoare", 86: "Averse puternice de ninsoare",
    95: "Furtună", 96: "Furtună cu grindină", 99: "Furtună puternică cu grindină",
  },
};

// Current language: saved choice, otherwise the browser's language
let lang = store.get("lang") || ((navigator.language || "").toLowerCase().startsWith("ro") ? "ro" : "en");
if (!TEXT[lang]) lang = "en";

// t("gusts", { n: 40, u: "km/h" }) -> "Gusts 40 km/h"
function t(key, vars = {}) {
  const value = TEXT[lang][key] ?? TEXT.en[key] ?? key;
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

function weatherText(code) {
  return WEATHER_TEXT[lang][code] || WEATHER_TEXT.en[code] || t("unknown");
}

// Locale for dates: "en-GB" gives "Sat 15 Nov", "ro-RO" gives "sâm. 15 nov."
function locale() {
  return lang === "ro" ? "ro-RO" : "en-GB";
}

function setLanguage(newLang) {
  lang = newLang;
  store.set("lang", newLang);
  applyStaticText();
}

// ----- Time formatting (24-hour or 12-hour) -----
function use12h() {
  return String(store.get("clock", "24")) === "12";
}

// "duminică, 15 noiembrie" -> "Duminică, 15 noiembrie" (for headings)
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "2026-11-15T18:30" -> "18:30" or "6:30 PM"
function fmtTime(iso) {
  const hours = Number(iso.slice(11, 13));
  const minutes = iso.slice(14, 16);
  if (!use12h()) return `${String(hours).padStart(2, "0")}:${minutes}`;
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return minutes === "00" ? `${h12} ${ampm}` : `${h12}:${minutes} ${ampm}`;
}

// Short hour label for small spaces: "18" or "6p"
function fmtHourShort(iso) {
  const hours = Number(iso.slice(11, 13));
  if (!use12h()) return String(hours).padStart(2, "0");
  return `${hours % 12 || 12}${hours < 12 ? "a" : "p"}`;
}

// A real Date (like "right now") as a clock time on this device
function fmtClock(date) {
  const iso = `0000-00-00T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return fmtTime(iso);
}

// "Sat" / "sâm." from a "2026-11-15T..." or "2026-11-15" string (read as a plain calendar date)
function fmtWeekday(iso, style = "short") {
  return new Date(iso.slice(0, 10) + "T12:00").toLocaleDateString(locale(), { weekday: style });
}

// ----- Text written in index.html -----
// data-i18n="key" sets the text, data-i18n-placeholder / data-i18n-aria set those attributes
function applyStaticText() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
}
applyStaticText();
