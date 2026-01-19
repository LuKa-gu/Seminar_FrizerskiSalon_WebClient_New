import { apiFetch } from "./api.js";
import { preveriJWT } from "./auth.js";
import { showAlert } from "./alerts.js";

// Preveri JWT ob nalaganju strani
await preveriJWT();

const form = document.getElementById('terminiForm');
const seznam = document.getElementById('terminiSeznam');

function prikaziTermine(contentEl, termin) {
    /* ===== STORITVE ===== */
    const storitveHtml = termin.storitve.length
        ? `
            <ul class="storitve-seznam">
                ${termin.storitve.map(s => `
                    <li>
                        ${s.naziv} 
                        <span class="storitev-meta">
                            (${s.trajanje} min · ${s.cena} €)
                        </span>
                    </li>
                `).join("")}
            </ul>
        `
        : `<p class="text-muted">Brez storitev</p>`;

    /* ===== OPOMBE ===== */
    const opombeHtml = termin.opombe
        ? `<p class="opombe">Opombe: ${termin.opombe}</p>`
        : `<p class="text-muted"><em>Brez opomb</em></p>`;

    contentEl.innerHTML = `
        <div class="termin-section">
            <h4>Storitve</h4>
            ${storitveHtml}
        </div>

        <div class="termin-section">
            <p>
                Skupno trajanje: ${termin.skupno_trajanje} min<br>
                Skupna cena: ${termin.skupna_cena} €
            </p>
        </div>
        
        <div class="termin-section">
            ${opombeHtml}
        </div>

        <div class="termin-section">
            <h4>Kontakt</h4>
            <ul class="kontakt-seznam">
                <li>
                    Telefon: ${termin.kontakt.telefon}
                </li>
                <li>
                    Mail: ${termin.kontakt.mail}
                </li>
            </ul>
        </div>

        <div class="termin-section status-section">
            Status: 
            <span class="statusValue">${termin.status}</span>
        </div>
    `;
}

function preklopiVEdit(li) {
    const termin = li._termin;
    const contentEl = li.querySelector(".content");
    const actionsEl = li.querySelector(".actions");

    const statusSpan = contentEl.querySelector(".statusValue");
    if (!statusSpan) return;

    // skrijemo originalne gumbe
    if (actionsEl) actionsEl.style.display = "none";

    const statusi = ["Rezervirano", "V izvajanju", "Zaključeno", "Preklicano"];

    const select = document.createElement("select");
    select.classList.add("editStatus", "form-control");

    statusi.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        if (s === termin.status) opt.selected = true;
        select.appendChild(opt);
    });

    // shranimo star status za preklic
    select.dataset.oldValue = termin.status;

    // zamenjamo samo status
    statusSpan.replaceWith(select);

    // dodamo gumbe
    contentEl.insertAdjacentHTML("beforeend", ` 
        <div class="inlineActions">
            <button class="btn btn-primary shraniBtn">Shrani</button>
            <button class="btn btn-secondary prekliciBtn">Prekliči</button>
        </div>
    `);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dan = document.getElementById('dan').value;
    seznam.innerHTML = '';

    try {
        const response = await apiFetch(`/frizerji/termini?dan=${dan}`);

        if (response.termini.length === 0) {
            seznam.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    ${response.message}
                </li>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        response.termini.forEach(termin => {
            const li = document.createElement('li');
            li.classList.add('termin-item');
            li.dataset.url = termin.url;

            li.innerHTML = `
                <div class="termin-header">
                    <div class="termin-main">
                        <strong>${termin.ura}</strong>
                        <span class="termin-stranka">${termin.stranka}</span>
                    </div>

                    <button class="btn btn-primary btn-sm toggleBtn">+</button>
                </div>

                <div class="details">
                    <div class="content"></div>

                    <div class="actions">
                        <button class="btn btn-primary editBtn">Spremeni status</button>
                    </div>
                </div>
            `;

            fragment.appendChild(li);
        });

        seznam.appendChild(fragment);

    } catch (err) {
        showAlert(err.message, "danger");
    }
});

seznam.addEventListener("click", async (e) => {
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
                const termin = await apiFetch(li.dataset.url);

                li._termin = termin;

                prikaziTermine(contentEl, li._termin);

                contentEl.dataset.loaded = "true";
            } catch (err) {
                showAlert(err.message, "danger");
                return;
            }
        }

        detailsEl.style.display = "block";
        e.target.textContent = "-";
    }

    /* ===== POSODOBI ===== */
    if (e.target.classList.contains("editBtn")) {
        if (!li._termin) {
            showAlert("Najprej odprite podrobnosti termina.", "warning");
            return;
        }

        preklopiVEdit(li);
    }

    /* ===== PREKLIČI ===== */
    if (e.target.classList.contains("prekliciBtn")) {
        const select = contentEl.querySelector(".editStatus");
        const oldValue = select.dataset.oldValue;

        const span = document.createElement("span");
        span.className = "statusValue";
        span.textContent = oldValue;

        select.replaceWith(span);

        contentEl.querySelector(".inlineActions")?.remove();

        if (actionsEl) actionsEl.style.display = "block";
    }

    /* ===== SHRANI ===== */    
    if (e.target.classList.contains("shraniBtn")) {
        const select = contentEl.querySelector(".editStatus");
        const newStatus = select.value;

        try {
            const res = await apiFetch(li.dataset.url, {
                method: "PATCH",
                body: JSON.stringify({
                    status: newStatus
                })
            });

            showAlert(res.message || "Status termina uspešno posodobljen.", "success");

            // osveži lokalne podatke
            li._termin.status = newStatus;

            // nazaj v display mode
            const span = document.createElement("span");
            span.className = "statusValue";
            span.textContent = newStatus;

            select.replaceWith(span);

            contentEl.querySelector(".inlineActions")?.remove();

            if (actionsEl) actionsEl.style.display = "block";
        } catch (err) {
            showAlert(err.message, "danger");
        }
    }
});