const validators = {
    phone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone) ? { valid: true } : { valid: false, message: 'Invalid phone number' };
    },

    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? { valid: true } : { valid: false, message: 'Invalid email address' };
    },

    password(password) {
        if (password.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters' };
        }
        return { valid: true };
    },

    required(value, fieldName = 'Field') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return { valid: false, message: `${fieldName} is required` };
        }
        return { valid: true };
    },

    minLength(value, min, fieldName = 'Field') {
        if (value && value.length < min) {
            return { valid: false, message: `${fieldName} must be at least ${min} characters` };
        }
        return { valid: true };
    },

    maxLength(value, max, fieldName = 'Field') {
        if (value && value.length > max) {
            return { valid: false, message: `${fieldName} must not exceed ${max} characters` };
        }
        return { valid: true };
    },

    date(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) ? { valid: true } : { valid: false, message: 'Invalid date' };
    },

    validateForm(formData, rules) {
        const errors = {};
        
        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                const result = rule(value);
                if (!result.valid) {
                    errors[field] = result.message;
                    break;
                }
            }
        }
        
        return { valid: Object.keys(errors).length === 0, errors };
    }
};

window.validators = validators;