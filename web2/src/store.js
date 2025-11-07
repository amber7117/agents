export const tokenStore = {
    get token() { return localStorage.getItem('token'); },
    set token(v) { v ? localStorage.setItem('token', v) : localStorage.removeItem('token'); }
};
