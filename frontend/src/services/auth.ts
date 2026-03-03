const TOKEN_KEY = 'medrag_admin_token';

export const authService = {
    login(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
    },

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};
