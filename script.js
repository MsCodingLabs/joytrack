// ---------------------- KONSTANTEN -------------------------
const moodEmojis = ["😖", "😌", "😫", "😐"];
const moodLabels = ["Gestresst", "Ausgeglichen", "Überfordert", "Unterfordert"];

// ----------------- FUNKTION: Tagesreset --------------------
function resetDailyMood() {
  let lastSavedDate = localStorage.getItem("lastSavedDate");
  let today = getCurrentDay();

  if (lastSavedDate !== today) {
    try {
      let moods = JSON.parse(localStorage.getItem("moods")) || [];
      if (moods.length > 0) {
        let history = JSON.parse(localStorage.getItem("moodHistory")) || [];
        history.push(...moods);
        localStorage.setItem("moodHistory", JSON.stringify(history));
      }
    } catch (e) {
      console.error("Fehler beim Speichern in Historie:", e);
    }

    localStorage.setItem("moods", JSON.stringify([]));
    localStorage.setItem("needsSupport", "");
    localStorage.setItem("lastSavedDate", today);
  }
}

// ------------------ FUNKTION: Stimmung speichern -------------------
function saveMood(element, mood) {
  let moods = [];
  try {
    moods = JSON.parse(localStorage.getItem("moods")) || [];
  } catch (e) {
    console.warn("Konnte 'moods' nicht lesen, initialisiere neu.");
    moods = [];
  }

  const today = getCurrentDay();
  moods = moods.filter((m) => m.date !== today);
  moods.push({ mood, date: today });

  localStorage.setItem("moods", JSON.stringify(moods));

  highlightSelection("mood-option", element);
  updateOutput();
  updateCharts();
}

// --------------- FUNKTION: Unterstützungsbedarf ------------------
function toggleSupport(element, needsSupport) {
  localStorage.setItem("needsSupport", needsSupport ? "Ja" : "Nein");

  const commentBox = document.getElementById("support-comment");
  if (commentBox) {
    commentBox.classList.toggle("hidden", !needsSupport);
  }

  highlightSelection("support-option", element);
  updateOutput();
}

// -------------------- FUNKTION: Kommentar speichern -------------------
function saveSupportComment() {
  const textarea = document.getElementById("comment");
  const comment = textarea?.value.trim();
  if (comment) {
    localStorage.setItem("supportComment", comment);
    alert("Dein Kommentar wurde gespeichert!");
  } else {
    alert("Bitte schreibe erst einen Kommentar.");
  }
}

// -------------- UI: Auswahl hervorheben ---------------------
function highlightSelection(className, selectedElement) {
  document
    .querySelectorAll(`.${className}`)
    .forEach((btn) => btn.classList.remove("active"));
  selectedElement.classList.add("active");
}

// ------------------- FUNKTION: Ausgabe aktualisieren ----------------
function updateOutput() {
  let moods = [];
  try {
    moods = JSON.parse(localStorage.getItem("moods")) || [];
  } catch (e) {
    moods = [];
  }

  const latestMood =
    moods.length > 0 ? moods[moods.length - 1].mood : "Noch nicht ausgewählt";
  const needsSupport =
    localStorage.getItem("needsSupport") || "Nicht angegeben";

  const outputText = `Letzte Stimmung: ${latestMood}, Unterstützung: ${needsSupport}`;
  const outputEl = document.getElementById("output");
  const msgEl = document.getElementById("thank-you-message");

  if (outputEl) outputEl.innerText = outputText;
  if (msgEl) msgEl.classList.remove("hidden");
}

// ----------------- FUNKTION: Diagramm aktualisieren -----------------
function updateCharts() {
  let moods = [];
  try {
    moods = JSON.parse(localStorage.getItem("moods")) || [];
  } catch (e) {
    moods = [];
  }

  const moodCounts = Object.fromEntries(moodEmojis.map((emoji) => [emoji, 0]));
  moods.forEach((m) => {
    if (moodCounts.hasOwnProperty(m.mood)) {
      moodCounts[m.mood]++;
    }
  });

  if (window.moodChartInstance) {
    window.moodChartInstance.data.datasets[0].data = moodEmojis.map(
      (emoji) => moodCounts[emoji]
    );
    window.moodChartInstance.update();
    return;
  }

  const ctx = document.getElementById("moodChart")?.getContext("2d");
  if (!ctx) return;

  window.moodChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: moodLabels,
      datasets: [
        {
          data: moodEmojis.map((emoji) => moodCounts[emoji]),
          backgroundColor: ["#F44336", "#4CAF50", "#FFEB3B", "#03A9F4"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "50%",
      rotation: -90,
      circumference: 180,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: { size: 12 },
            boxWidth: 10,
            padding: 10,
          },
        },
      },
    },
  });
}

// ------------- FUNKTION: Heutiges Datum anzeigen ----------------
function displayDate() {
  const dateElement = document.getElementById("date");
  if (dateElement) {
    dateElement.innerText = `📅 Heute ist: ${new Date().toLocaleDateString(
      "de-DE"
    )}`;
  }
}

// ------------ FUNKTION: Vorherige Auswahl wiederherstellen ---------
function restorePreviousSupportSelection() {
  const needsSupport = localStorage.getItem("needsSupport");
  const commentBox = document.getElementById("support-comment");
  if (commentBox) {
    commentBox.classList.toggle("hidden", needsSupport !== "Ja");
  }
}

// ------------------- FUNKTION: Daten löschen ---------------------
function deleteStoredData() {
  if (confirm("Möchtest du alle gespeicherten Daten löschen?")) {
    localStorage.clear();
    alert("Alle Daten wurden gelöscht.");
    location.reload();
  }
}

// -------------- HELPER: Datum berechnen mit Nachtlogik -------------
function getCurrentDay() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 5) now.setDate(now.getDate() - 1);
  return now.toISOString().split("T")[0];
}

// ------------------- INIT ---------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  resetDailyMood();
  displayDate();
  restorePreviousSupportSelection();
});
