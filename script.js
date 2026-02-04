let lastFingerprint = null;

const modals = {
  legalLink: 'legalModal',
  changelogLink: 'changelogModal',
  feedbackLink: 'feedbackModal'
};

let activeModal = null;
let lastFocusedElement = null;

function openModal(modal) {
  lastFocusedElement = document.activeElement;

  modal.style.display = 'flex';
  modal.setAttribute('aria-modal', 'true');
  modal.removeAttribute('aria-hidden');

  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  if (main) main.inert = true;
  if (footer) footer.inert = true;

  activeModal = modal;

  const focusable = modal.querySelector(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) focusable.focus();
}

function closeModal(modal) {
  modal.style.display = 'none';
  modal.removeAttribute('aria-modal');
  modal.setAttribute('aria-hidden', 'true');

  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  if (main) main.inert = false;
  if (footer) footer.inert = false;

  activeModal = null;
  if (lastFocusedElement) lastFocusedElement.focus();
}

Object.keys(modals).forEach(function(linkId) {
  const trigger = document.getElementById(linkId);
  const modal = document.getElementById(modals[linkId]);

  if (!trigger || !modal) return;

  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    openModal(modal);
  });
});

document.querySelectorAll('.closeModal').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const modal = btn.closest('.modal');
    if (modal) closeModal(modal);
  });
});

document.querySelectorAll('.modal').forEach(function(modal) {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal(modal);
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && activeModal) {
    closeModal(activeModal);
  }
});

document.getElementById('submitFeedback').addEventListener('click', () => {
  const text = document.getElementById('feedbackText').value.trim();
  const messageEl = document.getElementById('feedbackMessage');

  if (!text) {
    messageEl.textContent = "Please enter feedback before submitting.";
    return;
  }

  messageEl.textContent = "Thank you! Feedback submitted (demo mode).";
  document.getElementById('feedbackText').value = '';
});

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
//const darkModeQuery = true;
function applyDarkMode(e) {
    document.documentElement.classList.toggle('dark', e.matches);
}

applyDarkMode(darkModeQuery);

darkModeQuery.addEventListener('change', applyDarkMode);

const fontsToTest = [
    "Arial", "Times New Roman", "Courier New", "Roboto", "Georgia", "Verdana", "Trebuchet MS", "Fira Code", "JetBrains Mono", "Comic Sans MS"
];

function detectFonts() {
    try {
        const baseFonts = ["monospace", "sans-serif", "serif"];
        const testString = "mmmmmmmmmmlli";
        const testSize = "72px";
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        const defaultWidths = {};
        baseFonts.forEach(base => {
            context.font = `${testSize} ${base}`;
            defaultWidths[base] = context.measureText(testString).width;
        });

        return fontsToTest.filter(font => {
            return baseFonts.some(base => {
                context.font = `${testSize} '${font}', ${base}`;
                return context.measureText(testString).width !== defaultWidths[base];
            });
        });
    } catch {
        return 'unavailable';
    }
}

function getWebGLInfo() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return {
            vendor: "unavailable", 
            renderer: "unavailable"
        };
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        return debugInfo ? {
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        } : {vendor: "unavailable", renderer: "unavailable"};
    } catch {
        return {vendor: 'unavailable', renderer: 'unavailable'};
    }
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 300;
        canvas.height = 150;

        const gradient = ctx.createLinearGradient(0,0, 300, 150);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textBaseline = 'top';
        ctx.font = "16px 'Arial'";
        ctx.fillStyle = '#000';
        ctx.fillText('Fingerprint Test 123!', 10, 10);

        ctx.font = "18px 'Times New Roman'";
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('Canvas entropy', 10, 40);

        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(200, 75, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(102, 204, 0, 0.6)';
        ctx.fillRect(220, 20, 50, 60);

        return canvas.toDataURL();
    } catch {
        return 'unavailable';
    }
}

