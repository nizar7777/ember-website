(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // The two live offers, in one place. Anything that prices a basket reads
  // from here rather than doing its own arithmetic, so the checkout total,
  // the emailed order and whatever the store advertises can never drift
  // apart.
  //
  //   BULK  — 3 pieces or more, 16% off the whole basket.
  //   PAIR  — a shirt bought with an accessory costs 16 JOD together
  //           (they are 12 + 6 = 18 apart, so the pair saves 2).
  //
  // THEY DO NOT STACK. The basket is priced BOTH ways and the customer is
  // given whichever is cheaper — the ordinary retail convention, and the
  // one that cannot be gamed into compounding to near-nothing. Flip
  // STACK_OFFERS to true if you decide you want pair pricing to also take
  // the further 16% off; the maths is already wired for it.
  // ---------------------------------------------------------------------
  var BULK_MIN_PIECES = 3;
  var BULK_PERCENT    = 16;
  var PAIR_PRICE      = 16;
  var STACK_OFFERS    = false;

  function parsePrice(str) {
    var m = String(str || "").match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  // A cart line records what kind of product it is (set when it is added to
  // the basket). Older baskets saved before that field existed still need
  // to price correctly, so fall back to reading the SKU, then to the fact
  // that only shirts carry a colour.
  function typeOf(item) {
    if (item.type) return item.type;
    var sku = String(item.sku || "").toLowerCase();
    if (sku.indexOf("acc-") === 0) return "accessories";
    if (sku.indexOf("mer-") === 0) return "merch";
    if (sku.indexOf("uni-") === 0) return "uniform";
    return item.color ? "t-shirts" : "";
  }

  // One entry per physical piece, so a line with qty 3 can have one of its
  // pieces paired and the other two priced normally.
  function toUnits(items) {
    var units = [];
    (items || []).forEach(function (item) {
      var price = parsePrice(item.price);
      var kind = typeOf(item);
      for (var i = 0; i < (item.qty || 1); i++) units.push({ price: price, kind: kind });
    });
    return units;
  }

  function sum(units) {
    return units.reduce(function (t, u) { return t + u.price; }, 0);
  }

  // Pair the dearest shirt with the dearest accessory first: every pair
  // costs the same flat 16, so pairing the expensive pieces saves the most
  // (a washed shirt at 14 + 6 saves 4, a standard 12 + 6 saves 2).
  function priceWithPairs(units) {
    var shirts = units.filter(function (u) { return u.kind === "t-shirts"; })
                      .sort(function (a, b) { return b.price - a.price; });
    var extras = units.filter(function (u) { return u.kind === "accessories"; })
                      .sort(function (a, b) { return b.price - a.price; });
    var rest   = units.filter(function (u) { return u.kind !== "t-shirts" && u.kind !== "accessories"; });

    var pairs = 0, total = 0;
    var n = Math.min(shirts.length, extras.length);
    for (var i = 0; i < n; i++) {
      // Never let the "offer" cost more than buying the two separately.
      if (shirts[i].price + extras[i].price <= PAIR_PRICE) break;
      total += PAIR_PRICE;
      pairs++;
    }
    total += sum(shirts.slice(pairs)) + sum(extras.slice(pairs)) + sum(rest);
    return { total: total, pairs: pairs };
  }

  // Uniform is quoted per job ("on QTY"), so it parses to 0. Those pieces
  // must not count toward the 3-piece threshold, or an enquiry for uniforms
  // would silently unlock 16% off a basket of shirts.
  function payingPieces(units) {
    return units.filter(function (u) { return u.price > 0; }).length;
  }

  function compute(items) {
    var units = toUnits(items);
    var subtotal = sum(units);
    var pieces = payingPieces(units);

    var pair = priceWithPairs(units);
    var bulkEligible = pieces >= BULK_MIN_PIECES;

    var bulkTotal = bulkEligible ? subtotal * (1 - BULK_PERCENT / 100) : subtotal;
    var pairTotal = pair.total;
    var stackedTotal = (STACK_OFFERS && bulkEligible) ? pairTotal * (1 - BULK_PERCENT / 100) : Infinity;

    var total = Math.min(subtotal, bulkTotal, pairTotal, stackedTotal);
    var label = "";
    if (total >= subtotal) label = "";
    else if (total === stackedTotal) label = pair.pairs + " pair" + (pair.pairs > 1 ? "s" : "") + " + " + BULK_PERCENT + "% off " + BULK_MIN_PIECES + "+";
    else if (total === bulkTotal && bulkEligible) label = BULK_PERCENT + "% off (" + BULK_MIN_PIECES + "+ pieces)";
    else if (pair.pairs) label = pair.pairs + " shirt + accessory pair" + (pair.pairs > 1 ? "s" : "") + " at " + PAIR_PRICE + " JOD";

    return {
      subtotal: subtotal,
      total: total,
      discount: Math.max(0, subtotal - total),
      label: label,
      pieces: pieces,
      pairs: pair.pairs,
      bulkEligible: bulkEligible,
      // How many more pieces until the bulk discount kicks in — lets the
      // basket nudge someone who is one item away.
      piecesToBulk: Math.max(0, BULK_MIN_PIECES - pieces)
    };
  }

  window.EmberOffers = {
    compute: compute,
    BULK_MIN_PIECES: BULK_MIN_PIECES,
    BULK_PERCENT: BULK_PERCENT,
    PAIR_PRICE: PAIR_PRICE
  };
})();
