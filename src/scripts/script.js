// Konfigurasi Koordinat San Fransisco
const LAT = 37.7749;
const LON = -122.4194;

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

// Fungsi Mengambil Data Cuaca dari API
async function getWeatherData() {
    try {
        //Menentukan URL untuk data cuaca pada koordinat
        const pointsUrl = `https://api.weather.gov/points/${LAT},${LON}`;

        //Menunggu kurir(fetch) membawa respon dari API
        const response = await fetch(pointsUrl);

        //Jika kurir(fetching) sukses (200 OK)
        if (!response.ok) {
            throw new Error(`Gagal Cik: ${response.status}`);
        }

        //Membuka paket dari kurir (parsing JSON)
        const data = await response.json();
        console.log("Balasan Tahap 1 (Metadata):", data);

        //Mengambil link dari Forecast
        const forecastUrl = data.properties.forecast; //7-Day Forecast URL
        console.log("Link Forecast Harian:", forecastUrl);

        const forecastHourlyUrl = data.properties.forecastHourly; //Hourly Forecast URL
        console.log("Link Forecast Per Jam:", forecastHourlyUrl);
        getForecastData(forecastUrl, forecastHourlyUrl);
    } catch (error) {
        //Jika ada error akan ditangkap di sini
        console.error("Waduh bahaya nih bos, ini bos informasinya:", error);
        locationElement.innerText = "Salah ngambil data bos";
    }
}

// Menyuruh browser untuk menjalankan fungsi getWeatherData saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    getWeatherData();
});

//Fetching Data Cuaca
async function getForecastData(forecastUrl, forecastHourlyUrl) {
    try {
        //Mengambil data harian dan per-jam secara bersamaan
        const [dailyResponse, hourlyResponse] = await Promise.all([
            fetch(forecastUrl),
            fetch(forecastHourlyUrl)
        ]);

        if (!dailyResponse.ok || !hourlyResponse.ok) {
            throw new Error("Ga bisa diambil datanya bos.");
        }

        const dailyData = await dailyResponse.json();
        console.log("Data Harian:", dailyData);

        const hourlyData = await hourlyResponse.json();
        console.log("Data Per Jam:", hourlyData);

        //Rendering data
        renderCurrentWeather(hourlyData);
        renderHourlyForecast(hourlyData);
        renderDailyForecast(dailyData);
    } catch (error) {
        console.error("Error saat mengambil data forecast:", error);
    }
}

//Rendering Data ke Halaman User

//Rumus konversi Fahrenheit ke Celsius
function toCelsius(f) {
    return Math.round((f - 32) * 5 / 9);
}

function renderCurrentWeather(data) {
    const current = data.properties.periods[0]; //periods[0] adalah kondisi cuaca saat ini

    //Update Lokasi (Hero)
    locationElement.innerText = "San Francisco, CA";

    //Update Tanggal Saat Ini (Hero)
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    dateElement.innerText = new Date().toLocaleDateString("en-US", options);
    
    //Update Suhu Saat Ini (Hero)
    let tempValue = current.temperature;
    if (current.temperatureUnit === 'F') {
        tempValue = toCelsius(tempValue);
    }
    tempElement.innerHTML = `${tempValue}<span class="celsius"> °C</span>`;

    //Update Deskripsi Cuaca Saat Ini (Hero)
    weatherDescElement.innerText = current.shortForecast;

    //Update Feel Like (Hero)
   if (current.detailedForecast) {
        feelsLikeElement.innerText = `Forecast: ${current.detailedForecast}`;
    } else {
        // Fallback jika tidak ada deskripsi panjang
        feelsLikeElement.innerText = `Feels like ${tempValue}°C`; 
    }

    //Logika Ikon Cuaca Saat Ini (Hero)
    const iconClass = getWeatherIcon(current.shortForecast);

    //Bersihkan ikon sebelumnya
    weatherIconElement.innerHTML = '';

    //Elemen ikon baru
    const newIcon = document.createElement('i');
    newIcon.className = `ph ${iconClass}`;

    //Masuk ke dalam container
    weatherIconElement.appendChild(newIcon);

    //Logika Metrics Section
    //Humidity (Kelembapan)
    console.log("Cek Data Humidity:", current.relativeHumidity);

    if (current.relativeHumidity && current.relativeHumidity.value != null) {
        humidityElement.innerText = `${Math.round(current.relativeHumidity.value)}%`;
    } else {
        humidityElement.innerText = "--%";
    }

    //Wind Speed (Kecepatan Angin)
    const windMph = parseInt(current.windSpeed)

    if (!isNaN(windMph)) {
        const windKmh = Math.round(windMph * 1.60934); //Konversi mile ke km
        windSpeedElement.innerText = `${windKmh} km/h`;
    } else {
        windSpeedElement.innerText = current.windSpeed;
    }

    //Visibility (Jarak Pandang)
    visibilityElement.innerText = "10 km"; //Data Dummy
    
    //Rain Chance (Perkiraan Hujan)
    if (current.probabilityOfPrecipitation && current.probabilityOfPrecipitation.value != null) {
        pressureElement.innerText = `${current.probabilityOfPrecipitation.value}%`;
    } else {
        //Jika datanya null (biasanya artinya 0% hujan)
        pressureElement.innerText = "0%"; 
    }
}