async function getAudioFingerprint() {
    try {
        const audioCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);

        const oscillator = audioCtx.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.value = 10000;

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        oscillator.connect(compressor);
        compressor.connect(audioCtx.destination);
        oscillator.start(0);

        const buffer = await audioCtx.startRendering();
        const data = buffer.getChannelData(0);

        let sum = 0;
        for (let i = 4500;i < 5000; i++) {
            sum += Math.abs(data[i])
        }

        return sum.toString();
    } catch {
        return "unavailable";
    }
}

async function getMediaDeviceInfo() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const counts = {
            audioinput: 0,
            audiooutput: 0,
            videoinput: 0,
        };

        devices.forEach(device => {
            counts[device.kind]++;
        });

        return counts;
    } catch (err) {
        return { error: "unavailable"};
    }
}

//const mediaInfo = JSON.stringify(getMediaDeviceInfo(), null, 2);

function getMimeTypes() {
    if (!navigator.mimeTypes) return 'unavailable';
    const mimes = Array.from(navigator.mimeTypes).map(m => m.type).filter(Boolean);
    return mimes.length ? mimes.join(', ') : 'unavailable';
}

function getColorGamut() {
    try {    
        if (matchMedia("(color-gamut: rec2020)").matches) return "rec2020";
        if (matchMedia("(color-gamut: p3)").matches) return "p3";
        if (matchMedia("(color-gamut: srgb)").matches) return "srgb";
        return "unavailable";
    } catch {
        return 'unavailable';
    }
}

function getDynamicRange() {
    try {
        return matchMedia("(dynamic-range: high)").matches ? "HDR" : "SDR";
    } catch {
        return 'unavailable';
    }
}

function getAccessibility() {
    try {
        const preferences = {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast: window.matchMedia('(prefers-contrast: more)').matches,
            reducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
        };

        return preferences;
    } catch {
        return 'unavailable';
    }
}

function getCSSSupports() {
    try {
        const supports = {
            filter: CSS.supports("backdrop-filter", "blur(10px)"),
            container: CSS.supports("container-type", "inline-size"),
            tech: CSS.supports("font-tech(color-COLRv1)"),
            accent: CSS.supports("accent-color", "auto"),
        }
        return supports;
    } catch {
        return 'unavailable';
    }
}

const featureSupport = {
        usb: "usb" in navigator,
        bluetooth: "bluetooth" in navigator,
        hid: "hid" in navigator,
        serial: "serial" in navigator,
        share: "share" in navigator,
};

//alert(featureSupport.usb);

function calculateScore(data) {
    let score = 0;
    if (data.fonts.length > 6) score += 30;
    if (![1920, 1366, 1536].includes(data.screen.width)) score += 20;
    if (data.webgl.renderer !== "unavailable") score += 20;
    if (data.hardwareConcurrency >= 8) score += 15;
    if (data.languages.length > 1) score += 15;
    score = Math.min(score, 100);
    return score;
}

function riskBadge(level) {
    const cls =
        level.toLowerCase().includes("high") ? "high" :
        level.toLowerCase().includes("medium") ? "medium" :
        "low";

    return `<span class="badge ${cls}">${level}</span>`;
}

