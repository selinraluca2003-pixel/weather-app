const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

// pageId: the page to show
// tabPageId: which menu tab to highlight (defaults to the same page)
// scrollY: where to scroll to (defaults to the top)
function showPage(pageId, tabPageId = pageId, scrollY = 0) {
  pages.forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.page === tabPageId);
  });
  window.scrollTo(0, scrollY);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showPage(tab.dataset.page));
});