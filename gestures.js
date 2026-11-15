// ----- Touch gestures: swipe between pages, hours and days; pull down to refresh -----
const SWIPE_MIN = 60;     // pixels a finger must travel sideways to count as a swipe
const PTR_TRIGGER = 70;   // pixels to pull down before letting go refreshes
const ptr = document.getElementById("ptr");
const ptrText = document.getElementById("ptr-text");
let touch = null;
let refreshing = false;

// Places where a sideways drag means something else (moving the map, a slider, typing...)
function swipeBlocked(target) {
  return Boolean(target.closest(".radar-map, input, textarea, .fav-handle, .suggestions, .seg"));
}

document.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      touch = null;
      return;
    }
    const point = event.touches[0];
    touch = {
      x: point.clientX,
      y: point.clientY,
      time: Date.now(),
      axis: null,
      pullDistance: 0,
      blocked: swipeBlocked(event.target),
      // Pull-to-refresh only works at the very top of the Home page
      canPull: currentPageId() === "page-home" && window.scrollY <= 0 && !refreshing && !event.target.closest(".search"),
    };
  },
  { passive: true }
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (!touch) return;
    const point = event.touches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;

    // Decide once whether this is a sideways or an up/down movement
    if (!touch.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      touch.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    if (touch.axis === "y" && touch.canPull && dy > 0) {
      event.preventDefault(); // stop the page from bouncing while we pull
      touch.pullDistance = Math.min(dy * 0.5, 110); // 0.5 makes it feel "heavy", like other apps
      showPull(touch.pullDistance);
    }
  },
  { passive: false }
);

document.addEventListener("touchend", (event) => {
  if (!touch) return;
  const point = event.changedTouches[0];
  const dx = point.clientX - touch.x;
  const dy = point.clientY - touch.y;
  const quick = Date.now() - touch.time < 1000; // a flick, not a slow drag

  if (touch.pullDistance > 0) {
    if (touch.pullDistance >= PTR_TRIGGER) pullRefresh();
    else hidePull();
  } else if (touch.axis === "x" && !touch.blocked && quick && Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > 1.5 * Math.abs(dy)) {
    handleSwipe(dx < 0 ? 1 : -1); // finger moved left = go forward
  }
  touch = null;
});

document.addEventListener("touchcancel", () => {
  if (touch && touch.pullDistance > 0) hidePull();
  touch = null;
});

// direction: +1 = next, -1 = previous
function handleSwipe(direction) {
  const page = currentPageId();

  if (page === "page-hour") {
    if (changeHour(direction)) nudge(page, direction);
  } else if (page === "page-day") {
    if (changeDay(direction)) nudge(page, direction);
  } else if (page.startsWith("page-") && !TAB_ORDER.includes(page)) {
    if (direction === -1) goBack(); // other sub pages: swipe right to go back
  } else {
    const next = TAB_ORDER.indexOf(activeTab) + direction;
    if (next < 0 || next >= TAB_ORDER.length) return;
    document.body.dataset.slide = direction > 0 ? "next" : "prev"; // picks the slide-in direction in CSS
    goToTab(TAB_ORDER[next]);
    setTimeout(() => delete document.body.dataset.slide, 400);
  }
}

// A small slide animation when the hour or day changes
function nudge(pageId, direction) {
  const area = document.querySelector(`#${pageId} .swipe-area`);
  area.classList.remove("nudge-next", "nudge-prev");
  void area.offsetWidth; // restart the animation
  area.classList.add(direction > 0 ? "nudge-next" : "nudge-prev");
}

// ---- Pull-to-refresh indicator ----
function showPull(distance) {
  const armed = distance >= PTR_TRIGGER;
  ptr.classList.add("visible");
  ptr.classList.toggle("armed", armed);
  ptr.style.transform = `translate(-50%, ${distance}px)`;
  ptrText.textContent = armed ? t("releaseRefresh") : t("pullRefresh");
}

function hidePull() {
  ptr.classList.remove("visible", "armed", "loading");
  ptr.style.transform = "";
}

async function pullRefresh() {
  refreshing = true;
  ptr.classList.add("loading");
  ptr.style.transform = "translate(-50%, 60px)";
  ptrText.textContent = t("updating");
  await Promise.all([refreshWeather(), sleep(600)]); // spin at least a moment, so it doesn't just flash
  hidePull();
  refreshing = false;
}