function addCard(title, value, risk, explanation) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <h3>${title} ${riskBadge(risk)}</h3>
        <code>${value}</code>
        <p class="explanation">${explanation}</p>
    `;
    document.getElementById("cards").appendChild(card);
}

function deepSort(value) {
    if (Array.isArray(value)) {
        return value.map(deepSort);
    }

    if (value && typeof value === "object") {
        return Object.keys(value)
        .sort()
        .reduce((result, key) => {
            result[key] = deepSort(value[key]);
            return result;
        }, {});
    }

    return value;
}

async function hashFingerprint(obj) {
    const canonical = deepSort(obj);
    const encoded = new TextEncoder().encode(JSON.stringify(canonical));
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);

    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function renderFixes(fingerprint) {
    const existing = document.getElementById('fixes');
    if (existing) existing.remove();

    const section = document.createElement('section');
    section.className = 'summary';
    section.id = 'fixes';
    let fixes = [];

    if (!['1920x1080', '1366x768', '1536x864'].includes(`${fingerprint.screen.width}x${fingerprint.screen.height}`)) {
        fixes.push({
            issue: 'Uncommon screen resolution',
            fix: 'Use more common window sizes like 1920x1080 or 1366x768 to blend in with typical users.'
        });
    }

    /*if () {
        fixes.push({
            issue: '',
            fix: ''
        });
    }*/

    if (Number.isFinite(fingerprint.fonts?.length) && fingerprint.fonts.length > 3) {
        fixes.push({
            issue: 'High font uniqueness',
            fix: 'Remove uncommon developer fonts like Fira Code, or use a privacy focused browser.'
        });
    }

    if (fingerprint.webgl.renderer && fingerprint.webgl.renderer.toLowerCase() !== 'unavailable') {
        fixes.push({
            issue: 'GPU reveals hardware details',
            fix: 'Use a privacy focused browser to obscure GPU information.'
        });
    }

    if (fingerprint.languages.length > 2) {
        fixes.push({
            issue: 'High quantity of installed languages',
            fix: 'Consider deleting unnecessary languages.'
        });
    }

    if (Number.isFinite(fingerprint.hardwareConcurrency) && fingerprint.hardwareConcurrency % 2 !== 0) {
        fixes.push({
            issue: 'Unusual number of CPU threads',
            fix: 'Consider using a privacy focused browser to obfuscate CPU threads.'
        });
    }

    if (fixes.length === 0) {
        fixes.push({
            issue: 'No major fingerprinting risks detected',
            fix: 'Good job.'
        });
    }

    section.innerHTML = `<h2>Fix My Fingerprint</h2>` +
        fixes.map(f =>
            `<div style="margin-bottom: 1rem">
                <strong>${f.issue}</strong>
                <p style="margin: 0.2rem 0; color: var(--muted)">${f.fix}</p>
            </div>`
        ).join('');

    document.getElementById('fixmyfingerprint').prepend(section);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === document.body) {
        document.getElementById('analyseBtn').click();
    }
});

document.getElementById("downloadFingerprint").addEventListener("click", () => {
    if (!lastFingerprint) return;

    const data = JSON.stringify(deepSort(lastFingerprint), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "browser-fingerprint.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
});


document.getElementById("analyseBtn").onclick = async () => {
    const fonts = detectFonts();
    const webgl = getWebGLInfo();
    const accessibilityPreferences = getAccessibility();
    const cssSupports = getCSSSupports();

    const fingerprint = {
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            dpr: window.devicePixelRatio,
            gamut: getColorGamut(),
            range: getDynamicRange()
        },
        accessibility: {
            reducedMotion: accessibilityPreferences.reducedMotion,
            contrast: accessibilityPreferences.highContrast,
            reducedData: accessibilityPreferences.reducedData
        },
        supports: {
            filter: cssSupports.filter,
            container: cssSupports.container,
            tech: cssSupports.tech,
            accent: cssSupports.accent
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        languages: navigator.languages,
        hardwareConcurrency: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
        touch: navigator.maxTouchPoints,
        canvas: getCanvasFingerprint(),
        audio: await getAudioFingerprint(),
        mime: getMimeTypes(),
        fonts,
        webgl
    };

    lastFingerprint = fingerprint;

    
    const hash = await hashFingerprint(fingerprint);
    const score = calculateScore(fingerprint);
    
    document.getElementById("hashDisplay").textContent = hash;
    document.getElementById("scoreDisplay").textContent = `${score}/100 (${score>70?"High":score>30?"Moderate":"Low"} uniqueness)`;
    
    renderFixes(fingerprint);
    
    document.getElementById("cards").innerHTML = "";

    addCard("Audio", fingerprint.audio, "High Threat", "The hash generated by the audio compressor can determine audio stacks.");

    addCard("Fonts", `${fingerprint.fonts.length} detected`, "High Threat", "Font combinations are often highly unique and stable.");
    
    addCard("Canvas", fingerprint.canvas, "High Threat", "The hash generated by a high-entropy canvas can reveal GPU drivers and OS graphics stacks.");

    addCard("Accessibility", `reduced motion: ${fingerprint.accessibility.reducedMotion}, high contrast: ${fingerprint.accessibility.contrast}, reduced data: ${fingerprint.accessibility.reducedData}`, "High Threat", "Accessibility preferences can be very unique when viewed in combination.");

    addCard("CSS Supports", `backdrop filter: ${fingerprint.supports.filter}, container type: ${fingerprint.supports.container}, font tech: ${fingerprint.supports.tech}, accent colour: ${fingerprint.supports.accent}`, "Medium Threat", "CSS supports can reveal browser information when viewed in combination.");

    addCard('Screen', `${fingerprint.screen.width}x${fingerprint.screen.height}, ${fingerprint.screen.dpr} DPR`, "Medium Threat", "Unusual screen setups can increase fingerprint uniqueness.");
    
    addCard('Colour', `${fingerprint.screen.colorDepth}-bit, ${fingerprint.screen.gamut}, ${fingerprint.screen.range}`, "Medium Threat", "Unusual colour setups can reveal device characteristics.");
    
    addCard('MIME Types', fingerprint.mime, "Medium Threat", "Supported MIME types can reveal browser version information and personal preferences.");

    addCard("GPU", fingerprint.webgl.renderer, "Medium Threat", "Graphics hardware helps distinguish devices.");
    
    addCard("CPU Threads", fingerprint.hardwareConcurrency, "Medium Threat", "CPU thread count can narrow device types.");
    
    addCard("RAM Count", fingerprint.memory, "Medium Threat", "Unusual RAM counts can often distinguish devices.");

    addCard("Languages", fingerprint.languages.join(", "), "Low Threat", "Installed languages are rarely changed, but may still be a factor.");
    
    addCard("Touchscreen", `${fingerprint.touch} touchpoints`, "Low Threat", "The number of touchpoints can differentiate device types.");
    
    addCard("Locale", fingerprint.timezone, "Low Threat", "Common locales offer little uniqueness but still contribute.");

    document.getElementById("results").style.display = "block";

};

document.addEventListener("click", async (e) => {
    const codeEl = e.target.closest("code");
    if (!codeEl) return;

    const originalText = codeEl.textContent;

    try {
        await navigator.clipboard.writeText(originalText);

        codeEl.textContent = "Copied!";
        codeEl.classList.add("copied");

        setTimeout(() => {
            codeEl.textContent = originalText;
            codeEl.classList.remove("copied");
        }, 800);
    } catch (err) {
        codeEl.textContent = "Copy failed!";
        codeEl.classList.add("copied");

        setTimeout(() => {
            codeEl.textContent = originalText;
            codeEl.classList.remove("copied");
        }, 800);
    }
});







/* =====================================================
   GUIDED WALKTHROUGH (NON-DESTRUCTIVE)
===================================================== */

const walkthroughSteps = [
  {
    title: "Fingerprint generated",
    text: "Your browser fingerprint has been calculated below.",
    summary: "show",
    fixes: "hidden",
    high: "hidden",
    medium: "hidden",
    low: "hidden",
    scroll: "high"
  },
  {
    title: "High-risk identifiers",
    text: "These signals are highly stable and uniquely identifying.",
    summary: "grey",
    fixes: "grey",
    high: "show",
    medium: "hidden",
    low: "hidden",
    scroll: "high"
  },
  {
    title: "Medium-risk identifiers",
    text: "These narrow down your device and browser.",
    summary: "grey",
    fixes: "grey",
    high: "grey",
    medium: "show",
    low: "hidden",
    scroll: "medium"
  },
  {
    title: "Low-risk identifiers",
    text: "These add smaller amounts of entropy.",
    summary: "grey",
    fixes: "grey",
    high: "grey",
    medium: "grey",
    low: "show",
    scroll: "low"
  },
  {
    title: "Fixing your fingerprint",
    text: "Based on your results, these changes can reduce uniqueness.",
    summary: "grey",
    fixes: "show",
    high: "grey",
    medium: "grey",
    low: "grey",
    scroll: "high"
  }
];

let walkthroughIndex = 0;

function tagCardsByRisk() {
  document.querySelectorAll(".card").forEach(card => {
    const badge = card.querySelector(".badge");
    if (!badge) return;

    const text = badge.textContent.toLowerCase();
    if (text.includes("high")) card.dataset.risk = "high";
    else if (text.includes("medium")) card.dataset.risk = "medium";
    else card.dataset.risk = "low";
  });
}


function applyState(el, state) {
  if (!el) return;

  if (state === "show") {
    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.style.filter = "none";
    el.style.pointerEvents = "auto";
  }

  if (state === "grey") {
    el.style.visibility = "visible";
    el.style.opacity = "0.15";
    el.style.filter = "blur(1px)";
    el.style.pointerEvents = "none";
  }

  if (state === "hidden") {
    el.style.visibility = "hidden";
  }
}

function renderWalkthroughStep() {
  document.getElementById("walkthrough").hidden = false;
  const step = walkthroughSteps[walkthroughIndex];
  const state = step;

  document.getElementById("stepTitle").textContent = step.title || "";
  document.getElementById("stepDescription").textContent = step.text || "";

  applyState(
    document.getElementById("summary"),
    state.summary || "show"
  );

  applyState(
    document.getElementById("fixes"),
    state.fixes || "show"
  );

  document.querySelectorAll(".card").forEach(card => {
    const risk = card.dataset.risk;
    applyState(card, state[risk] || "show");
  });

  applyState(
    document.getElementById("walkthrough"), "show"
  );


  scroll(state.scroll);

  document.getElementById("prevStep").disabled = walkthroughIndex === 0;
  document.getElementById("nextStep").textContent =
    walkthroughIndex === walkthroughSteps.length - 1
      ? "Finish"
      : "Next";
}




function endWalkthrough() {
  document.getElementById("walkthrough").hidden = true;

  applyState(
    document.getElementById("summary"), "show"
  );

  applyState(
    document.getElementById("fixes"), "show"
  );

  document.querySelectorAll(".card").forEach(card => {
    const risk = card.dataset.risk;
    applyState(card, "show");
  });
}

document.getElementById("nextStep").onclick = () => {
  if (walkthroughIndex < walkthroughSteps.length - 1) {
    walkthroughIndex++;
    renderWalkthroughStep();
  } else {
    endWalkthrough();
  }
};

document.getElementById("prevStep").onclick = () => {
  if (walkthroughIndex > 0) {
    walkthroughIndex--;
    renderWalkthroughStep();
  }
};

document.getElementById("skipWalkthrough").onclick = endWalkthrough;


const originalAnalyse = document.getElementById("analyseBtn").onclick;

document.getElementById("analyseBtn").onclick = async () => {
  await originalAnalyse();

  tagCardsByRisk();

  walkthroughIndex = 0;
  renderWalkthroughStep();
};


function scroll(risk) {
    const headerHeight =
        document.getElementById("walkthrough")?.offsetHeight || 0;

    const card = document.querySelector(`.card[data-risk="${risk}"]`);
    if (!card) return;

    const y =
        card.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight -
        20; // optional extra padding

    window.scrollTo({
        top: y,
        behavior: "smooth"
    });
}
