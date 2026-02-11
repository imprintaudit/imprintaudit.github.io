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

  messageEl.textContent = "Thank you! Feedback submitted!";
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
    if (level === "") {
        return;
    }

    const cls =
        level.toLowerCase().includes("high") || level.toLowerCase().includes("hard") ? "high" :
        level.toLowerCase().includes("medium") ? "medium" :
        "low";

    return `<span class="badge ${cls}">${level}</span>`;
}

function addCard(title, value, risk, explanation) {
    const card = document.createElement("div");
    card.className = "card";
    card.id = id= title.toLowerCase();
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

    
    if (fingerprint.webgl.renderer && fingerprint.webgl.renderer.toLowerCase() !== 'unavailable') {
        fixes.push({
            issue: 'GPU reveals hardware details',
            fix: 'Use a privacy focused browser to obscure GPU information.',
            related: 'gpu',
            ease: 'Easy Fix'
        });
    }
    
    if (Number.isFinite(fingerprint.hardwareConcurrency) && fingerprint.hardwareConcurrency % 2 !== 0) {
        fixes.push({
            issue: 'Unusual number of CPU threads',
            fix: 'Consider using a privacy focused browser to obfuscate CPU threads.',
            related: 'cpu threads',
            ease: 'Easy Fix'
        });
    }
    
    if (fingerprint.audio && fingerprint.audio !== 'unavailable') {
        fixes.push({
            issue: 'Audio fingerprinting enabled',
            fix: 'Consider using a privacy focused browser to randomise audio context output.',
            related: 'audio',
            ease: 'Easy Fix'
        });
    }
    
    if (fingerprint.canvas && fingerprint.canvas !== 'unavailable') {
        fixes.push({
            issue: 'Canvas fingerprinting detected',
            fix: 'Consider using a browser or extension that prompts or randomizes canvas readouts.',
            related: 'canvas',
            ease: 'Easy Fix'
        });
    }
    
    
    if (
        fingerprint.supports &&
            (fingerprint.supports.filter ||
                fingerprint.supports.container ||
                fingerprint.supports.tech ||
                fingerprint.supports.accent)
            ) {
                fixes.push({
                    issue: 'Advanced CSS feature support',
                    fix: 'Consider using a privacy focused browser to standardise reported support.',
                    related: 'css supports',
                    ease: 'Easy Fix'
                });
            }
            
    if (Array.isArray(fingerprint.mime) && fingerprint.mime.length > 5) {
        fixes.push({
            issue: 'Extensive MIME type support',
            fix: "Consider clearing your browser's supported file types",
            related: 'mime types',
            ease: 'Medium Fix'
        });
    }
            
    if (fingerprint.languages.length > 2) {
        fixes.push({
            issue: 'High quantity of installed languages',
            fix: 'Consider deleting unnecessary languages.',
            related: 'languages',
            ease: 'Medium Fix'
        });
    }
    
    if (
        fingerprint.timezone &&
        fingerprint.languages &&
        fingerprint.languages.length &&
        !fingerprint.timezone.toLowerCase().includes(fingerprint.languages[0].split('-')[0])
    ) {
        fixes.push({
            issue: 'Locale and timezone mismatch',
            fix: 'Check your settings to ensure your locale and timezone match.',
            related: 'locale',
            ease: 'Medium Fix'
        });
    }
    
    if (Number.isFinite(fingerprint.fonts?.length) && fingerprint.fonts.length > 3) {
        fixes.push({
            issue: 'High font uniqueness',
            fix: 'Remove uncommon developer fonts like Fira Code, or use a privacy focused browser.',
            related: 'fonts',
            ease: 'Medium Fix'
        });
    }
    
    if (Number.isFinite(fingerprint.touch) && fingerprint.touch > 0 && fingerprint.touch !== 5) {
        fixes.push({
            issue: 'Unusual number of touchpoints',
            fix: 'Consider using a screen or device with a more standard number of touchpoints.',
            related: 'touchscreen',
            ease: 'Hard Fix'
        });
    }
    
    if (
        fingerprint.accessibility &&
        (fingerprint.accessibility.reducedMotion ||
            fingerprint.accessibility.contrast ||
            fingerprint.accessibility.reducedData)
        ) {
            fixes.push({
                issue: 'Unique accessibility preference combination',
                fix: 'Consider using accessibility defaults if privacy is critical.',
                related: 'accessibility',
                ease: 'Hard Fix'
            });
    }

    if (Number.isFinite(fingerprint.screen?.dpr) && ![1, 2].includes(fingerprint.screen.dpr)) {
        fixes.push({
            issue: 'Uncommon device pixel ratio',
            fix: 'Consider using a screen with a more common DPR.',
            related: 'screen',
            ease: 'Hard Fix'
        });
    }
    
    if (Number.isFinite(fingerprint.screen?.colorDepth) && fingerprint.screen.colorDepth !== 24) {
        fixes.push({
            issue: 'Unusual colour depth',
            fix: 'Consider using a screen with a more common colour depth.',
            related: 'colour',
            ease: 'Hard Fix'
        });
    }
    
    if (fingerprint.screen?.gamut && fingerprint.screen.gamut !== 'srgb') {
        fixes.push({
            issue: 'Wide colour gamut detected',
            fix: 'Consider using a screen with a more common colour gamut.',
            related: 'colour',
            ease: 'Hard Fix'
        });
    }

    if (!['1920x1080', '1366x768', '1536x864'].includes(`${fingerprint.screen.width}x${fingerprint.screen.height}`)) {
        fixes.push({
            issue: 'Uncommon screen resolution',
            fix: 'Use more common window sizes like 1920x1080 or 1366x768 to blend in with typical users.',
            related: 'screen',
            ease: 'Hard Fix'
        });
    }

    if (
        Number.isFinite(fingerprint.memory) &&
        ![4, 8, 16].includes(fingerprint.memory)
    ) {
        fixes.push({
            issue: 'Uncommon RAM size reported',
            fix: 'Consider using a more standard RAM count.',
            related: 'ram count',
            ease: 'Hard Fix'
        });
    }
    
    if (fixes.length === 0) {
        fixes.push({
            issue: 'No major fingerprinting risks detected',
            fix: 'Good job.',
            related: 'fonts',
            ease: ''
        });
    }
    
    section.innerHTML = `<h2>Fix My Fingerprint</h2>` +
    fixes.map(f => {
        const relatedEscaped = String(f.related).replace(/"/g, "&quot;"); // escape double quotes
        return `
        <div style="margin-bottom: 0.5rem" class="fix hover-trigger" onclick="highlight(&quot;${relatedEscaped}&quot;)">
        <strong>${f.issue} ${riskBadge(f.ease)}</strong>
        <p style="margin: 0.2rem 0; color: var(--muted)">${f.fix}</p>
        <span class="arrow">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14">
        <path d="M169.4 502.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 402.7 224 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 370.7-105.4-105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/>
        </svg>
            </span>
            </div>
            `;
        }).join('');

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


const walkthroughSteps = [
  {
    title: "What is a browser fingerprint?",
    text: "Every website you visit can see technical details about your browser and device, such as screen size, fonts, settings, and more. When combined, these create a 'browser fingerprint' that lets websites recognise and track your device, even without cookies.",
    summary: "hidden",
    fixes: "hidden",
    high: "hidden",
    medium: "hidden",
    low: "hidden",
    scroll: "none"
  },
  {
    title: "Your fingerprint",
    text: "Your browser fingerprint has been determined. You can view it encoded into a string, or download .json file containing more information. There is also a score that estimates how rare your fingerprint is. Higher scores mean fewer people look like you, so tracking is easier.</p><hr><p>Tip: click on any element with the copy icon to save it to your clipboard!",
    summary: "show",
    fixes: "hidden",
    high: "hidden",
    medium: "hidden",
    low: "hidden",
    scroll: "summary"
  },
  {
    title: "High threat identifiers",
    text: "These signals tend to be very stable and very unique, so they probably make the biggest contribution to tracking you.",
    summary: "grey",
    fixes: "grey",
    high: "show",
    medium: "hidden",
    low: "hidden",
    scroll: "high"
  },
  {
    title: "Medium threat identifiers",
    text: "These signals are either less stable, or less unique, so they are probably less useful for tracking you.",
    summary: "grey",
    fixes: "grey",
    high: "grey",
    medium: "show",
    low: "hidden",
    scroll: "medium"
  },
  {
    title: "Low threat identifiers",
    text: "These signals are both low stability and low uniqueness, so they are not very useful for tracking you. However, it is still beneficial to be aware of them.",
    summary: "grey",
    fixes: "grey",
    high: "grey",
    medium: "grey",
    low: "show",
    scroll: "low"
  },
  {
    title: "Fixing your fingerprint",
    text: "These suggestions are based on your fingerprint, and will help you blend in better with common browser setups.</p><hr><p>Tip: click on any suggested fix to view the related metric!",
    summary: "grey",
    fixes: "show",
    high: "grey",
    medium: "grey",
    low: "grey",
    scroll: "fixes"
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
  if (state !== "show") {
    applyState(el, "show");
  }

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
  document.getElementById("stepDescription").innerHTML = step.text || "";

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

const actions = document.querySelector(".walkthrough-buttons");
const prevBtn = document.getElementById("prevStep");
const skipBtn = document.getElementById("skipWalkthrough");
const nextBtn = document.getElementById("nextStep");

prevBtn.style.display = walkthroughIndex === 0 ? "none" : "initial";
skipBtn.style.display =
  walkthroughIndex === walkthroughSteps.length - 1 ? "none" : "initial";

prevBtn.disabled = walkthroughIndex === 0;
nextBtn.textContent =
  walkthroughIndex === walkthroughSteps.length - 1 ? "Finish" : "Next";

const shouldExpandNext =
  prevBtn.style.display === "none" ||
  skipBtn.style.display === "none";

actions.classList.toggle("expand-next", shouldExpandNext);
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
    let card;

    const headerHeight =
    document.getElementById("walkthrough")?.offsetHeight || 0;
    
    if (risk == "none") {
        return;
    }
    
    if (risk == "fixes") {
        card = document.getElementById("fixmyfingerprint");
    } else if (risk == "summary") {
        card = document.getElementById("summary");
    } else if (['high', 'medium', 'low'].includes(risk)) {
        card = document.querySelector(`.card[data-risk="${risk}"]`);
    } else {
        card = document.getElementById(risk);
    }
    if (!card) return;

    const y =
        card.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight -
        20;

    window.scrollTo({
        top: y,
        behavior: "smooth"
    });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function highlight(focus) {
    scroll(focus);
    document.querySelectorAll('.card').forEach(card => {
        if (card.id === focus) {
            applyState(card, 'show');
        } else {
            applyState(card, 'grey');
        }
    });

    await delay(1000);
    
    document.querySelectorAll('.card').forEach(card => {
        applyState(card, 'show');
    });
}
