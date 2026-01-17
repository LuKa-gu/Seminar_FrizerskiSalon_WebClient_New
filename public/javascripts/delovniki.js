import { apiFetch } from "./api.js";
import { preveriJWT } from "./auth.js";

// Preveri JWT ob nalaganju strani
await preveriJWT();

const form = document.getElementById("delovnikiForm");
const seznamEl = document.getElementById("delovnikiSeznam");

// Dodajanje delovnika
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dan = document.getElementById("dan").value;
    const zacetek = document.getElementById("zacetek").value;
    const konec = document.getElementById("konec").value;

    // Osnovna frontend validacija
    if (zacetek >= konec) {
        alert("Začetek mora biti pred koncem.");
        return;
    }

    const data = {
        dan,
        zacetek,
        konec
    };

    try {
        const result = await apiFetch("/delovniki", {
            method: "POST",
            body: JSON.stringify(data)
        });

        alert(result.message || "Delovnik uspešno dodan.");
        form.reset();

    } catch (err) {
        alert(err.message);
    }
});

async function naloziDelovnike() {
    seznamEl.innerHTML = "";

    try {
        const result = await apiFetch("/delovniki");

        if (!Array.isArray(result)) {
            seznamEl.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    ${result.message}
                </li>
            `;
            return;
        }
        
        const fragment = document.createDocumentFragment();

        result.forEach(d => {
            const li = document.createElement("li");
            li.classList.add("delovnik-item");
            li.dataset.url = d.Url;
            li._delovnik = d;

            li.innerHTML = `
                <div class="delovnik-display">
                    <div class="delovnik-info">
                        <strong>${d.dan}:</strong><br>
                        <span>${d.Zacetek} - ${d.Konec}</span>
                    </div>

                    <div class="delovnik-actions">
                        <button class="btn btn-primary posodobiBtn">Posodobi</button>
                        <button class="btn btn-danger izbrisiBtn">Izbriši</button>
                    </div>
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
    const d = li._delovnik;

    li.innerHTML = `
        <div class="delovnik-edit">
            <div class="form-group">
                <label>Dan</label>
                <input type="date" value="${d.dan}" class="form-control editDan">
            </div>
            <div class="form-group">
                <label>Začetek</label>
                <input type="time" value="${d.Zacetek}" class="form-control editZacetek">
            </div>
            <div class="form-group">
                <label>Konec</label>
                <input type="time" value="${d.Konec}" class="form-control editKonec">
            </div>

            <div class="delovnik-actions">
                <button class="btn btn-primary shraniBtn">Shrani</button>
                <button class="btn btn-secondary prekliciBtn">Prekliči</button>
            </div>
        </div>
    `;
}

// Naloži delovnike ob odprtju strani
naloziDelovnike();

seznamEl.addEventListener("click", async (e) => {
    // Update delovnika
    const li = e.target.closest("li");
    if (!li) return;

    /* ===== POSODOBI ===== */
    if (e.target.classList.contains("posodobiBtn")) {
        preklopiVEdit(li);
    }

    /* ===== PREKLIČI ===== */
    if (e.target.classList.contains("prekliciBtn")) {
        naloziDelovnike();
    }

    /* ===== SHRANI ===== */
    if (e.target.classList.contains("shraniBtn")) {
        const dan = li.querySelector(".editDan").value;
        const zacetek = li.querySelector(".editZacetek").value;
        const konec = li.querySelector(".editKonec").value;

        if (zacetek >= konec) {
            alert("Začetek mora biti pred koncem.");
            return;
        }

        try {
            const result = await apiFetch(li.dataset.url, {
                method: "PUT",
                body: JSON.stringify({ dan, zacetek, konec })
            });

            alert(result.message);
            naloziDelovnike();

        } catch (err) {
            alert(err.message);
        }
    }    

    // Delete delovnika
    if (e.target.classList.contains("izbrisiBtn")) {

        if (!confirm("Ali res želite izbrisati ta delovnik?")) return;

        try {
            const result = await apiFetch(li.dataset.url, {
                method: "DELETE"
            });

            alert(result.message || "Delovnik izbrisan.");
            naloziDelovnike();

        } catch (err) {
            alert(err.message);
        }
    }
});
