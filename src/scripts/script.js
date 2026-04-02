// Dom Selector (Berdasarkan ID)
// Header/Hero Section
const locationElement = document.getElementById("locationName");
const dateElement = document.getElementById("currentDate");
const tempElement = document.getElementById("currentTemp");
const weatherDescElement = document.getElementById("weatherSummary");
const feelsLikeElement = document.getElementById("feelsLike");
const weatherIconElement = document.getElementById("currentWeatherIcon");

// Metrics Section
const humidityElement = document.getElementById("perCentage");
const windSpeedElement = document.getElementById("speedMeter");
const pressureElement = document.getElementById("presSure");
const visibilityElement = document.getElementById("visionRange");

// Forecast Container Section
const hourlyCountainer = document.getElementById("hourlyForecastContainer");
const dailyContainer = document.getElementById("dailyForecastContainer");

// Fungsi Lokasi (Geolocation)

// Menyuruh browser untuk meminta izin lokasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    getLocation();
});

function getLocation() {
    locationElement.innerText = "Mencari lokasi...";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Jika user menekan "Allow/Izinkan"
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherDataWithCoords(lat, lon);
            },
            // Jika user menekan "Block" atau error
            (error) => {
                console.warn("Lokasi ditolak/gagal. Menggunakan lokasi default (Jakarta).");
                // Fallback ke kordinat Jakarta
                getWeatherDataWithCoords(-6.2088, 106.8456); 
            }
        );
    } else {
        alert("Browser kamu tidak mendukung geolocation.");
        getWeatherDataWithCoords(-6.2088, 106.8456); // Fallback Jakarta
    }
}

// Fungsi utama untuk mengambil data cuaca berdasarkan kordinat (latitude & longitude)

async function getWeatherDataWithCoords(lat, lon) {
    try {
        // API 1: Open-Meteo untuk data cuaca global lengkap
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max&timezone=auto`;
        
        // API 2: BigDataCloud untuk mengubah titik kordinat jadi nama Kota (Reverse Geocoding)
        const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;

        // Ambil kedua data secara bersamaan (Paralel)
        const [weatherResponse, geoResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(geoUrl)
        ]);

        if (!weatherResponse.ok) throw new Error("Gagal mengambil data cuaca");

        const weatherData = await weatherResponse.json();
        const geoData = await geoResponse.json();

        // Rendering data ke layar
        renderCurrentWeather(weatherData, geoData);
        renderHourlyForecast(weatherData);
        renderDailyForecast(weatherData);

    } catch (error) {
        console.error("Terjadi kesalahan:", error);
        locationElement.innerText = "Gagal memuat data.";
    }
}

// Fungsi untuk merender data cuaca saat ini ke dalam elemen HTML

function renderCurrentWeather(weatherData, geoData) {
    const current = weatherData.current; // Mengambil object current dari Open-Meteo
    
    // Update Lokasi (Nama Kota dari BigDataCloud)
    locationElement.innerText = geoData.city || geoData.locality || "Lokasi Tidak Diketahui";

    // Update Tanggal
    const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    dateElement.innerText = new Date().toLocaleDateString("en-US", options);
    
    // Update Suhu Saat Ini (Open-Meteo sudah default Celsius)
    tempElement.innerHTML = `${Math.round(current.temperature_2m)}<span class="celsius"> °C</span>`;

    // Logika Deskripsi & Ikon (Berdasarkan WMO Code)
    const weatherInfo = getWeatherInfo(current.weather_code);
    weatherDescElement.innerText = weatherInfo.desc;
    feelsLikeElement.innerText = `Feels like ${Math.round(current.apparent_temperature)}°C`;

    // Update Ikon Utama
    weatherIconElement.innerHTML = '';
    const newIcon = document.createElement('i');
    newIcon.className = `ph ${weatherInfo.icon}`;
    weatherIconElement.appendChild(newIcon);

    // Metrics Section
    // Humidity
    humidityElement.innerText = `${current.relative_humidity_2m}%`;
    
    // Wind Speed
    windSpeedElement.innerText = `${Math.round(current.wind_speed_10m)} km/h`;
    
    // Rain Chance (Ambil dari hourly jam saat ini)
    const currentHourIndex = new Date().getHours();
    const rainChance = weatherData.hourly.precipitation_probability[currentHourIndex];
    pressureElement.innerText = `${rainChance}%`;
    
    // Visibility (Dummy, karena API ini tidak sediakan visibilitas di paket gratisnya)
    visibilityElement.innerText = "10 km"; 
}

function renderHourlyForecast(data) {
    hourlyCountainer.innerHTML = '';

    const currentHourIndex = new Date().getHours();
    
    // 7 jam ke depan, dimulai dari jam saat ini
    for (let i = currentHourIndex; i < currentHourIndex + 7; i++) {
        const timeISO = data.hourly.time[i];
        const temp = data.hourly.temperature_2m[i];
        const weatherCode = data.hourly.weather_code[i];

        const dateObj = new Date(timeISO);
        const timeString = dateObj.toLocaleTimeString("en-US", { hour: 'numeric', hour12: true });
        const weatherInfo = getWeatherInfo(weatherCode);

        const card = document.createElement('div');
        card.innerHTML = `
            <p>${timeString}</p>
            <i class="ph ${weatherInfo.icon}"></i>
            <h3>${Math.round(temp)}°C</h3>
        `;
        hourlyCountainer.appendChild(card);
    }
}

function renderDailyForecast(data) {
    dailyContainer.innerHTML = '';

    // Open-Meteo memberikan array 7 hari
    for (let i = 0; i < 7; i++) {
        const dateISO = data.daily.time[i];
        const maxTemp = data.daily.temperature_2m_max[i];
        const weatherCode = data.daily.weather_code[i];

        const dateObj = new Date(dateISO);
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: 'long' });
        const weatherInfo = getWeatherInfo(weatherCode);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <p>${dayName}</p> 
            <i class="ph ${weatherInfo.icon}"></i>
            <h3>${Math.round(maxTemp)}°C</h3>
        `;
        dailyContainer.appendChild(card);
    }
}

// Open-Meteo menggunakan standar WMO Weather Code (Angka 0 - 99)
// Fungsi ini mengembalikan object berisi ikon dan teks deskripsi
function getWeatherInfo(code) {
    switch (code) {
        case 0: 
            return { icon: 'ph-sun', desc: 'Clear sky' };
        case 1: case 2: case 3: 
            return { icon: 'ph-cloud-sun', desc: 'Partly cloudy' };
        case 45: case 48: 
            return { icon: 'ph-cloud-fog', desc: 'Fog' }; 
        case 51: case 53: case 55: case 56: case 57:
            return { icon: 'ph-cloud-rain', desc: 'Drizzle' };
        case 61: case 63: case 65: case 66: case 67:
        case 80: case 81: case 82:
            return { icon: 'ph-cloud-rain', desc: 'Rain' };
        case 71: case 73: case 75: case 77:
        case 85: case 86:
            return { icon: 'ph-snowflake', desc: 'Snow' };
        case 95: case 96: case 99:
            return { icon: 'ph-cloud-lightning', desc: 'Thunderstorm' };
        default: 
            return { icon: 'ph-thermometer', desc: 'Unknown' };
    }
}

// Logic Kembali Ke Atas
const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}