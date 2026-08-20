/* ═══════════════════ DIE SEITEN FUER DIE SUCHE
 *
 * Die Startseite ist fuer alles zustaendig und damit fuer nichts. Eine
 * Seite kann bei einer Suchmaschine fuer GENAU EINE Sache stehen.
 *
 * Deshalb sechs eigene Seiten, jede fuer eine Suchabsicht, jede mit
 * eigener Adresse, eigener Ueberschrift und eigenem Text.
 *
 * DREI REGELN, die sich aus dem ergeben, was ich am 20.08.2026
 * nachgesehen habe:
 *
 *   1. NIEMAND SUCHT NACH "DIGITALER BUTLER". Das ist ein Markenwort
 *      ohne Suchvolumen. Menschen suchen ihr Problem: "Rechnungen aus
 *      Gmail exportieren", "Kuendigungsfrist verpasst". Also steht das
 *      Problem in der Ueberschrift, nicht der Produktname.
 *
 *   2. DIE ANTWORT KOMMT ZUERST, nicht die Werbung. Sprachmodelle
 *      zitieren die Seite, die eine Frage direkt beantwortet. Eine
 *      Seite, die erst drei Absaetze lang von sich erzaehlt, wird nicht
 *      zitiert, und ein Mensch klickt sie weg.
 *
 *   3. ALLES IN KLARTEXT IM HTML. Kein JavaScript, das den Text
 *      einsetzt. Genau daran ist die Startseite fast gescheitert: Ohne
 *      JavaScript standen dort 754 Zeichen, davon die halbe IBAN.
 *
 * Diese Datei baut die Seiten. Der Inhalt steht in seiten.json, damit
 * sich ein Text aendern laesst, ohne HTML anzufassen.
 */
const fs = require("fs");
const path = require("path");

const ORDNER = path.join(__dirname);

function h(text) {
  return String(text || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Eine Seite, ganz aus Klartext. Kein Skript ausser der Zaehlung. */
function bauen(s) {
  const fragen = (s.fragen || []).map((f) => ({
    "@type": "Question", name: f.frage,
    acceptedAnswer: { "@type": "Answer", text: f.antwort },
  }));

  const daten = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: fragen,
  };

  const brot = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "HENRY", item: "https://hyhenry.com/" },
      { "@type": "ListItem", position: 2, name: s.titel,
        item: "https://hyhenry.com/" + s.datei },
    ],
  };

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(s.titel)}</title>
<meta name="description" content="${h(s.beschreibung)}">
<link rel="canonical" href="https://hyhenry.com/${s.datei}">
<meta property="og:title" content="${h(s.titel)}">
<meta property="og:description" content="${h(s.beschreibung)}">
<meta property="og:url" content="https://hyhenry.com/${s.datei}">
<meta property="og:type" content="article">
<meta property="og:image" content="https://hyhenry.com/poster.jpg">
<meta property="og:site_name" content="HENRY">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="icon-32.png">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="stylesheet" href="recht.css">
<script type="application/ld+json">${JSON.stringify(daten)}</script>
<script type="application/ld+json">${JSON.stringify(brot)}</script>
</head>
<body>
<main>
  <p class="zurueck"><a href="/">HENRY</a></p>

  <h1>${h(s.h1)}</h1>

  <!-- DIE ANTWORT ZUERST. Wer hier landet, hat eine Frage, keine Lust
       auf eine Vorstellungsrunde. Und ein Sprachmodell zitiert genau
       diesen Absatz. -->
  <p class="vorspann">${s.antwort}</p>

  ${s.abschnitte.map((a) => `<h2>${h(a.titel)}</h2>\n  ${a.text}`).join("\n\n  ")}

  <h2>Häufige Fragen</h2>
  ${(s.fragen || []).map((f) =>
    `<h3>${h(f.frage)}</h3>\n  <p>${h(f.antwort)}</p>`).join("\n\n  ")}

  <div class="kasten">
    <p><b>${h(s.schluss)}</b></p>
    <p><a class="knopf" href="https://butler.hyhenry.com" rel="noopener">HENRY kennenlernen</a></p>
    <p class="klein">Ab 17 Euro im Monat, monatlich kündbar. Alle Preise sind
    Endpreise und enthalten die Umsatzsteuer.</p>
  </div>

  <p class="klein">Mehr: ${
  (s.weiter || []).map((w) => `<a href="${w.datei}">${h(w.text)}</a>`).join(" · ")
}</p>

  <footer>
    <a href="/">Start</a> ·
    <a href="agb.html">AGB</a> ·
    <a href="datenschutz.html">Datenschutz</a> ·
    <a href="erstattung.html">Erstattung</a> ·
    <a href="widerruf.html">Widerruf</a> ·
    <a href="impressum.html">Impressum</a>
  </footer>
</main>

<script>
/* Dieselbe Zaehlung wie auf der Startseite: eigener Server, keine
   Cookies, kein Merkmal zur Wiedererkennung. */
(function(){
  try{
    var d={was:"aufruf",wert:"",seite:location.pathname,
      woher:document.referrer?new URL(document.referrer).hostname:"",
      sprache:(navigator.language||"").slice(0,2),
      breite:innerWidth<700?"klein":innerWidth<1200?"mittel":"gross"};
    if(navigator.sendBeacon) navigator.sendBeacon("https://butler.hyhenry.com/api/besuch",
      new Blob([JSON.stringify(d)],{type:"application/json"}));
  }catch(e){}
})();
</script>
</body>
</html>
`;
}

const seiten = JSON.parse(fs.readFileSync(path.join(ORDNER, "seiten.json"), "utf8"));

/* Untereinander verlinken: Wer wegen der Fristen kommt, hat oft auch
 * das Belegproblem. Und Suchmaschinen mögen, wenn Seiten zusammenhaengen. */
for (const s of seiten) {
  s.weiter = seiten.filter((x) => x.datei !== s.datei)
    .slice(0, 3).map((x) => ({ datei: x.datei, text: x.kurz }));
  fs.writeFileSync(path.join(ORDNER, s.datei), bauen(s));
  console.log("gebaut: " + s.datei + " (" + s.titel.length + " Zeichen Titel)");
}

module.exports = { bauen };
