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
        const err = await response.json();
        throw new Error(err.message || "Napaka");
    }

    return response.json();
}
