(async function () {
  // Get saved opacity (default 1 = fully dark)
  let opacity = 1;
  try {
    const result = await chrome.storage.local.get('focusfilterOpacity');
    if (result.focusfilterOpacity !== undefined) {
      opacity = result.focusfilterOpacity;
    }
  } catch (e) {
    // Fail silently, use default opacity
  }

  // Toggle off if already active
  if (document.getElementById("focusfilter-overlay")) {
    document.getElementById("focusfilter-overlay").remove();
    document.getElementById("focusfilter-rect").remove();
    return;
  }

  // Create dark overlay
  const overlay = document.createElement("div");
  overlay.id = "focusfilter-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    opacity: ${opacity};
    z-index: 99998;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);

  // Create visible focusfilter rectangle
  const rect = document.createElement("div");
  rect.id = "focusfilter-rect";
  rect.style.cssText = `
    position: fixed;
    top: 40vh;
    left: 40vw;
    width: 20vw;
    height: 20vh;
    border: 2px dashed #fff;
    z-index: 99999;
    pointer-events: none;
  `;
  document.body.appendChild(rect);

  // Move handle (bottom-left corner)
  const moveHandle = document.createElement("div");
  moveHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.8);
    cursor: move;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    font-family: sans-serif;
    user-select: none;
    z-index: 100000;
    pointer-events: auto;
  `;
  moveHandle.textContent = "✥";
  rect.appendChild(moveHandle);

  // Resize handle (bottom-right corner)
  const resizeHandle = document.createElement("div");
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.8);
    cursor: nwse-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    font-family: sans-serif;
    user-select: none;
    z-index: 100000;
    pointer-events: auto;
  `;
  resizeHandle.textContent = "⤡";
  rect.appendChild(resizeHandle);

  let dragging = false,
    offsetX = 0,
    offsetY = 0,
    resizing = false,
    startW = 0,
    startH = 0,
    startX = 0,
    startY = 0;

  moveHandle.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.clientX - rect.offsetLeft;
    offsetY = e.clientY - rect.offsetTop;
    e.preventDefault();
  });

  resizeHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    resizing = true;
    startW = rect.offsetWidth;
    startH = rect.offsetHeight;
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (dragging) {
      rect.style.left = e.clientX - offsetX + "px";
      rect.style.top = e.clientY - offsetY + "px";
      updateClip();
    } else if (resizing) {
      rect.style.width = startW + (e.clientX - startX) + "px";
      rect.style.height = startH + (e.clientY - startY) + "px";
      updateClip();
    }
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    resizing = false;
  });

  function updateClip() {
    const r = rect.getBoundingClientRect(),
      l = (r.left / window.innerWidth) * 100,
      t = (r.top / window.innerHeight) * 100,
      w = (r.right / window.innerWidth) * 100,
      b = (r.bottom / window.innerHeight) * 100;
    overlay.style.clipPath = `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%,
      0% 0%, 
      ${l}% ${t}%, ${l}% ${b}%, 
      ${w}% ${b}%, ${w}% ${t}%, 
      ${l}% ${t}%
    )`;
  }

  updateClip();

  // Listen for opacity changes from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "setOpacity") {
      const newOpacity = Number(msg.value);
      if (!isNaN(newOpacity) && newOpacity >= 0 && newOpacity <= 1) {
        overlay.style.opacity = newOpacity;
      }
    }
  });
})();
