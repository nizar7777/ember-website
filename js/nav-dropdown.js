(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // The mobile menu, in place of Webflow's runtime.
  //
  // js/webflow.js is 108 KB over the wire and jQuery another 31 KB, and
  // between them they were doing exactly one thing on this site: adding
  // and removing the class "w--open" on the nav dropdown. Nothing else
  // Webflow ships was in use — audited 29 Aug 2026: no IX2 interactions
  // (zero data-w-id attributes anywhere), no slider, tabs or lightbox, and
  // the forms are driven by js/contact-forms.js, which deliberately hangs
  // off .ember-form BECAUSE Webflow's form module claims every .w-form on
  // the page and warns about them.
  //
  // The CSS contract is small enough to reimplement honestly:
  //   .w-dropdown-list         { display: none }
  //   .w-dropdown-list.w--open { display: block }
  // plus the same class on the toggle for its own styling. That is all
  // this file does. The w-mod-js / w-mod-touch classes Webflow also sets
  // are already handled by the inline script in each page's <head>.
  // ---------------------------------------------------------------------

  var OPEN = "w--open";

  function listFor(toggle) {
    var root = toggle.closest(".w-dropdown");
    return root ? root.querySelector(".w-dropdown-list") : null;
  }

  function setOpen(toggle, open) {
    var list = listFor(toggle);
    if (!list) return;
    toggle.classList.toggle(OPEN, open);
    list.classList.toggle(OPEN, open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeAll(except) {
    document.querySelectorAll(".w-dropdown-toggle." + OPEN).forEach(function (t) {
      if (t !== except) setOpen(t, false);
    });
  }

  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".w-dropdown-toggle");

    if (toggle) {
      var willOpen = !toggle.classList.contains(OPEN);
      closeAll(toggle);
      setOpen(toggle, willOpen);
      return;
    }

    // A click on a link inside the menu should let the navigation happen
    // and leave nothing open behind it; a click anywhere else just closes.
    closeAll(null);
  });

  // The toggle is a div with role="button" tabindex="0", so it does not
  // get Enter/Space activation for free the way a real <button> would.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var open = document.querySelector(".w-dropdown-toggle." + OPEN);
      if (open) { setOpen(open, false); open.focus(); }
      return;
    }
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    var toggle = e.target.closest && e.target.closest(".w-dropdown-toggle");
    if (!toggle) return;
    e.preventDefault();
    var willOpen = !toggle.classList.contains(OPEN);
    closeAll(toggle);
    setOpen(toggle, willOpen);
  });

  document.querySelectorAll(".w-dropdown-toggle").forEach(function (t) {
    t.setAttribute("aria-expanded", "false");
  });
})();
