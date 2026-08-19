/**
 * EL AHRAM STREET - INTERACTIVE MASTERPLAN
 * Dual-Mode Calibrated 8K Masterplan with Interactive Tour & Day/Night Mood Crossfade
 */

document.addEventListener('DOMContentLoaded', () => {
  const { width: imgWidth, height: imgHeight, dayImageUrl, nightImageUrl } = MASTERPLAN_CONFIG;
  const bounds = [[0, 0], [imgHeight, imgWidth]];
  const center = [imgHeight / 2, imgWidth / 2];

  let stage1Zoom = 0;
  let stage2Zoom = 0;
  let currentStep = 1; // 1 to 5
  let activePin = null;
  let isAnimating = false;
  let isNightMode = false;
  let activeRoadRafId = null;

  // Lightbox state & async load token
  let currentLightboxPin = null;
  let currentLightboxIndex = 0;
  let currentLightboxToken = 0;

  const pinMarkers = {};
  const roadLayers = [];
  const zoneOverlays = {};

  // Background Pre-cache Night Image
  const nightPreloader = new Image();
  nightPreloader.src = nightImageUrl;

  // =========================================================
  // 1. INTRO VIDEO LIFECYCLE
  // =========================================================
  const introVideoOverlay = document.getElementById('intro-video-overlay');
  const introVideo = document.getElementById('intro-video');
  const skipIntroBtn = document.getElementById('skip-intro-btn');
  let introDismissed = false;

  function dismissIntroVideo() {
    if (introDismissed) return;
    introDismissed = true;
    if (introVideoOverlay) {
      introVideoOverlay.classList.add('fade-out');
    }
    setTimeout(() => {
      if (introVideo) introVideo.pause();
    }, 350);
  }

  if (introVideo) {
    introVideo.addEventListener('timeupdate', () => {
      if (introVideo.duration && introVideo.currentTime >= introVideo.duration - 0.15) {
        dismissIntroVideo();
      }
    });
    introVideo.addEventListener('ended', dismissIntroVideo);
    introVideo.addEventListener('click', dismissIntroVideo);
    introVideo.addEventListener('error', dismissIntroVideo);

    setTimeout(() => {
      if (!introDismissed && introVideo.paused && introVideo.currentTime === 0) {
        dismissIntroVideo();
      }
    }, 6000);
  }

  skipIntroBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissIntroVideo();
  });

  // =========================================================
  // 2. INITIALIZE LEAFLET MAP
  // =========================================================
  const map = L.map('masterplan-map', {
    crs: L.CRS.Simple,
    attributionControl: false,
    zoomControl: false,
    zoomSnap: 0.05,
    zoomDelta: 0.25,
    maxBoundsViscosity: 0.75,
    bounceAtLimits: false,
    inertia: true,
    inertiaDeceleration: 3000,
    doubleClickZoom: false
  });

  // 3. Base Masterplan Layers
  const dayLayer = L.imageOverlay(dayImageUrl, bounds, {
    zIndex: 1,
    className: 'basemap-layer day-layer'
  }).addTo(map);

  const nightLayer = L.imageOverlay(nightImageUrl, bounds, {
    zIndex: 2,
    opacity: 0.0,
    className: 'basemap-layer night-layer'
  }).addTo(map);

  // Helper to get active coordinates based on current day/night mood
  function getActiveCoords(pin) {
    return isNightMode ? (pin.nightCoords || pin.coords) : (pin.dayCoords || pin.coords);
  }

  // Night / Day Mood Switcher (Dual Calibrated Mode-Aware Switch)
  const moodBtn = document.getElementById('journey-mood-btn');
  const moodIcon = document.getElementById('mood-icon');
  const moodText = document.getElementById('mood-text');

  function setMood(night) {
    isNightMode = night;
    if (isNightMode) {
      nightLayer.setOpacity(1.0);
      dayLayer.setOpacity(0.0);
      if (moodIcon) moodIcon.textContent = '☀️';
      if (moodText) moodText.textContent = 'Day Mode';
      moodBtn?.classList.add('night-active');
    } else {
      dayLayer.setOpacity(1.0);
      nightLayer.setOpacity(0.0);
      if (moodIcon) moodIcon.textContent = '🌙';
      if (moodText) moodText.textContent = 'Night Mode';
      moodBtn?.classList.remove('night-active');
    }

    // Dynamically update pin marker positions to match active mode calibration
    PINS_DATA.forEach((pin) => {
      pin.coords = getActiveCoords(pin);
      if (pinMarkers[pin.id]) {
        pinMarkers[pin.id].marker.setLatLng(pin.coords);
      }
    });

    // Re-anchor existing road segments
    syncActiveRoads();
  }

  moodBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setMood(!isNightMode);
  });

  // 4. Preload Zone Overlays
  PINS_DATA.forEach((pin, idx) => {
    const overlay = L.imageOverlay(pin.overlayUrl, bounds, {
      opacity: 0.0,
      className: 'zone-overlay-layer',
      interactive: false,
      zIndex: 10 + idx
    }).addTo(map);

    zoneOverlays[pin.id] = overlay;
  });

  function setActiveNodeOverlay(stepNumber) {
    PINS_DATA.forEach((pin, idx) => {
      const overlay = zoneOverlays[pin.id];
      if (!overlay) return;

      const el = overlay.getElement();
      if (idx + 1 === stepNumber) {
        if (el) el.style.display = 'block';
        overlay.setOpacity(1.0);
      } else {
        overlay.setOpacity(0.0);
        setTimeout(() => {
          if (overlay.options.opacity === 0.0 && el) {
            el.style.display = 'none';
          }
        }, 550);
      }
    });
  }

  // 5. Pin Marker Builder
  function createPinElement(pin, isAwaiting = false) {
    const scale = pin.scale || 1.1;
    const baseW = Math.round(54 * scale);
    const baseH = Math.round(100 * scale);

    const el = document.createElement('div');
    el.className = `gold-pin-container pin-pop-in ${isAwaiting ? 'awaiting-click' : ''}`;
    el.style.width = `${baseW}px`;
    el.style.height = `${baseH}px`;
    el.dataset.id = pin.id;

    el.innerHTML = `
      <svg class="pin-cone-svg" viewBox="0 0 60 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="goldGrad-${pin.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef9c3" />
            <stop offset="35%" stop-color="#facc15" />
            <stop offset="70%" stop-color="#ca8a04" />
            <stop offset="100%" stop-color="#854d0e" />
          </linearGradient>
          <clipPath id="circleClip-${pin.id}">
            <circle cx="30" cy="30" r="23" />
          </clipPath>
        </defs>
        
        <!-- Needle cone reaching to (30, 120) -->
        <polygon points="30,120 10,40 50,40" fill="url(#goldGrad-${pin.id})" opacity="0.98" />
        
        <!-- Outer Gold Ring Bezel -->
        <circle cx="30" cy="30" r="27.5" fill="#0f172a" stroke="url(#goldGrad-${pin.id})" stroke-width="4.5" />
        
        <!-- AI Zone Image inside the Circle -->
        <image href="${pin.previewImg}" x="7" y="7" width="46" height="46" preserveAspectRatio="xMidYMid slice" clip-path="url(#circleClip-${pin.id})" />
        
        <!-- Glass Highlight Ring -->
        <circle cx="30" cy="30" r="23" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
      </svg>
      <div class="pin-ground-anchor"></div>
      <div class="pin-ground-pulse"></div>
      <div class="pin-label-badge">${pin.number} · ${pin.title}</div>
    `;

    return el;
  }

  function addPinToMap(pin, isAwaiting = true) {
    if (pinMarkers[pin.id]) return;

    pin.coords = getActiveCoords(pin);
    const pinEl = createPinElement(pin, isAwaiting);
    const scale = pin.scale || 1.1;
    const baseW = Math.round(54 * scale);
    const baseH = Math.round(100 * scale);

    const icon = L.divIcon({
      className: 'custom-pin-marker',
      html: pinEl,
      iconSize: [baseW, baseH],
      iconAnchor: [baseW / 2, baseH]
    });

    const marker = L.marker(pin.coords, {
      icon: icon,
      zIndexOffset: 1000 + Math.round(scale * 150)
    }).addTo(map);

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      handlePinClick(pin);
    });

    pinMarkers[pin.id] = { marker, element: pinEl, pin };
  }

  // 6. Smooth Road Segment Drawing
  function animateRoadSegment(startCoords, endCoords, duration = 800, onComplete = null) {
    if (activeRoadRafId) {
      cancelAnimationFrame(activeRoadRafId);
      activeRoadRafId = null;
    }

    const startTime = performance.now();

    const glowLine = L.polyline([startCoords, startCoords], {
      className: 'yellow-road-glow',
      color: '#facc15',
      weight: 14,
      opacity: 0.45,
      zIndexOffset: 500
    }).addTo(map);

    const coreLine = L.polyline([startCoords, startCoords], {
      className: 'yellow-road-core',
      color: '#fde047',
      weight: 4.5,
      opacity: 0.98,
      zIndexOffset: 501
    }).addTo(map);

    const dashLine = L.polyline([startCoords, startCoords], {
      className: 'yellow-road-dash',
      color: '#ffffff',
      weight: 2.2,
      dashArray: '10, 12',
      opacity: 0.9,
      zIndexOffset: 502
    }).addTo(map);

    roadLayers.push({ glowLine, coreLine, dashLine, startStep: currentStep - 1, endStep: currentStep });

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentLat = startCoords[0] + (endCoords[0] - startCoords[0]) * ease;
      const currentLng = startCoords[1] + (endCoords[1] - startCoords[1]) * ease;
      const currentPoint = [currentLat, currentLng];

      const currentCoords = [startCoords, currentPoint];
      glowLine.setLatLngs(currentCoords);
      coreLine.setLatLngs(currentCoords);
      dashLine.setLatLngs(currentCoords);

      if (progress < 1.0) {
        activeRoadRafId = requestAnimationFrame(step);
      } else {
        activeRoadRafId = null;
        if (onComplete) onComplete();
      }
    }

    activeRoadRafId = requestAnimationFrame(step);
  }

  function syncActiveRoads() {
    roadLayers.forEach(layerGroup => {
      const p1 = PINS_DATA[layerGroup.startStep - 1];
      const p2 = PINS_DATA[layerGroup.endStep - 1];
      if (p1 && p2) {
        const c1 = getActiveCoords(p1);
        const c2 = getActiveCoords(p2);
        layerGroup.glowLine.setLatLngs([c1, c2]);
        layerGroup.coreLine.setLatLngs([c1, c2]);
        layerGroup.dashLine.setLatLngs([c1, c2]);
      }
    });
  }

  // 7. Interactive Tour Sequential Progression
  function startJourney() {
    if (activeRoadRafId) {
      cancelAnimationFrame(activeRoadRafId);
      activeRoadRafId = null;
    }

    Object.values(pinMarkers).forEach(({ marker }) => map.removeLayer(marker));
    roadLayers.forEach(({ glowLine, coreLine, dashLine }) => {
      map.removeLayer(glowLine);
      map.removeLayer(coreLine);
      map.removeLayer(dashLine);
    });
    Object.keys(pinMarkers).forEach(k => delete pinMarkers[k]);
    roadLayers.length = 0;

    currentStep = 1;
    setActiveNodeOverlay(1);

    updateHUD(1, 'Explore Zone 01 or click Pin 01 to advance');
    isAnimating = false;

    // Pin 01 pops in right at calibrated coordinates
    addPinToMap(PINS_DATA[0], true);

    setTimeout(() => {
      openPinCard(PINS_DATA[0]);
    }, 180);
  }

  function handlePinClick(pin) {
    openPinCard(pin);
    setActiveNodeOverlay(pin.step);

    if (pin.step === currentStep && currentStep < 5 && !isAnimating) {
      isAnimating = true;
      const nextPinData = PINS_DATA[currentStep];

      if (pinMarkers[pin.id]) {
        pinMarkers[pin.id].element.classList.remove('awaiting-click');
      }

      currentStep++;
      updateHUD(currentStep, `Advancing to ${nextPinData.title}...`);

      const pCurrent = getActiveCoords(pin);
      const pNext = getActiveCoords(nextPinData);

      animateRoadSegment(pCurrent, pNext, 800, () => {
        isAnimating = false;
        setActiveNodeOverlay(currentStep);
        addPinToMap(nextPinData, true);
        updateHUD(currentStep, `Click on Pin ${nextPinData.number} (${nextPinData.title}) to advance`);
        openPinCard(nextPinData);
      });
    } else if (pin.step === 5 && currentStep === 5) {
      if (pinMarkers[pin.id]) {
        pinMarkers[pin.id].element.classList.remove('awaiting-click');
      }
      setActiveNodeOverlay(5);
      updateHUD(5, '🎉 Masterplan Tour Complete! All 5 Landmarks Unlocked');
    }
  }

  // 8. Welcome Overlay Handler
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const welcomeExploreBtn = document.getElementById('welcome-explore-btn');

  welcomeExploreBtn?.addEventListener('click', () => {
    welcomeOverlay.classList.add('fade-out');
    startJourney();
  });

  // 9. HUD Controls
  const stepBadge = document.getElementById('journey-step-badge');
  const stepHint = document.getElementById('journey-hint');
  const resetBtn = document.getElementById('journey-reset-btn');

  function updateHUD(step, text) {
    if (stepBadge) stepBadge.textContent = `STEP ${Math.min(step, 5)} / 5`;
    if (stepHint) stepHint.textContent = text;
  }

  resetBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePinCard();
    closeLightbox();
    startJourney();
  });

  // 10. Interactive Detail Card with Mini Gallery Ribbon
  const pinCard = document.getElementById('pin-card');
  const pinCardImg = document.getElementById('pin-card-img');
  const pinCardHeroWrap = document.getElementById('pin-card-hero-wrap');
  const pinTag = document.getElementById('pin-tag');
  const pinTitle = document.getElementById('pin-title');
  const pinMeta = document.getElementById('pin-meta');
  const pinDesc = document.getElementById('pin-desc');
  const cardGalleryCount = document.getElementById('card-gallery-count');
  const cardGalleryThumbs = document.getElementById('card-gallery-thumbs');
  const pinOpenGalleryBtn = document.getElementById('pin-open-gallery-btn');
  const pinFocusBtn = document.getElementById('pin-focus-btn');
  const pinCardClose = document.getElementById('pin-card-close');

  function openPinCard(pin) {
    activePin = pin;
    const gallery = pin.gallery || [pin.previewImg];
    const coords = getActiveCoords(pin);

    if (pinCardImg) {
      pinCardImg.src = gallery[0];
      pinCardImg.alt = pin.title;
      pinCardImg.decoding = 'async';
    }
    pinTag.textContent = pin.tag || `STATION ${pin.number}`;
    pinTitle.textContent = pin.title;
    pinMeta.textContent = `Status: ${pin.status} · Coords: [Y: ${coords[0]}, X: ${coords[1]}]`;
    pinDesc.textContent = pin.description;
    cardGalleryCount.textContent = `${gallery.length} Photos`;

    cardGalleryThumbs.innerHTML = '';
    gallery.forEach((imgUrl, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'card-thumb-item';
      thumb.innerHTML = `<img src="${imgUrl}" alt="Photo ${idx + 1}" loading="lazy" decoding="async" />`;
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(pin, idx);
      });
      cardGalleryThumbs.appendChild(thumb);
    });

    pinCard.classList.add('open');
    pinCard.setAttribute('aria-hidden', 'false');
  }

  function closePinCard() {
    activePin = null;
    pinCard.classList.remove('open');
    pinCard.setAttribute('aria-hidden', 'true');
  }

  pinCardClose.addEventListener('click', closePinCard);

  pinCardHeroWrap.addEventListener('click', () => {
    if (activePin) openLightbox(activePin, 0);
  });

  pinOpenGalleryBtn.addEventListener('click', () => {
    if (activePin) openLightbox(activePin, 0);
  });

  // Safe Planar Bounds Camera Glide
  function getSafeBoundsCenter(targetCoords, targetZoom) {
    const size = map.getSize();
    const currentScale = Math.pow(2, targetZoom);
    const halfW = (size.x / 2) / currentScale;
    const halfH = (size.y / 2) / currentScale;

    const minLat = Math.min(halfH, imgHeight / 2);
    const maxLat = Math.max(imgHeight - halfH, imgHeight / 2);
    const minLng = Math.min(halfW, imgWidth / 2);
    const maxLng = Math.max(imgWidth - halfW, imgWidth / 2);

    const clampedLat = Math.max(minLat, Math.min(maxLat, targetCoords[0]));
    const clampedLng = Math.max(minLng, Math.min(maxLng, targetCoords[1]));

    return [clampedLat, clampedLng];
  }

  pinFocusBtn.addEventListener('click', () => {
    if (activePin) {
      const coords = getActiveCoords(activePin);
      const safeCenter = getSafeBoundsCenter(coords, stage2Zoom);
      map.flyTo(safeCenter, stage2Zoom, {
        duration: 0.85,
        easeLinearity: 0.25,
        noMoveStart: true
      });
    }
  });

  map.on('click', () => {
    closePinCard();
  });

  // 11. FULLSCREEN CINEMATIC LIGHTBOX MODAL
  const galleryModal = document.getElementById('gallery-modal');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxZoneTag = document.getElementById('lightbox-zone-tag');
  const lightboxZoneTitle = document.getElementById('lightbox-zone-title');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxViewport = document.getElementById('lightbox-image-viewport');
  const lightboxMainImage = document.getElementById('lightbox-main-image');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxThumbsTrack = document.getElementById('lightbox-thumbs-track');

  function openLightbox(pin, startIndex = 0) {
    currentLightboxPin = pin;
    currentLightboxIndex = startIndex;

    lightboxZoneTag.textContent = pin.tag || `ZONE ${pin.number}`;
    lightboxZoneTitle.textContent = pin.title;

    renderLightboxThumbs();
    showLightboxImage(startIndex);

    galleryModal.classList.add('open');
    galleryModal.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    galleryModal.classList.remove('open');
    galleryModal.setAttribute('aria-hidden', 'true');
    currentLightboxPin = null;
  }

  function showLightboxImage(index) {
    if (!currentLightboxPin || !currentLightboxPin.gallery) return;
    const gallery = currentLightboxPin.gallery;

    if (index < 0) index = gallery.length - 1;
    if (index >= gallery.length) index = 0;

    currentLightboxIndex = index;
    lightboxCounter.textContent = `${index + 1} / ${gallery.length}`;

    const thisToken = ++currentLightboxToken;
    const targetSrc = gallery[index];

    if (lightboxViewport) lightboxViewport.classList.add('is-loading');
    lightboxMainImage.style.opacity = '0';
    lightboxMainImage.style.transform = 'scale(0.98)';

    const loader = new Image();
    loader.src = targetSrc;
    loader.onload = () => {
      if (thisToken !== currentLightboxToken) return;
      lightboxMainImage.src = targetSrc;
      lightboxMainImage.alt = `${currentLightboxPin.title} - Render ${index + 1}`;
      lightboxMainImage.style.opacity = '1';
      lightboxMainImage.style.transform = 'scale(1)';
      if (lightboxViewport) lightboxViewport.classList.remove('is-loading');
    };
    loader.onerror = () => {
      if (thisToken !== currentLightboxToken) return;
      if (lightboxViewport) lightboxViewport.classList.remove('is-loading');
    };

    const nextIdx = (index + 1) % gallery.length;
    const prevIdx = (index - 1 + gallery.length) % gallery.length;
    const nextImg = new Image(); nextImg.src = gallery[nextIdx];
    const prevImg = new Image(); prevImg.src = gallery[prevIdx];

    const thumbs = lightboxThumbsTrack.querySelectorAll('.lightbox-thumb');
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === index);
      if (i === index) {
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  function renderLightboxThumbs() {
    if (!currentLightboxPin || !currentLightboxPin.gallery) return;
    lightboxThumbsTrack.innerHTML = '';

    currentLightboxPin.gallery.forEach((url, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `lightbox-thumb ${idx === currentLightboxIndex ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${url}" alt="Thumbnail ${idx + 1}" loading="lazy" decoding="async" />`;
      thumb.addEventListener('click', () => showLightboxImage(idx));
      lightboxThumbsTrack.appendChild(thumb);
    });
  }

  lightboxPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showLightboxImage(currentLightboxIndex - 1);
  });
  lightboxNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showLightboxImage(currentLightboxIndex + 1);
  });
  lightboxCloseBtn.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);

  // Global Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (galleryModal.classList.contains('open')) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showLightboxImage(currentLightboxIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showLightboxImage(currentLightboxIndex + 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      }
    } else if (pinCard.classList.contains('open')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePinCard();
      }
    }
  });

  // Stop map click propagation
  const stopPropElements = [
    document.getElementById('pin-card'),
    document.getElementById('top-center-hud-group'),
    document.getElementById('journey-hud'),
    document.getElementById('weather-time-pill'),
    document.getElementById('bottom-left-logos'),
    document.getElementById('journey-mood-btn'),
    document.getElementById('welcome-overlay'),
    document.getElementById('gallery-modal')
  ];

  stopPropElements.forEach(el => {
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  });

  // 12. LIVE CLOCK & CAIRO WEATHER
  const liveClockEl = document.getElementById('live-clock');
  const weatherIconEl = document.getElementById('weather-icon');
  const weatherTempEl = document.getElementById('weather-temp');
  const weatherDescEl = document.getElementById('weather-desc');

  function updateClock() {
    const now = new Date();
    const options = {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    const timeStr = new Intl.DateTimeFormat('en-US', options).format(now);
    if (liveClockEl) liveClockEl.textContent = timeStr;
  }

  setInterval(updateClock, 1000);
  updateClock();

  async function fetchLiveWeather() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.087&longitude=31.328&current=temperature_2m,weather_code,is_day');
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const current = data.current;

      const temp = Math.round(current.temperature_2m);
      const isDay = current.is_day === 1;
      const code = current.weather_code;

      let icon = isDay ? '☀️' : '🌙';
      let desc = 'Clear';

      if (code === 0) {
        icon = isDay ? '☀️' : '✨';
        desc = 'Clear Sky';
      } else if (code === 1 || code === 2) {
        icon = isDay ? '🌤️' : '☁️';
        desc = 'Partly Cloudy';
      } else if (code === 3) {
        icon = '☁️';
        desc = 'Overcast';
      } else if (code >= 45 && code <= 48) {
        icon = '🌫️';
        desc = 'Misty';
      } else if (code >= 51 && code <= 67) {
        icon = '🌧️';
        desc = 'Light Rain';
      } else if (code >= 80) {
        icon = '🌦️';
        desc = 'Showers';
      }

      if (weatherTempEl) weatherTempEl.textContent = `${temp}°C`;
      if (weatherIconEl) weatherIconEl.textContent = icon;
      if (weatherDescEl) weatherDescEl.textContent = desc;
    } catch (err) {
      if (weatherTempEl) weatherTempEl.textContent = `29°C`;
      if (weatherIconEl) weatherIconEl.textContent = `☀️`;
      if (weatherDescEl) weatherDescEl.textContent = `Sunny`;
    }
  }

  fetchLiveWeather();
  setInterval(fetchLiveWeather, 10 * 60 * 1000);

  // 13. 2-Stage Zoom Calibration
  function calculate2StageZoom() {
    map.invalidateSize();
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;

    const scaleX = size.x / imgWidth;
    const scaleY = size.y / imgHeight;
    const coverScale = Math.max(scaleX, scaleY);
    stage1Zoom = Math.log2(coverScale);

    stage2Zoom = stage1Zoom + 1.25;

    map.setMinZoom(stage1Zoom);
    map.setMaxZoom(stage2Zoom);
    map.setMaxBounds(bounds);

    if (map.getZoom() < stage1Zoom || !map._loaded) {
      map.setView(center, stage1Zoom, { animate: false });
    }
  }

  calculate2StageZoom();
  setTimeout(calculate2StageZoom, 50);
  setTimeout(calculate2StageZoom, 200);

  map.on('dblclick', (e) => {
    const currentZoom = map.getZoom();
    const midZoom = (stage1Zoom + stage2Zoom) / 2;

    if (currentZoom > midZoom) {
      map.setZoom(stage1Zoom, { animate: true });
    } else {
      const activeCoords = activePin ? getActiveCoords(activePin) : [e.latlng.lat, e.latlng.lng];
      const safeTarget = getSafeBoundsCenter(activeCoords, stage2Zoom);
      map.flyTo(safeTarget, stage2Zoom, { animate: true, duration: 0.75 });
    }
  });

  window.addEventListener('resize', calculate2StageZoom);
});
