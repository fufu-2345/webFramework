const API_URL = 'http://localhost:5000';

export const apiFetch = async (endpoint, options = {}) => {
    try {
        const res = await fetch(`${API_URL}/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            ...options,
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "API Error");
        }
        return res.json();
    }

    catch (error) {
        throw error;
    }

}