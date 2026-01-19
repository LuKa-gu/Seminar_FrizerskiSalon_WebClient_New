import { login } from "./auth.js";
import { showAlert } from "./alerts.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        await login(username, password);
        window.location.href = "/dashboard";
    } catch (err) {
        showAlert(err.message, "danger");
    }
});
