// --- กรุณาใส่ค่าของคุณที่นี่ ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx6jf_O19PouFJnxhmlcGuCLg2RdTb6SwalfIuyI5aYY72x8g544wKpbgByR3c_wcva/exec';
const LIFF_ID = '2007730528-yaqgxXdq';

// --- DOM Elements (แก้ไขใหม่) ---
const sickQuotaEl = document.getElementById('sick-quota');
const personalQuotaEl = document.getElementById('personal-quota'); // แก้ไขจาก annual
const annualQuotaEl = document.getElementById('annual-quota'); // เพิ่มใหม่
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
            // อัปเดตการแสดงผลให้ตรงกับ UI ใหม่
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

// --- ฟังก์ชันจัดการการยื่นฟอร์ม (เวอร์ชันแก้ไข CORS) ---
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

    // สร้าง URL ใหม่พร้อมพารามิเตอร์ทั้งหมด
    const fullUrl = `${GAS_URL}?${params.toString()}`;

    try {
        // ส่งข้อมูลด้วยเมธอด GET ซึ่งไม่ติดปัญหา CORS
        const response = await fetch(fullUrl);
        const result = await response.json();

        if (result.status === 'success') {
            alert(result.message || 'ยื่นใบลาสำเร็จ!');
            // คุณสามารถเพิ่มลิงก์ PDF ได้ที่นี่ถ้าต้องการ
            // if(result.pdfUrl) {
            //     liff.openWindow({ url: result.pdfUrl, external: true });
            // }
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
