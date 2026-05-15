document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    const message = document.getElementById('message');

    if (!form || !message) {
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        message.textContent = '';
        message.style.color = '';

        const email = document.getElementById('email').value.trim();
        const url = (window.API_BASE_URL || 'http://localhost:5001/api') + '/auth/forgot-password';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
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
                message.textContent = data.message || 'Failed to send reset email';
                return;
            }

            message.style.color = 'green';
            message.textContent = data.message || 'Password reset link sent to your email';
        } catch (error) {
            console.error('Forgot password fetch error:', error);
            message.style.color = 'red';
            message.textContent = error.message === 'Invalid server response' 
                ? 'Server error. Please try again later.' 
                : 'Network error. Please ensure the backend is running.';
        }
    });
});
