    // --- กรุณาใส่ค่าของคุณที่นี่ ---
    const GAS_URL = 'ใส่_URL_ของเว็บแอป_ของคุณที่นี่';
    const LIFF_ID = 'ใส่_LIFF_ID_ของหน้าโปรไฟล์_ที่นี่';
    
    // --- DOM Elements ---
    const displayName = document.getElementById('display-name');
    const profilePicture = document.getElementById('profile-picture');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const calendarGrid = document.getElementById('calendar-grid');
    const loader = document.getElementById('loader');
    // New summary elements
    const lateMinutesSummary = document.getElementById('late-minutes-summary');
    const sickLeaveSummary = document.getElementById('sick-leave-summary');
    const annualLeaveSummary = document.getElementById('annual-leave-summary');
    
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
            displayName.textContent = profile.displayName;
            profilePicture.src = profile.pictureUrl;
    
            populateSelectors();
            
            monthSelect.addEventListener('change', updateCalendar);
            yearSelect.addEventListener('change', updateCalendar);
    
            updateCalendar(); // Initial load
    
        } catch (error) {
            console.error(error);
            displayName.textContent = "เกิดข้อผิดพลาด";
        }
    };
    
    // --- Calendar & Data Functions ---
    
    function populateSelectors() {
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
    
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            monthSelect.appendChild(option);
        });
        monthSelect.value = currentMonth + 1;
    
        for (let i = 0; i < 3; i++) {
            const year = currentYear - i;
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `ปี ${year + 543}`;
            yearSelect.appendChild(option);
        }
    }
    
    function updateCalendar() {
        const year = yearSelect.value;
        const month = monthSelect.value;
        generateCalendar(year, month);
        fetchAndDrawData(year, month);
    }
    
    function generateCalendar(year, month) {
        calendarGrid.innerHTML = '';
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
    
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }
    
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            dayCell.id = `day-${i}`;
            dayCell.textContent = i;
            calendarGrid.appendChild(dayCell);
        }
    }
    
    async function fetchAndDrawData(year, month) {
        loader.style.display = 'block';
    
        try {
            const url = `${GAS_URL}?func=getAttendanceData&userId=${USER_ID}&year=${year}&month=${month}`;
            const response = await fetch(url);
            const result = await response.json();
    
            if (result.status === 'success') {
                // Draw calendar data
                const calendarData = result.calendarData;
                for (const day in calendarData) {
                    const status = calendarData[day];
                    const dayCell = document.getElementById(`day-${day}`);
                    if (dayCell) {
                        dayCell.classList.add('has-data');
                        if (status === 'On-Time') dayCell.classList.add('on-time');
                        else if (status === 'Late') dayCell.classList.add('late');
                    }
                }
    
                // Update summary data
                const summaryData = result.summaryData;
                lateMinutesSummary.textContent = summaryData.totalLateMinutes || 0;
                sickLeaveSummary.textContent = summaryData.remainingSick || 0;
                annualLeaveSummary.textContent = summaryData.remainingAnnual || 0;
    
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            alert('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            loader.style.display = 'none';
        }
    }
    
