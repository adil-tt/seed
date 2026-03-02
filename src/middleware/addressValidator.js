const validateAddress = (req, res, next) => {
    const { fullName, phone, house, street, landmark, city, state, pincode } = req.body;
    const errors = {};

    // fullName validation: required, min length 3, letters and spaces only
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3 || !/^[A-Za-z\s]+$/.test(fullName)) {
        errors.fullName = "Full name is required, must be at least 3 characters, and contain only letters and spaces.";
    }

    // phone validation: required, exactly 10 digits, starts with 6-9
    if (!phone || typeof phone !== 'string' || !/^[6-9]\d{9}$/.test(phone)) {
        errors.phone = "Phone must be a valid Indian mobile number (10 digits starting with 6-9).";
    }

    // house validation: required, min length 3
    if (!house || typeof house !== 'string' || house.trim().length < 3) {
        errors.house = "House/Building is required and must be at least 3 characters.";
    }

    // street validation: required, min length 5
    if (!street || typeof street !== 'string' || street.trim().length < 5) {
        errors.street = "Street/Area is required and must be at least 5 characters.";
    }

    // landmark validation: optional, if provided min length 3
    if (landmark && (typeof landmark !== 'string' || landmark.trim().length < 3)) {
        errors.landmark = "Landmark must be at least 3 characters if provided.";
    }

    // city validation: required, letters only, min length 2
    if (!city || typeof city !== 'string' || city.trim().length < 2 || !/^[A-Za-z\s]+$/.test(city)) {
        errors.city = "City is required, must be at least 2 characters, and contain only letters and spaces.";
    }

    // state validation: required, letters only, min length 2
    if (!state || typeof state !== 'string' || state.trim().length < 2 || !/^[A-Za-z\s]+$/.test(state)) {
        errors.state = "State is required, must be at least 2 characters, and contain only letters and spaces.";
    }

    // pincode validation: required, exactly 6 digits, numeric only
    if (!pincode || typeof pincode !== 'string' || !/^\d{6}$/.test(pincode)) {
        errors.pincode = "Pincode is required and must be exactly 6 digits.";
    }

    if (Object.keys(errors).length > 0) {
        req.validationErrors = errors;
    }

    next();
};

module.exports = { validateAddress };
