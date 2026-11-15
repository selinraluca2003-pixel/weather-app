// ----- Moving between pages -----
// Tab pages (Home, Today...) sit side by side. Sub pages (hour, day, settings) open on top of
// them and are added to the browser history, so Android's back button closes them instead of the app.
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const TAB_ORDER = [...tabs].map((tab) => tab.dataset.page);

const pageStack = []; // where to go back to: [{ page, tab, scrollY }]
let activeTab = "page-home";
let pendingTab = null;

// pageId: the page to show; tabId: which menu tab to highlight; scrollY: where to scroll to
function showPage(pageId, tabId = pageId, scrollY = 0) {
  pages.forEach((page) => page.classList.toggle("active", page.id === pageId));
  activeTab = tabId;
  tabs.forEach((tab) => {
    const on = tab.dataset.page === tabId;
    tab.classList.toggle("active", on);
    if (on) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  window.scrollTo(0, scrollY);
  document.dispatchEvent(new CustomEvent("pagechange", { detail: { pageId } }));
}

function currentPageId() {
  return document.querySelector(".page.active").id;
}

function openSubPage(pageId) {
  pageStack.push({ page: currentPageId(), tab: activeTab, scrollY: window.scrollY });
  history.pushState({ depth: pageStack.length }, "");
  showPage(pageId, activeTab);
}

function goBack() {
  if (pageStack.length) history.back();
}

function goToTab(pageId) {
  if (pageStack.length) {
    // Close all open sub pages first (one history jump), then show the tab
    pendingTab = pageId;
    const depth = pageStack.length;
    pageStack.length = 0;
    history.go(-depth);
  } else {
    showPage(pageId);
  }
}

window.addEventListener("popstate", () => {
  if (pendingTab) {
    const page = pendingTab;
    pendingTab = null;
    showPage(page);
    return;
  }
  const previous = pageStack.pop();
  if (previous) showPage(previous.page, previous.tab, previous.scrollY);
});

tabs.forEach((tab) => tab.addEventListener("click", () => goToTab(tab.dataset.page)));

// Every "‹ Back" button
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-back]")) goBack();
});

// Home screen shortcuts open the app with ?page=radar (or today, 14d): jump straight there
(function openShortcutPage() {
  const shortcuts = { radar: "page-radar", today: "page-today", "48h": "page-48h", "14d": "page-14d" };
  const page = shortcuts[new URLSearchParams(location.search).get("page")];
  if (!page) return;
  history.replaceState(null, "", location.pathname); // tidy the address, so a reload opens Home again
  // Wait until every script has loaded (the radar needs radar.js)
  window.addEventListener("load", () => showPage(page));
})();
