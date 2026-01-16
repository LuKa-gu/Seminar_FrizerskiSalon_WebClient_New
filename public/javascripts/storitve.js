import { apiFetch } from "./api.js";
import { preveriJWT } from "./auth.js";

await preveriJWT();

const seznamEl = document.getElementById("storitveSeznam");
const form = document.getElementById("storitveForm");

async function naloziStoritve() {
    seznamEl.innerHTML = "";

    try {
        const storitve = await apiFetch("/storitve");

        const fragment = document.createDocumentFragment();

        storitve.forEach(s => {
            const li = document.createElement("li");
            li.dataset.url = s.url;

            li.innerHTML = `
                <span class="naziv"><strong>${s.naziv}</strong></span>
                <button class="toggleBtn">+</button>

                <div class="details" style="display:none;">
                    <div class="content"></div>

                    <div class="actions">
                        <button class="editBtn">Posodobi</button>
                        <button class="deleteBtn">Izbriši</button>

                    </div><br>
                </div>
            `;

            fragment.appendChild(li);
        });

    seznamEl.appendChild(fragment);

    } catch (err) {
        alert(err.message);
    }
}

function preklopiVEdit(li) {
    const storitev = li._storitev;
    const contentEl = li.querySelector(".content");
    const actionsEl = li.querySelector(".actions");

    // skrijemo originalne gumbe
    if (actionsEl) actionsEl.style.display = "none";

    contentEl.innerHTML = `<br>
        <label>Opis:</label><br>
        <textarea class="editOpis">${storitev.Opis}</textarea><br><br>

        <label>Trajanje (min):</label><br>
        <input type="number" class="editTrajanje" value="${storitev.Trajanje}"><br><br>

        <label>Cena (€):</label><br>
        <input type="number" class="editCena" value="${storitev.Cena}"><br><br>

        <button class="shraniBtn">Shrani</button>
        <button class="prekliciBtn">Prekliči</button>
    `;
}

naloziStoritve();

seznamEl.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    
    const detailsEl = li.querySelector(".details");
    const contentEl = li.querySelector(".content");
    const actionsEl = li.querySelector(".actions");

    /* ===== TOGGLE ===== */
    if (e.target.classList.contains("toggleBtn")) {

        // zapiranje
        if (detailsEl.style.display === "block") {
            detailsEl.style.display = "none";
            e.target.textContent = "+";
            return;
        }

        // če še ni naloženo → fetch
        if (!contentEl.dataset.loaded) {
            try {
                const podrobnosti = await apiFetch(li.dataset.url);

                li._storitev = podrobnosti;

                contentEl.innerHTML = `
                    <p>
                        <strong>Opis:</strong> ${podrobnosti.Opis}
                    </p>
                    <p>
                        <strong>Trajanje:</strong> ${podrobnosti.Trajanje} min
                    </p>
                    <p>
                        <strong>Cena:</strong> ${podrobnosti.Cena} €
                    </p>
                `;

                contentEl.dataset.loaded = "true";
            } catch (err) {
                alert(err.message);
                return;
            }
        }

        detailsEl.style.display = "block";
        e.target.textContent = "-";
    }

    /* ===== POSODOBI ===== */
    if (e.target.classList.contains("editBtn")) {
        if (!li._storitev) {
            alert("Najprej odprite podrobnosti storitve.");
            return;
        }

        preklopiVEdit(li);
    }

    /* ===== PREKLIČI ===== */
    if (e.target.classList.contains("prekliciBtn")) {
        const s = li._storitev;

        contentEl.innerHTML = `
            <p>
                <strong>Opis:</strong> ${s.Opis}
            </p>
            <p>
                <strong>Trajanje:</strong> ${s.Trajanje} min
            </p>
            <p>
                <strong>Cena:</strong> ${s.Cena} €
            </p>
        `;

        if (actionsEl) actionsEl.style.display = "block";
    }

    /* ===== SHRANI ===== */    
    if (e.target.classList.contains("shraniBtn")) {
        const opis = li.querySelector(".editOpis").value;
        const trajanje = li.querySelector(".editTrajanje").value;
        const cena = li.querySelector(".editCena").value;

        if (trajanje < 0 || cena < 0) {
            alert("Trajanje in cena ne smeta biti negativni.");
            return;
        }

        try {
            const res = await apiFetch(li.dataset.url, {
                method: "PUT",
                body: JSON.stringify({
                    Opis: opis,
                    Trajanje: trajanje,
                    Cena: cena
                })
            });

            alert(res.message);

            // osveži lokalne podatke
            li._storitev.Opis = opis;
            li._storitev.Trajanje = trajanje;
            li._storitev.Cena = cena;

            // nazaj v display mode
            contentEl.innerHTML = `
                <p>
                    <strong>Opis:</strong> ${podrobnosti.Opis}
                </p>
                <p>
                    <strong>Trajanje:</strong> ${podrobnosti.Trajanje} min
                </p>
                <p>
                    <strong>Cena:</strong> ${podrobnosti.Cena} €
                </p>
            `;

            if (actionsEl) actionsEl.style.display = "block";

        } catch (err) {
            alert(err.message);
        }
    }

    /* ===== DELETE ===== */
    if (e.target.classList.contains("deleteBtn")) {

        if (!confirm("Ali res želite izbrisati to storitev?")) return;

        try {
            const res = await apiFetch(li.dataset.url, {
                method: "DELETE"
            });

            alert(res.message || "Storitev izbrisana.");

            // odstranimo element iz DOM
            li.remove();

        } catch (err) {
            alert(err.message);
        }
    }
});

// Dodajanje storitve
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ime = document.getElementById("ime").value;
    const opis = document.getElementById("opis").value;
    const trajanje = document.getElementById("trajanje").value;
    const cena = document.getElementById("cena").value;

    // Osnovna frontend validacija
    if (trajanje < 0 || cena < 0) {
    alert("Trajanje in cena ne smeta biti negativni.");
    return;
    }

    const data = {
        Ime: ime,
        Opis: opis,
        Trajanje: trajanje,
        Cena: cena
    };

    try {
        const result = await apiFetch("/storitve", {
            method: "POST",
            body: JSON.stringify(data)
        });

        alert(result.message || "Storitev uspešno dodana.");
        form.reset();

    } catch (err) {
        alert(err.message);
    }
});