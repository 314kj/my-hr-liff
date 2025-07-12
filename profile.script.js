const GAS_URL = 'https://script.google.com/macros/s/AKfycbzElcYNmEjvbzJJoJuDx4IxDiW_3kowVZVf9vk1ZzRKk17TdDyZk0HdPXuIs9QvJLl5/exec';
const LIFF_ID = '2007730528-rw7ewjK7';

const sickQuotaEl = document.getElementById('sick-quota');
const personalQuotaEl = document.getElementById('personal-quota');
const annualQuotaEl = document.getElementById('annual-quota');
const quotaLoader = document.getElementById('quota-loader');
const formLoader = document.getElementById('form-loader');
const leaveForm = document.getElementById('leave-form');
const submitButton = document.getElementById('submit-button');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

let USER_ID = null;

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

leaveForm.addEventListener('submit', handleFormSubmit);
startDateInput.addEventListener('change', () => {
    if (!endDateInput.value || endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
    }
    endDateInput.min = startDateInput.value;
});

async function fetchLeaveQuotas() {
    quotaLoader.style.display = 'block';
    try {
        const url = `${GAS_URL}?func=getLeaveQuota&userId=${USER_ID}`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'success') {
            const quotas = result.data;
            sickQuotaEl.textContent = quotas.sick || 0;
            personalQuotaEl.textContent = quotas.personal || 0;
            annualQuotaEl.textContent = quotas.annual || 0;
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
    event.preventDefault();
    submitButton.disabled = true;
    formLoader.style.display = 'block';
    const formData = new FormData(leaveForm);
    const params = new URLSearchParams({
        func: 'submitLeave',
        userId: USER_ID
    });
    for (const pair of formData.entries()) {
        params.append(pair[0], pair[1]);
    }
    const url = `${GAS_URL}?${params.toString()}`;
    try {
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message || 'ยื่นใบลาสำเร็จ!');
            if(result.pdfUrl) {
                liff.openWindow({ url: result.pdfUrl, external: true });
            }
            liff.closeWindow();
        } else {
            throw new Error(result.message || 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์');
        }
    } catch (error) {
        console.error('Failed to submit leave request:', error);
        alert('เกิดข้อผิดพลาดในการยื่นใบลา: ' + error.message);
    } finally {
        submitButton.disabled = false;
        formLoader.style.display = 'none';
    }
}
