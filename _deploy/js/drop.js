(function () {
  "use strict";

  // Scroll-driven turntable for the drop page. See css/drop.css for why
  // this is a CSS transform rather than WebGL.
  //
  // The model: SEQ is a flat list of faces — front, back, front, back —
  // walking through every colourway. Scroll maps to a rotation angle.
  // Every 180 degrees a different face points at the visitor, so we only
  // ever need two <img> elements: the one being looked at, and the one
  // being rotated into view. Swapping the hidden one is invisible.

  var COLOURWAYS = [
    { name: "Black",    file: "black",           swatch: "#1a1a1a" },
    { name: "Navy",     file: "navy",            swatch: "#25314b" },
    { name: "White",    file: "white",           swatch: "#efece6" },
    { name: "Green",    file: "green",           swatch: "#4a5c43" },
    { name: "Peach",    file: "peach",           swatch: "#e8b9a0" },
    { name: "Silver",   file: "silver",          swatch: "#c3c4c2" },
    { name: "Stressed", file: "stressed",        swatch: "#8a7f72" }
  ];

  var BASE = "images/drop/";
  var HALF = 180;             // degrees per face
  var SCROLL_PER_FACE = 0.62; // viewport heights of scroll each face gets

  var SEQ = [];
  COLOURWAYS.forEach(function (c) {
    SEQ.push({ src: BASE + c.file + "-front.webp", name: c.name, side: "Front" });
    SEQ.push({ src: BASE + c.file + "-back.webp",  name: c.name, side: "Back"  });
  });

  function init() {
    var track = document.querySelector("[data-drop-track]");
    var shirt = document.querySelector("[data-drop-shirt]");
    var faceA = document.querySelector("[data-drop-face='a']");
    var faceB = document.querySelector("[data-drop-face='b']");
    var colourEl = document.querySelector("[data-drop-colour]");
    var sideEl = document.querySelector("[data-drop-side]");
    var barEl = document.querySelector("[data-drop-bar]");
    var hintEl = document.querySelector("[data-drop-hint]");

    if (!track || !shirt || !faceA || !faceB) return;

    // Reduced motion: leave the first face on screen and never build the
    // track. The blanket rule in tokens.css already kills transitions;
    // this stops us creating six screens of empty scroll as well.
    var reduce = window.matchMedia &&
                 window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      paintFace(faceA, SEQ[0]);
      setLabel(SEQ[0]);
      return;
    }

    // Preload every face before the track exists, so a fast scroller
    // never lands on a blank rotation. Total payload is under a megabyte.
    SEQ.forEach(function (f) {
      var img = new Image();
      img.src = f.src;
    });

    var faces = SEQ.length;
    var totalDeg = faces * HALF;
    var lastIndex = -1;
    var ticking = false;
    var hintHidden = false;

    track.style.height = (faces * SCROLL_PER_FACE * 100) + "svh";
    track.setAttribute("data-ready", "true");

    paintFace(faceA, SEQ[0]);
    paintFace(faceB, SEQ[1]);
    setLabel(SEQ[0]);

    function paintFace(el, face) {
      if (el.getAttribute("src") !== face.src) el.setAttribute("src", face.src);
      el.setAttribute("alt", "Ember tee, " + face.name + ", " + face.side.toLowerCase());
    }

    function setLabel(face) {
      if (colourEl) colourEl.textContent = face.name;
      if (sideEl) sideEl.textContent = face.side;
    }

    function progress() {
      var rect = track.getBoundingClientRect();
      var travel = track.offsetHeight - window.innerHeight;
      if (travel <= 0) return 0;
      var p = -rect.top / travel;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    function frame() {
      ticking = false;

      var p = progress();
      // Stop a hair short of the final half turn so the last face is held
      // square to the viewer rather than rotating away as the track ends.
      var angle = p * (totalDeg - HALF);

      shirt.style.transform = "rotateY(" + angle.toFixed(2) + "deg)";
      if (barEl) barEl.style.width = (p * 100).toFixed(2) + "%";

      if (!hintHidden && p > 0.02 && hintEl) {
        hintEl.setAttribute("data-gone", "true");
        hintHidden = true;
      }

      // Which face is square to the viewer. The +90 puts the boundary at
      // the edge-on moment, where the swap cannot be seen.
      var index = Math.floor((angle + 90) / HALF);
      if (index < 0) index = 0;
      if (index > faces - 1) index = faces - 1;

      if (index !== lastIndex) {
        lastIndex = index;
        var visible = SEQ[index];
        var hidden = SEQ[Math.min(index + 1, faces - 1)];

        // Even indices land on face A, odd on face B — that is just which
        // element is currently pointing forward.
        if (index % 2 === 0) {
          paintFace(faceA, visible);
          paintFace(faceB, hidden);
        } else {
          paintFace(faceB, visible);
          paintFace(faceA, hidden);
        }
        setLabel(visible);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(frame);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame();

    // Swatches under the closing panel, built from the same source of
    // truth as the rotation so the two can never drift apart.
    var swatchWrap = document.querySelector("[data-drop-swatches]");
    if (swatchWrap) {
      COLOURWAYS.forEach(function (c) {
        var s = document.createElement("span");
        s.className = "drop-swatch";
        s.style.background = c.swatch;
        s.title = c.name;
        swatchWrap.appendChild(s);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
