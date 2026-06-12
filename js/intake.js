/* TribalKnowledge intake form.
 * Generates a markdown intake packet matching the pipeline's intake-questionnaire
 * format, so the file drops straight into jobs/<customer>-<machine>/00-intake/
 * (pipeline-runbook.md, Step 0). Nothing is sent automatically.
 */
(function () {
  "use strict";

  var form = document.getElementById("intake-form");
  var result = document.getElementById("result");
  var preview = document.getElementById("packet-preview");
  var lastPacket = "";
  var lastFilename = "intake.md";

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function orBlank(s) {
    return s ? s : "_(not answered)_";
  }

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "x";
  }

  function checkedValues(name) {
    var out = [];
    var els = form.querySelectorAll('input[name="' + name + '"]:checked');
    for (var i = 0; i < els.length; i++) out.push(els[i].value);
    return out;
  }

  function buildPacket() {
    var company = val("company");
    var machine = val("machine");
    var today = new Date().toISOString().slice(0, 10);
    var materials = checkedValues("materials");
    var tierEl = form.querySelector('input[name="tier"]:checked');
    var tier = tierEl ? tierEl.value : "";

    var materialsBlock = materials.length
      ? materials.map(function (m) { return "- [ ] " + m; }).join("\n")
      : "_(none indicated — follow up in Step 0 review)_";

    return [
      "# Intake Questionnaire — " + company + " / " + machine,
      "",
      "> Generated from the TribalKnowledge website intake form on " + today + ".",
      "> Pipeline: file under `jobs/" + slug(company) + "-" + slug(machine) + "/00-intake/` and begin Step 0 of pipeline-runbook.md.",
      "",
      "**Plant / company:** " + company,
      "**Plant location:** " + orBlank(val("location")),
      "**Machine or line name (what your people actually call it):** " + machine,
      "**Contact name and role:** " + val("contact-name") + " — " + val("role"),
      "**Best phone/email for quick questions:** " + orBlank(val("phone")) + " / " + val("email"),
      "**Control platform:** " + orBlank(val("platform")),
      "**Pricing tier requested:** " + tier,
      "",
      "---",
      "",
      "### 1. What does this machine do?",
      orBlank(val("q1")),
      "",
      "### 2. Who knows this machine best, and how long until they retire or leave?",
      orBlank(val("q2")),
      "",
      "### 3. What are the known quirks?",
      orBlank(val("q3")),
      "",
      "### 4. What's the biggest recurring failure?",
      orBlank(val("q4")),
      "",
      "### 5. When this machine is down, what does an hour of downtime cost (roughly)?",
      orBlank(val("q5")),
      "",
      "### 6. Have there been modifications since the original install?",
      orBlank(val("q6")),
      "",
      "### 7. Is the program in the PLC the same as the file being sent?",
      orBlank(val("q7")),
      "",
      "### 8. Anything you specifically want the documentation to cover?",
      orBlank(val("q8")),
      "",
      "---",
      "",
      "## Materials the customer expects to send (Step 0 inventory)",
      materialsBlock,
      "",
      "*Send everything with this packet to contact@slewfoot.dev — ZIP folders are fine; ask for an upload link for files over 20 MB.*",
      ""
    ].join("\n");
  }

  function download(packet, filename) {
    var blob = new Blob([packet], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    lastPacket = buildPacket();
    lastFilename = "intake-" + slug(val("company")) + "-" + slug(val("machine")) + ".md";

    preview.textContent = lastPacket;
    result.classList.add("show");
    download(lastPacket, lastFilename);
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("btn-download").addEventListener("click", function () {
    if (lastPacket) download(lastPacket, lastFilename);
  });

  document.getElementById("btn-copy").addEventListener("click", function () {
    if (!lastPacket) return;
    var btn = this;
    function done() {
      var prior = btn.textContent;
      btn.textContent = "Copied ✔";
      setTimeout(function () { btn.textContent = prior; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastPacket).then(done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = lastPacket;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    }
  });

  document.getElementById("btn-mail").addEventListener("click", function () {
    if (!lastPacket) return;
    var subject = "PLC documentation intake — " + val("company") + " / " + val("machine");
    // mailto bodies have practical length limits; trim if needed and rely on the attachment.
    var body = lastPacket;
    var note = "\n\n[If this packet appears cut off, the downloaded .md file has the complete version — please attach it.]";
    if (body.length > 1500) body = body.slice(0, 1500) + note;
    body += "\n\nATTACH: the downloaded intake .md, your PLC export, drawings, HMI screenshots, photos.";
    location.href = "mailto:contact@slewfoot.dev?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
})();
