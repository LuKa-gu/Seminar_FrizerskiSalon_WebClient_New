import { apiFetch } from "./api.js";
import { preveriJWT } from "./auth.js";

// Preveri JWT ob nalaganju strani
await preveriJWT();

const form = document.getElementById('terminiForm');
const seznam = document.getElementById('terminiSeznam');

function prikaziTermine(contentEl, termin) {
    /* ===== STORITVE ===== */
    const storitveHtml = termin.storitve.length
        ? `<ul>
            ${termin.storitve.map(s => `
                <li>
                    ${s.naziv} (${s.trajanje} min ; ${s.cena} €)
                </li>
            `).join("")}
            </ul>`
        : `<p>Brez storitev</p>`;

    /* ===== OPOMBE ===== */
    const opombeHtml = termin.opombe
        ? `<p><strong>Opombe:</strong> ${termin.opombe}</p>`
        : `<p><em>Brez opomb</em></p>`;

    contentEl.innerHTML = `
        <h4>Storitve</h4>
        ${storitveHtml}

        <p>
            <strong>Skupno trajanje:</strong> ${termin.skupno_trajanje} min<br><br>
            <strong>Skupna cena:</strong> ${termin.skupna_cena} €
        </p>

        ${opombeHtml}

        <h4>Kontakt</h4>
        <ul>
            <li>
                <strong>Telefon:</strong> ${termin.kontakt.telefon}<br>
            </li>
            <li>
                <strong>Mail:</strong> ${termin.kontakt.mail}
            </li>
        </ul>

        <p>
            <strong>Status:</strong> 
            <span class="statusValue">${termin.status}</span>
        </p>
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
    select.classList.add("editStatus");

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
            <button class="shraniBtn">Shrani</button>
            <button class="prekliciBtn">Prekliči</button>
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
            seznam.innerHTML = `<li>${response.message}</li>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        response.termini.forEach(termin => {
            const li = document.createElement('li');

            li.dataset.url = termin.url;

            li.innerHTML = `
                <strong>${termin.ura}</strong> | 
                ${termin.stranka} 
                <button class="toggleBtn">+</button>

                <div class="details" style="display:none;">
                    <div class="content"></div>

                    <div class="actions">
                        <button class="editBtn">Spremeni status</button>
                    </div><br>
                </div>
            `;

            fragment.appendChild(li);
        });

        seznam.appendChild(fragment);

    } catch (err) {
        alert(err.message);
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
                alert(err.message);
                return;
            }
        }

        detailsEl.style.display = "block";
        e.target.textContent = "-";
    }

    /* ===== POSODOBI ===== */
    if (e.target.classList.contains("editBtn")) {
        if (!li._termin) {
            alert("Najprej odprite podrobnosti termina.");
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

            alert(res.message);

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
            alert(err.message);
        }
    }
});