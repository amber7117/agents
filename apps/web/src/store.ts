export const tokenStore = {
    get token() { return localStorage.getItem('token'); },
    set token(v: string | null) { v ? localStorage.setItem('token', v) : localStorage.removeItem('token'); }
};