// --- กรุณาใส่ค่าของคุณที่นี่ ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx6jf_O19PouFJnxhmlcGuCLg2RdTb6SwalfIuyI5aYY72x8g544wKpbgByR3c_wcva/exec';
const LIFF_ID = '2007730528-NmMRX82M';

// --- ตัวแปรสำหรับ DOM Elements ---
const profilePicture = document.getElementById('profile-picture');
const displayName = document.getElementById('display-name');
const statusMessage = document.getElementById('status-message');
const checkinButton = document.getElementById('checkin-button');
const loader = document.getElementById('loader');

// --- ฟังก์ชันหลักที่ทำงานเมื่อหน้าเว็บโหลดเสร็จ ---
window.onload = function() {
    initializeLiff();
};

// --- ฟังก์ชันเริ่มต้นการทำงานของ LIFF ---
async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            const profile = await liff.getProfile();
            displayName.textContent = `สวัสดี, ${profile.displayName}`;
            profilePicture.src = profile.pictureUrl;

            // เพิ่ม Event Listener ให้กับปุ่มหลังจาก LIFF พร้อมใช้งาน
            checkinButton.addEventListener('click', () => handleCheckin('IN'));
        }
    } catch (err) {
        console.error(err);
        statusMessage.textContent = 'เกิดข้อผิดพลาดในการเปิดแอป';
        statusMessage.style.color = '#dc3545';
    }
}

// --- ฟังก์ชันจัดการการกดปุ่มเช็คอิน ---
function handleCheckin(action) {
    showLoading(true);
    statusMessage.textContent = 'กำลังขอตำแหน่งที่ตั้ง...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            // สำเร็จ: ได้รับตำแหน่งแล้ว
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            statusMessage.textContent = 'ได้รับตำแหน่งแล้ว กำลังส่งข้อมูล...';
            sendDataToGas(liff.getContext().userId, lat, lon, action);
        },
        (error) => {
            // ล้มเหลว: ไม่สามารถรับตำแหน่งได้
            console.error(error);
            statusMessage.textContent = 'ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาเปิด GPS';
            statusMessage.style.color = '#dc3545';
            showLoading(false);
        }
    );
}

// --- ฟังก์ชันส่งข้อมูลไปยัง Google Apps Script ---
async function sendDataToGas(userId, lat, lon, action) {
    const url = `${GAS_URL}?userId=${userId}&lat=${lat}&lon=${lon}&action=${action}`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            statusMessage.textContent = result.message;
            statusMessage.style.color = '#28a745'; // สีเขียว
            // ปิดหน้า LIFF หลังจากสำเร็จ 2 วินาที
            setTimeout(() => {
                liff.closeWindow();
            }, 2000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error sending data to GAS:', error);
        statusMessage.textContent = `เกิดข้อผิดพลาด: ${error.message}`;
        statusMessage.style.color = '#dc3545'; // สีแดง
    } finally {
        showLoading(false);
    }
}

// --- ฟังก์ชันแสดง/ซ่อนตัวโหลด ---
function showLoading(isLoading) {
    if (isLoading) {
        loader.style.display = 'block';
        checkinButton.disabled = true;
    } else {
        loader.style.display = 'none';
        checkinButton.disabled = false;
    }
}
