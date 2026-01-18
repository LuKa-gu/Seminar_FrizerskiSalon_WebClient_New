const API_BASE_URL = "http://localhost:3000";

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorMessage = "Napaka pri komunikaciji s strežnikom.";

        try {
            const err = await response.json();
            errorMessage = err.error || err.message || errorMessage;
        } catch (e) {
            // response ni JSON (npr. 500 Internal Server Error)
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    return response.json();
}
