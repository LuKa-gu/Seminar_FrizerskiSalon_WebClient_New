import { apiFetch } from "./api.js";

export async function preveriJWT() {
    try {
        const data = await apiFetch("/frizerji/jaz"); // vrne {message, user}
        return data;   // vrnemo celoten objekt
    } catch (err) {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }
}

export async function login(username, password) {
    const data = await apiFetch("/frizerji/login", {
        method: "POST",
        body: JSON.stringify({
            Uporabnisko_ime: username,
            Geslo: password
        })
    });

    localStorage.setItem("token", data.token);
}
