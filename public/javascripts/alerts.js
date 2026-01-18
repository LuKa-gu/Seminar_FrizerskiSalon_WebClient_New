export function showAlert(message, type = "danger") {
    const container = document.getElementById("alertContainer");

    if (!container) {
        console.warn("Alert container ne obstaja.");
        return;
    }

    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show fixed-top m-3 text-center alertBar" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>
    `;
}