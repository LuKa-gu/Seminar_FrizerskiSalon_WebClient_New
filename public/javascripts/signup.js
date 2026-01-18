import { apiFetch } from "./api.js";
import { showAlert } from "./alerts.js";

function showError(id, message) {
    document.getElementById(id + 'Error').innerText = message;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(e => e.innerText = '');
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        Spol: document.getElementById('Spol').value,
        Ime: document.getElementById('Ime').value,
        Priimek: document.getElementById('Priimek').value,
        Naslov: document.getElementById('Naslov').value,
        Starost: document.getElementById('Starost').value,
        Mail: document.getElementById('Mail').value,
        Telefon: document.getElementById('Telefon').value,
        Opis: document.getElementById('Opis').value,
        Uporabnisko_ime: document.getElementById('Uporabnisko_ime').value,
        Geslo: document.getElementById('Geslo').value,
        Specializacije: document.getElementById('Specializacije')
            .value
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
    };

    // Preveri prazna polja
    for (const key of Object.keys(data)) {
        if (key !== 'Specializacije' && !data[key]) {
            showAlert('Izpolni vsa obvezna polja.', "warning");
            return
        }
    }

    // Preveri specializacije
    if (data.Specializacije.length === 0) {
        showAlert('Vnesi vsaj eno specializacijo.', "warning");
        return;
    }

    // Preveri dolžino gesla
    clearErrors();

    if (data.Geslo.length < 8) {
        showError('Geslo', 'Geslo mora imeti vsaj 8 znakov.');
        return;
    }

    try {
        const res = await apiFetch("/frizerji/signup", {
            method: 'POST',
            body: JSON.stringify(data)
        });

        // uspešna registracija
        const successMsg = res.message || 'Registracija uspešna.';
        showAlert(`${successMsg} Sedaj se lahko prijavite.`, "success");

        setTimeout(() => {
            window.location.href = "/login";
        }, 2000);

    } catch (err) {
        showAlert(err.message, "danger");
    }
});