function renderHourlyForecast(data) {
    //Mengambil data array cuaca per-jam
    const hours = data.properties.periods;

    //Mengosongkan container terlebih dahulu
    hourlyCountainer.innerHTML = '';

    //Mengambil data 7 jam ke depan
    const next7Hours = hours.slice(0, 7);

    //Looping membuat forecast card per jam
    next7Hours.forEach(hour => {
        //Mengkonversi waktu ke format jam
        const dateObj = new Date(hour.startTime);
        const timeString = dateObj.toLocaleTimeString("en-US", {
            hour: 'numeric',
            hour7: true
        });

        //Konversi Suhu
        let tempValue = hour.temperature;
        if (hour.temperatureUnit === 'F') {
            tempValue = toCelsius(tempValue);
        }

        //Menentukan ikon cuaca
        const iconClass = getWeatherIcon(hour.shortForecast);

        //Membuat elemen card per jam
        const card = document.createElement('div');

        card.innerHTML = `
            <p>${timeString}</p>
            <i class="ph ${iconClass}"></i>
            <h3>${tempValue}°C</h3>
        `;

        //Memasukkan card ke container
        hourlyCountainer.appendChild(card);
    });
}

function renderDailyForecast(data) {
    //Mengambil data periode harian
    const days = data.properties.periods;

    //Mengosongkan container terlebih dahulu
    dailyContainer.innerHTML = '';

    //Menampilkan data cuaca di siang hari saja
    const dayOnly = days.filter(period => period.isDaytime);

    //Looping membuat forecast card per hari
    dayOnly.forEach(day => {
        let tempValue = day.temperature;
        if (day.temperatureUnit === 'F') {
            tempValue = toCelsius(tempValue);
        }

        //Menentukan ikon cuaca
        const iconClass = getWeatherIcon(day.shortForecast);

        //Logic Nama Hari Normal
        const dateObj = new Date(day.startTime);
        const dayName = dateObj.toLocaleDateString("en-US", { weekday: 'long' });

        //Membuat elemen card per hari
        const card = document.createElement('div');
        card.className = 'forecast-card';

        card.innerHTML = `
            <p>${dayName}</p> 
            <i class="ph ${iconClass}"></i>
            <h3>${tempValue}°C</h3>
        `;

        //Memasukkan card ke container
        dailyContainer.appendChild(card);
    });
}

//Penyesuaian Ikon Cuaca
function getWeatherIcon(condition) {
    const text = condition.toLowerCase();

    //Cek Kata Kunci Cuaca
    if (text.includes('thunder')) return 'ph-cloud-lightning';
    if (text.includes('rain') || text.includes('drizzle')) return 'ph-cloud-rain';
    if (text.includes('snow')) return 'ph-snowflake';
    
    // "Partly Cloudy" harus dicek sebelum "Cloudy" biasa
    if (text.includes('partly') && text.includes('cloud') && text.includes('cloudy')) return 'ph-cloud-sun';
    if (text.includes('cloud') || text.includes('overcast')) return 'ph-cloud';
    
    // Jika ada kabut atau haze
    if (text.includes('fog') || text.includes('haze')) return 'ph-waves';
    if (text.includes('clear') || text.includes('sun')) return 'ph-sun';

    //Jika Cuaca Anomali
    return 'ph-thermometer';
}

// Logic Kembali Ke Atas
const backToTopBtn = document.getElementById("backToTopBtn");

if (backToTopBtn) {
    // Memantau Scroll User
    window.addEventListener("scroll", () => {
        // Jika scroll lebih dari 300px ke bawah, akan memunculkan tombol
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    });

    // Aksi Klik (Scroll ke Atas)
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth" 
        });
    });
}