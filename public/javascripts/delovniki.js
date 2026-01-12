import { apiFetch } from "./api.js";
import { preveriJWT } from "./auth.js";

// Preveri JWT ob nalaganju strani
await preveriJWT();

const form = document.getElementById("delovnikiForm");
const seznamEl = document.getElementById("delovnikiSeznam");
const preglejBtn = document.getElementById("preglejDelovnikeBtn");

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

// Pregled delovnikov
preglejBtn.addEventListener("click", naloziDelovnike);

async function naloziDelovnike() {
    seznamEl.innerHTML = "";

    try {
        const result = await apiFetch("/delovniki");

        if (!Array.isArray(result)) {
            seznamEl.innerHTML = `<li>${result.message}</li>`;
            return;
        }
        
        const fragment = document.createDocumentFragment();

        result.forEach(d => {
            const li = document.createElement("li");

            li.dataset.url = d.Url;

            li.innerHTML = `
                <span class="display">
                    <strong>${d.dan}</strong>:
                    ${d.Zacetek} - ${d.Konec}
                </span>
                <button class="posodobiBtn">Posodobi</button>
                <button class="izbrisiBtn">Izbriši</button>
            `;

            fragment.appendChild(li);
        });

        seznamEl.appendChild(fragment);

    } catch (err) {
        alert(err.message);
    }
}

function preklopiVEdit(li) {
    const id = li.dataset.id;

    const displaySpan = li.querySelector(".display");
    const text = displaySpan.textContent;

    // izluščimo vrednosti (ker jih že imamo v HTML-ju)
    const dan = text.match(/\d{4}-\d{2}-\d{2}/)[0];
    const [zacetek, konec] = text.match(/\d{2}:\d{2}/g);

    li.innerHTML = `
        <input type="date" value="${dan}" class="editDan">
        <input type="time" value="${zacetek}" class="editZacetek">
        <input type="time" value="${konec}" class="editKonec">
        <button class="shraniBtn">Shrani</button>
        <button class="prekliciBtn">Prekliči</button>
    `;
}

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
