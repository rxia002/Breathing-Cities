// Initial pollution dataset for UK cities
let pollutionData = [
  { name: "London Westminster", pm25: 38, no2: 52, so2: 5, x: 150, y: 200, size: 45, targetPM25: 38 },
  { name: "London Camden", pm25: 45, no2: 58, so2: 7, x: 250, y: 250, size: 50, targetPM25: 45 },
  { name: "Manchester City Centre", pm25: 52, no2: 65, so2: 6, x: 400, y: 180, size: 55, targetPM25: 52 },
  { name: "Birmingham Bull Ring", pm25: 48, no2: 60, so2: 8, x: 500, y: 280, size: 52, targetPM25: 48 },
  { name: "Liverpool Waterfront", pm25: 35, no2: 48, so2: 4, x: 300, y: 400, size: 42, targetPM25: 35 },
  { name: "Edinburgh Old Town", pm25: 28, no2: 42, so2: 3, x: 550, y: 420, size: 38, targetPM25: 28 },
  { name: "Glasgow City Centre", pm25: 41, no2: 55, so2: 5, x: 650, y: 300, size: 48, targetPM25: 41 }
];

// API configuration
const API_KEY = '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'; 
let refreshRate = 5; // How oftern the data updates in seconds
let cloudNoiseOffset = 0;
let particles = [];

// This function asks the AI for updated pollution values
async function fetchUKLivePollution() {
  console.log("Fetching live data from AI...");
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "Return ONLY a raw JSON array of 7 objects for the specified UK cities. Fields: pm25 (20-80), no2 (30-70), so2 (2-10). Keep values realistic for current UK weather."
        }],
        temperature: 0.8
      })
    });

    const result = await response.json();
    const aiData = JSON.parse(result.choices[0].message.content); // Convert AI text into usable JSON data

    // Uodate target values for each station
    for (let i = 0; i < pollutionData.length; i++) {
      pollutionData[i].targetPM25 = aiData[i].pm25;
      pollutionData[i].targetNO2 = aiData[i].no2;
      pollutionData[i].targetSO2 = aiData[i].so2;
    }
  } catch (error) {
    console.error("API Error, using fallback fluctuation.", error);
  }
}

function setup() {
  createCanvas(800, 600);
  noStroke();
  frameRate(30);

  // Create floating background particles
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(1, 5),
      speed: random(0.05, 0.2),
      opacity: random(20, 90),
      color: [200, 220, 255]
    });
  }

  // Fetch pollution data immediately
  fetchUKLivePollution();

  // Update repeatedly
  setInterval(fetchUKLivePollution, refreshRate * 1000);
}

function draw() {
  background(0);
  drawNaturalClouds();
  drawSoftParticles();
  drawWhiteGlowTitle();
  
  // Smooth animation for data updates
  smoothDataTransition();
  
  // Draw oulltion stations
  drawUKPollutionStations();
}

// Makes pollution values change slowly instead of jumping
function smoothDataTransition() {
  for (let station of pollutionData) {
    if (station.targetPM25 !== undefined) {
      station.pm25 = lerp(station.pm25, station.targetPM25, 0.05);
      station.no2 = lerp(station.no2 || 40, station.targetNO2 || 40, 0.05);
      station.so2 = lerp(station.so2 || 5, station.targetSO2 || 5, 0.05);

      // Circle size represents PM2.5 level
      station.size = map(station.pm25, 20, 80, 35, 75);
    }
  }
}

// Creates a soft moving cloud background using noise()
function drawNaturalClouds() {
  cloudNoiseOffset += 0.0015;
  for (let x = 0; x < width; x += 15) {
    for (let y = 0; y < height; y += 15) {
      let noiseVal = noise(x * 0.005 + cloudNoiseOffset, y * 0.005 + cloudNoiseOffset);
      let alpha = map(noiseVal, 0.3, 0.8, 0, 20);
      if (alpha > 0) {
        fill(220, 230, 255, alpha);
        ellipse(x, y, 30);
      }
    }
  }
}

// Floating particles to create atmosphere
function drawSoftParticles() {
  for (let p of particles) {
    p.x += sin(frameCount * 0.01 + p.x * 0.01) * p.speed;
    p.y += cos(frameCount * 0.01 + p.y * 0.01) * p.speed;
    if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
    fill(p.color[0], p.color[1], p.color[2], p.opacity * 0.4);
    ellipse(p.x, p.y, p.size * 5);
    fill(p.color[0], p.color[1], p.color[2], p.opacity);
    ellipse(p.x, p.y, p.size);
  }
}

function drawWhiteGlowTitle() {
  fill(255, 255, 255,100);
  textSize(24);
  textFont('Arial', 'bold');
  text('UK Urban Pollution Sensory Map', 40, 50);
  fill(255, 255, 255);
 
  fill(255, 255, 255, 180);
  textSize(14);
  text(`Real-time AI Syncing every ${refreshRate}s · Unit: μg/m³`, 40, 80);
}

// Draw pollution stations and each circle represents one city
function drawUKPollutionStations() {
  for (let station of pollutionData) {
    let colorSet = getDynamicColor(station.pm25);
    let d = dist(mouseX, mouseY, station.x, station.y);
    let glowScale = map(d, 0, 200, 2.5, 1);
    let size = station.size * map(d, 0, 200, 1.3, 1);

    fill(colorSet.glow[0], colorSet.glow[1], colorSet.glow[2], 50);
    ellipse(station.x, station.y, size * glowScale * 2);
    fill(colorSet.main[0], colorSet.main[1], colorSet.main[2], 180);
    ellipse(station.x, station.y, size);
    fill(255, 255, 255, 120);
    ellipse(station.x - size/4, station.y - size/4, size/3);

    if (d < size/2) drawWhiteHoverInfo(station);
  }
}

// Color changes depending on PM2.5 level
function getDynamicColor(pm25) {
  if (pm25 <= 35) return { main: [120, 255, 180], glow: [60, 220, 140] }; // excellent
  if (pm25 <= 50) return { main: [255, 255, 180], glow: [255, 255, 100] }; // good
  if (pm25 <= 65) return { main: [255, 190, 120], glow: [255, 140, 60] }; // mild
  return { main: [255, 120, 120], glow: [255, 80, 80] }; // moderate
}

// Documentation when hovering a city
function drawWhiteHoverInfo(station) {
  fill(0, 0, 0, 220);
  stroke(255, 255, 255, 80);
  rect(station.x + 15, station.y - 50, 220, 85, 10);
  noStroke();
  fill(255);
  textSize(14);
  text(station.name, station.x + 25, station.y - 30);
  fill(255, 255, 255, 180);
  textSize(12);
  text(`PM2.5: ${station.pm25.toFixed(1)} μg/m³`, station.x + 25, station.y - 10);
  text(`NO2: ${station.no2.toFixed(1)} μg/m³`, station.x + 25, station.y + 10);
  text(`SO2: ${station.so2.toFixed(1)} μg/m³`, station.x + 25, station.y + 30);
}