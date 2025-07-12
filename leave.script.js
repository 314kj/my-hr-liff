// --- กรุณาใส่ค่าของคุณที่นี่ ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbycL45fzEDgzbN_d1Cb5DxFgZW8crVqImQpSPl0ZM-O73-_wqVuAJFkMLfXeD-QK1DL/exec';
const LIFF_ID = '2007730528-yaqgxXdq';

// --- DOM Elements ---
const sickQuotaEl = document.getElementById('sick-quota');
const annualQuotaEl = document.getElementById('annual-quota');
const personalQuotaEl = document.getElementById('personal-quota');
const quotaLoader = document.getElementById('quota-loader');
const formLoader = document.getElementById('form-loader');
const leaveForm = document.getElementById('leave-form');
const submitButton = document.getElementById('submit-button');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

let USER_ID = null;

// --- Main Function ---
window.onload = async function() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        
        const profile = await liff.getProfile();
        USER_ID = profile.userId;

        fetchLeaveQuotas();

    } catch (error) {
        console.error(error);
        alert('เกิดข้อผิดพลาดในการเริ่มต้นแอป');
    }
};

// --- Event Listeners ---
leaveForm.addEventListener('submit', handleFormSubmit);

// Set end-date to be same as start-date initially
startDateInput.addEventListener('change', () => {
    if (!endDateInput.value || endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
    }
    endDateInput.min = startDateInput.value;
});


// --- Functions ---
async function fetchLeaveQuotas() {
    quotaLoader.style.display = 'block';
    try {
        const url = `${GAS_URL}?func=getLeaveQuota&userId=${USER_ID}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            const quotas = result.data;
            sickQuotaEl.textContent = quotas.sick || 0;
            annualQuotaEl.textContent = quotas.annual || 0;
            personalQuotaEl.textContent = quotas.personal || 0;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Failed to fetch quotas:', error);
        alert('ไม่สามารถดึงข้อมูลโควตาได้');
    } finally {
        quotaLoader.style.display = 'none';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    submitButton.disabled = true;
    formLoader.style.display = 'block';

    const formData = new FormData(leaveForm);
    const params = new URLSearchParams();
    
    params.append('func', 'submitLeave');
    params.append('userId', USER_ID);
    for (const pair of formData.entries()) {
        params.append(pair[0], pair[1]);
    }

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });
        
        // Note: GAS web apps with POST return HTML, so we check status not JSON
        if (response.ok) {
            alert('ยื่นใบลาสำเร็จ! กรุณารอการอนุมัติ');
            liff.closeWindow();
        } else {
            throw new Error('Server returned an error.');
        }

    } catch (error) {
        console.error('Failed to submit leave request:', error);
        alert('เกิดข้อผิดพลาดในการยื่นใบลา กรุณาลองใหม่อีกครั้ง');
    } finally {
        submitButton.disabled = false;
        formLoader.style.display = 'none';
    }
}
