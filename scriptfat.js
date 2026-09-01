// script.js

/* ============================================================
   Body Fat Calculator — U.S. Navy Method
   ============================================================
   Male formula:
     BF% = 86.010 × log10(waist_in − neck_in) − 70.041 × log10(height_in) + 36.76

   Female formula:
     BF% = 163.205 × log10(waist_in + hip_in − neck_in) − 97.684 × log10(height_in) − 78.387

   Measurements are entered in centimeters and converted to inches internally.
   1 inch = 2.54 cm
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // DOM References
    // ============================================================
    const form = document.getElementById('bodyFatForm');
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const neckInput = document.getElementById('neck');
    const waistInput = document.getElementById('waist');
    const hipInput = document.getElementById('hip');
    const hipField = document.getElementById('hip-field');
    const resultsCard = document.getElementById('resultsCard');
    const resetBtn = document.getElementById('resetBtn');
    const resetFromResults = document.getElementById('resetFromResults');
    const calculateBtn = document.getElementById('calculateBtn');

    // Gauge elements
    const gaugeProgress = document.getElementById('gaugeProgress');
    const gaugePercentage = document.getElementById('gaugePercentage');
    const bfpValue = document.getElementById('bfpValue');
    const categoryBadge = document.getElementById('categoryBadge');
    const categoryText = document.getElementById('categoryText');
    const interpretationText = document.getElementById('interpretationText');

    // Error elements
    const errorElements = {
        age: document.getElementById('age-error'),
        gender: document.getElementById('gender-error'),
        height: document.getElementById('height-error'),
        neck: document.getElementById('neck-error'),
        waist: document.getElementById('waist-error'),
        hip: document.getElementById('hip-error'),
    };

    // Segmented control buttons
    const segmentButtons = document.querySelectorAll('.segment-btn');

    // ============================================================
    // State
    // ============================================================
    let selectedGender = 'male'; // 'male' or 'female'
    let currentCategoryKey = null;

    // ============================================================
    // Constants
    // ============================================================
    const CM_TO_INCHES = 1 / 2.54;
    const GAUGE_MIN_BF = 5; // Minimum body fat % shown on gauge
    const GAUGE_MAX_BF = 40; // Maximum body fat % shown on gauge
    const GAUGE_ARC_LENGTH = 282.74; // Arc length of the semi-circle (π × radius)

    // ============================================================
    // Body Fat Categories (Age-Aware)
    // ============================================================
    const categories = {
        male: {
            20: [
                { key: 'essential', label: 'Essential Fat', min: 2, max: 5, color: '#c0392b' },
                { key: 'athletes', label: 'Athletes', min: 6, max: 13, color: '#27ae60' },
                { key: 'fitness', label: 'Fitness', min: 14, max: 17, color: '#1a6b8a' },
                { key: 'average', label: 'Average', min: 18, max: 24, color: '#b7791f' },
                { key: 'obese', label: 'Above Average', min: 25, max: 99, color: '#e74c3c' },
            ],
            40: [
                { key: 'essential', label: 'Essential Fat', min: 2, max: 5, color: '#c0392b' },
                { key: 'athletes', label: 'Athletes', min: 6, max: 14, color: '#27ae60' },
                { key: 'fitness', label: 'Fitness', min: 15, max: 19, color: '#1a6b8a' },
                { key: 'average', label: 'Average', min: 20, max: 25, color: '#b7791f' },
                { key: 'obese', label: 'Above Average', min: 26, max: 99, color: '#e74c3c' },
            ],
            60: [
                { key: 'essential', label: 'Essential Fat', min: 2, max: 5, color: '#c0392b' },
                { key: 'athletes', label: 'Athletes', min: 6, max: 15, color: '#27ae60' },
                { key: 'fitness', label: 'Fitness', min: 16, max: 20, color: '#1a6b8a' },
                { key: 'average', label: 'Average', min: 21, max: 26, color: '#b7791f' },
                { key: 'obese', label: 'Above Average', min: 27, max: 99, color: '#e74c3c' },
            ],
        },
        female: {
            20: [
                { key: 'essential', label: 'Essential Fat', min: 10, max: 13, color: '#c0392b' },
                { key: 'athletes', label: 'Athletes', min: 14, max: 20, color: '#27ae60' },
                { key: 'fitness', label: 'Fitness', min: 21, max: 24, color: '#1a6b8a' },
                { key: 'average', label: 'Average', min: 25, max: 31, color: '#b7791f' },
                { key: 'obese', label: 'Above Average', min: 32, max: 99, color: '#e74c3c' },
            ],
            40: [
                { key: 'essential', label: 'Essential Fat', min: 10, max: 13, color: '#c0392b' },
                { key: 'athletes', label: 'Athletes', min: 14, max: 21, color: '#27ae60' },
                { key: 'fitness', label: 'Fitness', min: 22, max: 25, color: '#1a6b8a' },
                { key: 'average', label: 'Average', min: 26, max: 32, color: '#b7791f' },
                { key: 'obese', label: 'Above Average', min: 33, max: 99, color: '#e74c3c' },
            ],
            60: [
                { key: 'essential', label: 'Essential Fat', min: 10, max: 13, color: '#c0392b' },
                { key: 'athletes', label: 'Athletes', min: 14, max: 22, color: '#27ae60' },
                { key: 'fitness', label: 'Fitness', min: 23, max: 26, color: '#1a6b8a' },
                { key: 'average', label: 'Average', min: 27, max: 33, color: '#b7791f' },
                { key: 'obese', label: 'Above Average', min: 34, max: 99, color: '#e74c3c' },
            ],
        },
    };

    // ============================================================
    // Interpretation Texts by Category
    // ============================================================
    const interpretations = {
        male: {
            essential:
                'This falls in the essential fat range — the minimum amount of body fat needed for basic bodily functions. ' +
                'This is typically only seen in competitive bodybuilders or extreme athletes and is generally not sustainable long-term for most individuals.',
            athletes:
                'This is in the athlete range, indicating excellent overall fitness. You likely have visible muscle definition, ' +
                'maintain a rigorous training regimen, and follow a healthy diet. Keep up the great work!',
            fitness:
                'This is in the fitness range, which is considered healthy and fit. You likely have good muscle tone, ' +
                'regular physical activity habits, and a balanced approach to nutrition. This range is associated with good overall health.',
            average:
                'This is in the average range for men. While not necessarily unhealthy, there is room for improvement. ' +
                'Regular exercise and a balanced diet can help improve your body composition over time.',
            obese:
                'This is above the average range. Consider consulting with a healthcare professional about incorporating more ' +
                'physical activity and healthy eating habits into your routine. Small, sustainable changes can make a big difference.',
        },
        female: {
            essential:
                'This falls in the essential fat range — the minimum amount of body fat needed for hormonal and reproductive health. ' +
                'This is typically only seen in competitive athletes and can disrupt normal bodily functions if maintained long-term.',
            athletes:
                'This is in the athlete range, indicating excellent fitness. You likely have visible muscle definition, ' +
                'maintain a rigorous training regimen, and follow a healthy diet. This range reflects outstanding physical conditioning.',
            fitness:
                'This is in the fitness range, which is considered healthy and fit for women. You likely maintain good physical condition ' +
                'through regular activity and healthy habits. This range is associated with good overall health and wellness.',
            average:
                'This is in the average range for women. While not necessarily unhealthy, there is room for improvement. ' +
                'Regular exercise and a balanced diet can help improve your body composition over time.',
            obese:
                'This is above the average range. Consider consulting with a healthcare professional about incorporating more ' +
                'physical activity and healthy eating habits into your routine. Small, sustainable changes can make a big difference.',
        },
    };

    // ============================================================
    // Helper Functions
    // ============================================================
    function cmToInches(cm) {
        return cm * CM_TO_INCHES;
    }

    function roundToOneDecimal(value) {
        return Math.round(value * 10) / 10;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getCategoryForAge(gender, age) {
        const ageGroups = categories[gender];
        if (age < 40) return ageGroups[20];
        if (age < 60) return ageGroups[40];
        return ageGroups[60];
    }

    function getCategory(gender, age, bodyFatPct) {
        const ageGroup = getCategoryForAge(gender, age);
        for (const cat of ageGroup) {
            if (bodyFatPct >= cat.min && bodyFatPct <= cat.max) {
                return cat;
            }
        }
        // If below all categories, return essential
        if (bodyFatPct < ageGroup[0].min) {
            return ageGroup[0];
        }
        // If above all categories, return the last one
        return ageGroup[ageGroup.length - 1];
    }

    function getInterpretation(gender, categoryKey) {
        return interpretations[gender][categoryKey] || interpretations[gender].average;
    }

    function showError(fieldId, message) {
        const el = errorElements[fieldId];
        if (el) {
            el.textContent = message;
            el.classList.add('visible');
        }
        const input = document.getElementById(fieldId === 'gender' ? 'gender-error' : fieldId);
        if (input && input !== el && fieldId !== 'gender') {
            input.classList.add('input-error');
        }
    }

    function clearError(fieldId) {
        const el = errorElements[fieldId];
        if (el) {
            el.textContent = '';
            el.classList.remove('visible');
        }
        const input = document.getElementById(fieldId);
        if (input && fieldId !== 'gender') {
            input.classList.remove('input-error');
        }
    }

    function clearAllErrors() {
        for (const key of Object.keys(errorElements)) {
            clearError(key);
        }
    }

    function setGaugeColor(colorHex) {
        gaugeProgress.setAttribute('stroke', colorHex);
    }

    function updateGauge(bodyFatPct) {
        // Clamp body fat to gauge range for visualization
        const clampedBf = clamp(bodyFatPct, GAUGE_MIN_BF, GAUGE_MAX_BF);
        const fraction = (clampedBf - GAUGE_MIN_BF) / (GAUGE_MAX_BF - GAUGE_MIN_BF);
        const dashOffset = GAUGE_ARC_LENGTH * (1 - fraction);
        gaugeProgress.setAttribute('stroke-dashoffset', dashOffset);
    }

    function displayResults(bodyFatPct, gender, age) {
        const roundedBf = roundToOneDecimal(bodyFatPct);
        const category = getCategory(gender, age, roundedBf);
        const interpretation = getInterpretation(gender, category.key);

        // Update gauge
        updateGauge(roundedBf);
        setGaugeColor(category.color);

        // Update text values
        gaugePercentage.textContent = roundedBf.toFixed(1);
        bfpValue.textContent = roundedBf.toFixed(1);
        categoryText.textContent = category.label;

        // Update category badge styling
        categoryBadge.className = 'category-badge ' + category.key;
        categoryBadge.querySelector('.badge-dot').style.backgroundColor = category.color;

        // Update interpretation
        interpretationText.textContent =
            'Your estimated body fat percentage is ' +
            roundedBf.toFixed(1) +
            '%, which falls in the "' +
            category.label +
            '" range for ' +
            (gender === 'male' ? 'men' : 'women') +
            ' aged ' +
            age +
            '. ' +
            interpretation;

        // Show results card with animation
        resultsCard.hidden = false;
        resultsCard.classList.remove('show-anim');
        // Trigger reflow for animation restart
        void resultsCard.offsetWidth;
        resultsCard.classList.add('show-anim');

        // Smooth scroll to results on mobile
        if (window.innerWidth < 900) {
            resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ============================================================
    // Validation
    // ============================================================
    function validateAll() {
        clearAllErrors();
        let isValid = true;

        // --- Age ---
        const age = parseFloat(ageInput.value);
        if (!ageInput.value.trim() || isNaN(age)) {
            showError('age', 'Please enter your age.');
            isValid = false;
        } else if (age < 10 || age > 100) {
            showError('age', 'Age must be between 10 and 100 years.');
            isValid = false;
        }

        // --- Height ---
        const height = parseFloat(heightInput.value);
        if (!heightInput.value.trim() || isNaN(height)) {
            showError('height', 'Please enter your height.');
            isValid = false;
        } else if (height < 100 || height > 250) {
            showError('height', 'Height must be between 100 and 250 cm.');
            isValid = false;
        }

        // --- Neck ---
        const neck = parseFloat(neckInput.value);
        if (!neckInput.value.trim() || isNaN(neck)) {
            showError('neck', 'Please enter your neck circumference.');
            isValid = false;
        } else if (neck < 20 || neck > 80) {
            showError('neck', 'Neck must be between 20 and 80 cm.');
            isValid = false;
        }

        // --- Waist ---
        const waist = parseFloat(waistInput.value);
        if (!waistInput.value.trim() || isNaN(waist)) {
            showError('waist', 'Please enter your waist circumference.');
            isValid = false;
        } else if (waist < 40 || waist > 200) {
            showError('waist', 'Waist must be between 40 and 200 cm.');
            isValid = false;
        }

        // --- Hip (female only) ---
        let hip = null;
        if (selectedGender === 'female') {
            hip = parseFloat(hipInput.value);
            if (!hipInput.value.trim() || isNaN(hip)) {
                showError('hip', 'Please enter your hip circumference.');
                isValid = false;
            } else if (hip < 50 || hip > 250) {
                showError('hip', 'Hip must be between 50 and 250 cm.');
                isValid = false;
            }
        }

        // --- Cross-field validations ---
        if (isValid && !isNaN(waist) && !isNaN(neck)) {
            if (selectedGender === 'male') {
                if (waist <= neck) {
                    showError('waist', 'Waist must be larger than neck for men.');
                    isValid = false;
                }
            } else {
                if (hip !== null && !isNaN(hip)) {
                    if (waist + hip <= neck) {
                        showError('waist', 'Waist + hip must be larger than neck.');
                        isValid = false;
                    }
                }
            }
        }

        return { isValid, age, height, neck, waist, hip };
    }

    // ============================================================
    // Calculation
    // ============================================================
    function calculateBodyFat(gender, age, heightCm, neckCm, waistCm, hipCm) {
        const heightIn = cmToInches(heightCm);
        const neckIn = cmToInches(neckCm);
        const waistIn = cmToInches(waistCm);

        let bodyFatPct;

        if (gender === 'male') {
            const logArg = waistIn - neckIn;
            if (logArg <= 0) {
                throw new Error('Waist minus neck must be positive for men.');
            }
            bodyFatPct =
                86.010 * Math.log10(waistIn - neckIn) -
                70.041 * Math.log10(heightIn) +
                36.76;
        } else {
            const hipIn = cmToInches(hipCm);
            const logArg = waistIn + hipIn - neckIn;
            if (logArg <= 0) {
                throw new Error('Waist plus hip minus neck must be positive for women.');
            }
            bodyFatPct =
                163.205 * Math.log10(waistIn + hipIn - neckIn) -
                97.684 * Math.log10(heightIn) -
                78.387;
        }

        // Check for invalid results
        if (!isFinite(bodyFatPct) || isNaN(bodyFatPct)) {
            throw new Error('Could not calculate a valid body fat percentage. Please check your measurements.');
        }

        // Clamp to a reasonable range (2% to 60%)
        bodyFatPct = clamp(bodyFatPct, 2, 60);

        return roundToOneDecimal(bodyFatPct);
    }

    // ============================================================
    // Event Handlers
    // ============================================================

    // --- Gender Segmented Control ---
    segmentButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            segmentButtons.forEach(function (b) {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            selectedGender = btn.getAttribute('data-gender');

            // Show/hide hip field
            if (selectedGender === 'female') {
                hipField.hidden = false;
                hipField.classList.remove('show-anim');
                void hipField.offsetWidth;
                hipField.classList.add('show-anim');
            } else {
                hipField.hidden = true;
                hipField.classList.remove('show-anim');
                clearError('hip');
                hipInput.value = '';
            }

            // Clear errors when switching gender
            clearError('waist');
            clearError('hip');
            clearError('gender');
        });

        // Keyboard support
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // --- Form Submit ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const result = validateAll();

        if (!result.isValid) {
            // Focus on the first error field
            const firstErrorKey = ['age', 'gender', 'height', 'neck', 'waist', 'hip'].find(function (key) {
                return errorElements[key] && errorElements[key].classList.contains('visible');
            });
            if (firstErrorKey) {
                const inputEl = document.getElementById(firstErrorKey);
                if (inputEl) {
                    inputEl.focus();
                    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }

        try {
            const bodyFatPct = calculateBodyFat(
                selectedGender,
                result.age,
                result.height,
                result.neck,
                result.waist,
                result.hip
            );
            displayResults(bodyFatPct, selectedGender, result.age);
        } catch (err) {
            // Show a friendly error message in the interpretation area
            if (!resultsCard.hidden) {
                interpretationText.textContent =
                    'There was an issue with the calculation. ' + err.message + ' Please double-check your measurements and try again.';
                categoryText.textContent = 'Error';
                categoryBadge.className = 'category-badge obese';
                bfpValue.textContent = '--';
                gaugePercentage.textContent = '--';
                gaugeProgress.setAttribute('stroke-dashoffset', GAUGE_ARC_LENGTH);
            } else {
                // Show error in the first relevant field
                showError('waist', err.message);
            }
        }
    });

    // --- Reset Button (form) ---
    resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        resetForm();
    });

    // --- Reset from Results ---
    resetFromResults.addEventListener('click', function () {
        resetForm();
    });

    function resetForm() {
        form.reset();
        clearAllErrors();
        resultsCard.hidden = true;
        resultsCard.classList.remove('show-anim');
        // Reset gender to male
        segmentButtons.forEach(function (btn) {
            if (btn.getAttribute('data-gender') === 'male') {
                btn.classList.add('active');
                btn.setAttribute('aria-checked', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            }
        });
        selectedGender = 'male';
        hipField.hidden = true;
        hipField.classList.remove('show-anim');
        hipInput.value = '';
        // Reset gauge
        gaugeProgress.setAttribute('stroke-dashoffset', GAUGE_ARC_LENGTH);
        gaugeProgress.setAttribute('stroke', '#2ecc71');
        gaugePercentage.textContent = '—';
        bfpValue.textContent = '—';
        categoryText.textContent = 'Category';
        categoryBadge.className = 'category-badge';
        interpretationText.textContent = 'Enter your measurements to see your estimated body fat percentage and category.';
        // Focus on the age field
        ageInput.focus();
        ageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // --- Input Event Listeners (clear errors on input) ---
    [ageInput, heightInput, neckInput, waistInput, hipInput].forEach(function (input) {
        input.addEventListener('input', function () {
            const fieldId = input.id;
            clearError(fieldId);
            // Also clear related cross-field errors
            if (fieldId === 'waist' || fieldId === 'neck' || fieldId === 'hip') {
                clearError('waist');
                clearError('neck');
                if (selectedGender === 'female') {
                    clearError('hip');
                }
            }
        });
    });

    // ============================================================
    // Initial Setup
    // ============================================================
    function init() {
        // Ensure hip field is hidden initially
        hipField.hidden = true;
        // Reset gauge to initial state
        gaugeProgress.setAttribute('stroke-dashoffset', GAUGE_ARC_LENGTH);
        gaugeProgress.setAttribute('stroke', '#2ecc71');
        // Set initial gender to male (already set in HTML)
        // Remove any pre-filled values
        form.reset();
        // Clear any error messages
        clearAllErrors();
    }

    // Run initialization
    init();
})();