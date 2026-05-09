const AUTH_KEY = 'medical_lab_user';
const TOKEN_KEY = 'medical_lab_token';

const authService = {
    login(phone, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.phone === phone && u.password === password);
        
        if (user) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            localStorage.setItem(TOKEN_KEY, 'mock_token_' + Date.now());
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    logout() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '../../index.html';
    },

    getUser() {
        const userStr = localStorage.getItem(AUTH_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    },

    updateProfile(updates) {
        const user = this.getUser();
        if (user) {
            const updatedUser = { ...user, ...updates };
            localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
            
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index] = updatedUser;
                localStorage.setItem('users', JSON.stringify(users));
            }
            return { success: true, user: updatedUser };
        }
        return { success: false, message: 'User not found' };
    },

    changePassword(currentPassword, newPassword) {
        const user = this.getUser();
        if (user && user.password === currentPassword) {
            user.password = newPassword;
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index] = user;
                localStorage.setItem('users', JSON.stringify(users));
            }
            return { success: true };
        }
        return { success: false, message: 'Current password is incorrect' };
    }
};

window.authService = authService;