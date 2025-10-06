// Initialize with today's date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    startDateInput.value = formatDateForInput(today);

    // Event listeners
    document.getElementById('todayBtn').addEventListener('click', setToday);
    document.getElementById('monthBtn').addEventListener('click', () => calculateEndDate(30));
    document.getElementById('yearBtn').addEventListener('click', () => calculateEndDate(365));
    document.getElementById('customBtn').addEventListener('click', calculateCustom);
    document.getElementById('copyBtn').addEventListener('click', copyDate);
    document.getElementById('shareBtn').addEventListener('click', shareDate);
    document.getElementById('addCalendarBtn').addEventListener('click', addToCalendar);
    
    // Allow Enter key for custom days
    document.getElementById('customDays').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateCustom();
        }
    });
});

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setToday() {
    const startDateInput = document.getElementById('startDate');
    startDateInput.value = formatDateForInput(new Date());
}

function calculateEndDate(days) {
    const startDateInput = document.getElementById('startDate');
    const startDate = new Date(startDateInput.value);
    
    if (!startDateInput.value) {
        showNotification('Please select a start date', 'error');
        return;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    displayResult(startDate, endDate, days);
}

function calculateCustom() {
    const customDaysInput = document.getElementById('customDays');
    const days = parseInt(customDaysInput.value);

    if (!days || days < 1) {
        showNotification('Please enter a valid number of days', 'error');
        return;
    }

    calculateEndDate(days);
}

function displayResult(startDate, endDate, days) {
    const resultCard = document.getElementById('resultCard');
    const endDateEl = document.getElementById('endDate');
    const durationInfoEl = document.getElementById('durationInfo');
    const daysCountEl = document.getElementById('daysCount');
    const startLabelEl = document.getElementById('startLabel');
    const endLabelEl = document.getElementById('endLabel');

    // Format dates
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const endDateFormatted = endDate.toLocaleDateString('en-US', options);
    const startDateFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDateShort = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Calculate duration description
    let durationText = '';
    if (days === 30) {
        durationText = '1 Month Subscription';
    } else if (days === 365) {
        durationText = '1 Year Subscription';
    } else {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        if (months > 0 && remainingDays === 0) {
            durationText = `${months} Month${months > 1 ? 's' : ''} Subscription`;
        } else if (months > 0) {
            durationText = `${months} Month${months > 1 ? 's' : ''} & ${remainingDays} Day${remainingDays > 1 ? 's' : ''} Subscription`;
        } else {
            durationText = `${days} Day${days > 1 ? 's' : ''} Subscription`;
        }
    }

    // Calculate days from now
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDateCopy = new Date(endDate);
    endDateCopy.setHours(0, 0, 0, 0);
    const daysFromNow = Math.ceil((endDateCopy - now) / (1000 * 60 * 60 * 24));

    let daysFromNowText = '';
    if (daysFromNow > 0) {
        daysFromNowText = `${daysFromNow} days from now`;
    } else if (daysFromNow === 0) {
        daysFromNowText = 'Today';
    } else {
        daysFromNowText = `${Math.abs(daysFromNow)} days ago`;
    }

    // Update UI
    endDateEl.textContent = endDateFormatted;
    durationInfoEl.textContent = durationText;
    daysCountEl.textContent = daysFromNowText;
    startLabelEl.textContent = startDateFormatted;
    endLabelEl.textContent = endDateShort;

    // Show result card with animation
    resultCard.style.display = 'block';
    
    // Scroll to result
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    // Store the result for copy/share functions
    window.currentResult = {
        startDate,
        endDate,
        days,
        endDateFormatted
    };
}

function copyDate() {
    if (!window.currentResult) return;

    const text = `Subscription End Date: ${window.currentResult.endDateFormatted}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Date copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy date', 'error');
    });
}

function shareDate() {
    if (!window.currentResult) return;

    const { endDateFormatted, days } = window.currentResult;
    const text = `My ${days}-day subscription ends on ${endDateFormatted}. Calculate yours at ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'SubCalc - Subscription End Date',
            text: text,
        }).catch(() => {
            // User cancelled or error occurred
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Share link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Sharing not supported', 'error');
        });
    }
}

function addToCalendar() {
    if (!window.currentResult) return;

    const { endDate, days } = window.currentResult;
    
    // Format for calendar
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Create Google Calendar link
    const title = encodeURIComponent(`Subscription Renewal (${days} days)`);
    const details = encodeURIComponent('Your subscription renews today. Cancel if you don\'t want to continue.');
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;

    window.open(calendarUrl, '_blank');
    showNotification('Opening calendar...', 'success');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'error' ? 'var(--danger-color)' : 'var(--success-color)';
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

