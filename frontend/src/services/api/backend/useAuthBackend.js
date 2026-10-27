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

    const resendOtpUser = async (email) => {
        const response = await fetchWithTimeout(`${API_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Gagal mengirim ulang OTP');
        
        return result; 
    };

    const googleAuth = async (googleToken) => {
        const response = await fetchWithTimeout(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken })
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Gagal login dengan Google');
        
        return result.data; 
    };

    return { loginUser, registerUser, verifyOtpUser, resendOtpUser, googleAuth };
}