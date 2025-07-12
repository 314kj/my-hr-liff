const GAS_URL = 'https://script.google.com/macros/s/AKfycbzasvMcrhbXpHam5yN4AS0ZIFXyE8_WmAL5WH6jicG01BDaXvpQ5zso3WOJDWCv-6Nq/exec';
const LIFF_ID = '2007730528-NmMRX82M';

const statusMessageEl = document.getElementById('status-message');
const actionButton = document.getElementById('action-button');
const loader = document.getElementById('loader');
let liffContext = null;

async function main() {
    try {
        statusMessageEl.textContent = "กำลังเริ่มต้นแอป...";
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        liffContext = liff.getContext();
        const profile = await liff.getProfile();
        document.getElementById('display-name').textContent = profile.displayName;
        document.getElementById('profile-picture').src = profile.pictureUrl;
        statusMessageEl.textContent = "คุณพร้อมที่จะลงเวลาแล้ว";
        actionButton.textContent = "📍 กดเพื่อเช็คอิน / เช็คเอาท์";
        actionButton.disabled = false;
    } catch (error) {
        handleError(error, 'เกิดข้อผิดพลาดในการเริ่มต้นแอป');
    }
}

actionButton.addEventListener('click', async () => {
    actionButton.disabled = true;
    loader.style.display = 'block';
    statusMessageEl.textContent = 'กำลังขอตำแหน่งที่ตั้ง...';
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        statusMessageEl.textContent = 'ได้รับตำแหน่งแล้ว กำลังส่งข้อมูล...';
        const { latitude, longitude } = position.coords;
        // For simplicity, we assume this button always triggers a check-in.
        // A more complex app could check if the user has already checked in today.
        const url = `${GAS_URL}?action=IN&userId=${liffContext.userId}&lat=${latitude}&lon=${longitude}`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'success') {
            statusMessageEl.textContent = result.message;
            setTimeout(() => liff.closeWindow(), 3000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        handleError(error);
    } finally {
        loader.style.display = 'none';
        actionButton.disabled = false;
    }
});

function handleError(error, defaultMessage = 'เกิดข้อผิดพลาด') {
    console.error(error);
    statusMessageEl.textContent = error.message || defaultMessage;
    actionButton.style.backgroundColor = '#dc3545';
    actionButton.textContent = 'ผิดพลาด';
}

main();
