(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Advertises the live offers. Builds its own markup into any element
  // carrying [data-offer-banner], so a page opts in with one empty div and
  // there is no copy to keep in sync across files — the numbers come from
  // js/offers.js, the same module that prices the basket. Change an offer
  // there and both the advert and the till follow.
  // ---------------------------------------------------------------------
  function init() {
    var hosts = document.querySelectorAll("[data-offer-banner]");
    if (!hosts.length || !window.EmberOffers) return;

    var O = window.EmberOffers;
    var html =
      '<div class="offer-strip">' +
        '<span class="offer-pill">' +
          '<span class="offer-pill__n">' + O.BULK_PERCENT + '%</span>' +
          '<span class="offer-pill__t">off ' + O.BULK_MIN_PIECES + ' pieces or more</span>' +
        '</span>' +
        '<span class="offer-sep" aria-hidden="true"></span>' +
        '<span class="offer-pill">' +
          '<span class="offer-pill__n">' + O.PAIR_PRICE + ' JOD</span>' +
          '<span class="offer-pill__t">any shirt + any accessory</span>' +
        '</span>' +
        '<span class="offer-note">Applied automatically at checkout.</span>' +
      "</div>";

    hosts.forEach(function (h) { h.innerHTML = html; h.hidden = false; });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
