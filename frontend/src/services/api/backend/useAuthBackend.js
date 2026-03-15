import { useBackend } from '@/services/api/useBackend.js';

export function useAuthBackend() {
    const { API_URL, fetchWithTimeout } = useBackend();

    const loginUser = async (email, password) => {
        const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Server Error ${response.status}: Respons tidak valid.`);
        }

        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Gagal login');
        return result.data; 
    };

    const registerUser = async (email, password, name) => {
        const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Gagal registrasi');
        return result.data; 
    };

    const verifyOtpUser = async (email, otp) => {
        const response = await fetchWithTimeout(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'OTP salah atau gagal verifikasi');
        
        return result.data; 
    };
    const cancelRegistration = async (email, useBeacon = false) => {
        const url = `${API_URL}/auth/cancel-registration`;
        const data = JSON.stringify({ email });

        if (useBeacon && navigator.sendBeacon) {
            return navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
        }

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: data
            });
        } catch (e) {
            console.error("Cleanup failed", e);
        }
    };

    return { loginUser, registerUser, verifyOtpUser, cancelRegistration };
}