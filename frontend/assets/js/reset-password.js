document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const message = document.getElementById('message');

    if (!form || !message) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        message.style.color = 'red';
        message.textContent = 'Reset token is missing';
        form.style.display = 'none';
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        message.textContent = '';
        message.style.color = '';

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            message.style.color = 'red';
            message.textContent = 'Passwords do not match';
            return;
        }

        const url = (window.API_BASE_URL || 'http://localhost:5001/api') + '/auth/reset-password';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                    confirmPassword,
                }),
            });

            let data = {};
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                throw new Error('Invalid server response');
            }

            if (!response.ok) {
                message.style.color = 'red';
                message.textContent = data.message || 'Failed to reset password';
                return;
            }

            message.style.color = 'green';
            message.textContent = data.message || 'Password reset successfully';

            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        } catch (error) {
            console.error('Reset password fetch error:', error);
            message.style.color = 'red';
            message.textContent = error.message === 'Invalid server response' 
                ? 'Server error. Please try again later.' 
                : 'Network error. Please ensure the backend is running.';
        }
    });
});
