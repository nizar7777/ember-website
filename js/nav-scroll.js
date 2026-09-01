(function () {
  "use strict";

  // The nav pill starts out of the way so the first view belongs to the
  // page itself, then drops in once the visitor has scrolled away from it.
  //
  // The hidden state is visibility:hidden in CSS rather than an aria-hidden
  // attribute, so the links leave the tab order while off screen without
  // hiding focusable children from assistive tech — which aria-hidden on a
  // container full of links would do.

  var SHOW_AFTER = 0.6;  // fraction of the viewport scrolled before it appears
  var MIN_PX = 320;      // floor, so short viewports do not reveal it instantly
  var THROTTLE = 80;

  // Pointer proximity: reaching toward where the nav lives brings it back
  // even when the scroll rule alone would keep it away, so the visitor is
  // never stuck hunting for it near the top of a page.
  //
  // Measured against the nav's own box rather than a flat "top of screen"
  // band, so it still behaves if the nav is ever moved or resized. The
  // band is generous because the nav is hidden while you are reaching for
  // it - you are aiming at remembered empty space, not a visible target.
  var NEAR_PX = 120;

  // --- Skip link ---------------------------------------------------------
  // Following a same-page anchor moves the scroll position but not always
  // the focus, so the next Tab press can drop the visitor back at the top
  // of the document. Webflow's link module also tags this link w--current
  // and swallows the activation, so handle it directly.
  function initSkipLink() {
    var link = document.querySelector(".skip-link");
    if (!link) return;

    // Capture at the document so this runs before Webflow's link handler,
    // which otherwise consumes the activation.
    document.addEventListener("click", function (e) {
      var hit = e.target.closest && e.target.closest(".skip-link");
      if (!hit) return;
      var target = document.querySelector(hit.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, true);
  }

  function init() {
    initSkipLink();
    var nav = document.querySelector(".container-4");
    if (!nav) return;

    nav.classList.add("nav-autohide");

    var pending = false;
    var pointerNear = false;

    function update() {
      pending = false;
      var past = window.pageYOffset > Math.max(window.innerHeight * SHOW_AFTER, MIN_PX);
      nav.classList.toggle("is-visible", past || pointerNear);
    }

    function onScroll() {
      if (pending) return;
      pending = true;
      window.setTimeout(update, THROTTLE);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Hover only. A touch device has no pointer to be "near" anything, and
    // coarse-pointer taps would otherwise flash the nav on every scroll
    // drag. matchMedia is checked live rather than once, so plugging in a
    // mouse on a tablet starts working without a reload.
    var fine = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;

    document.addEventListener("mousemove", function (e) {
      if (fine && !fine.matches) return;

      // getBoundingClientRect on the hidden nav still reports its laid-out
      // box, but it is translated up out of view, so measure the band from
      // the top of the viewport down past where the nav sits when shown.
      var h = nav.offsetHeight || 80;
      var near = e.clientY <= h + NEAR_PX;

      if (near === pointerNear) return;
      pointerNear = near;
      update();
    }, { passive: true });

    // Leaving the window entirely should not leave the nav stuck open.
    document.addEventListener("mouseleave", function () {
      if (!pointerNear) return;
      pointerNear = false;
      update();
    });

    // Deep links and refreshes can land mid-page; decide from where we are
    // rather than assuming the top.
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
