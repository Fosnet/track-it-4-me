let selectedDate = null;
let periodData = JSON.parse(localStorage.getItem('periodData')) || [];


function exportData() {
  const dataStr = JSON.stringify(periodData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "periodData.json";
  downloadLink.click();
  
  URL.revokeObjectURL(url);
  alert("Data export complete");
}


function importData(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (Array.isArray(importedData)) {
          periodData = importedData;
          localStorage.setItem('periodData', JSON.stringify(periodData));
          alert("Data imported successfully!");
          renderCalendar();
        } else {
          throw new Error("Invalid data format");
        }
      } catch (error) {
        alert("Failed to import data. Please ensure the file format is correct.");
      }
    };
    reader.readAsText(file);
  }
}


function deleteAllData() {
  const confirmDelete = confirm("Are you sure you want to delete all data? This action cannot be undone.");
  if (confirmDelete) {
    periodData = [];
    localStorage.removeItem('periodData');
    alert("All data has been deleted.");
    renderCalendar();
  }
}


document.getElementById("deleteDataBtn").addEventListener("click", deleteAllData);

document.querySelectorAll('.date-cell').forEach(cell => {
  cell.addEventListener('click', onDateCellClick);
});

const calendar = document.getElementById('calendar');
const monthDisplay = document.getElementById('month-display');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const menu = document.getElementById('menu');

let currentDate = new Date();


function renderCalendar() {
  calendar.innerHTML = '';

  monthDisplay.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysOfWeek = ['M', 'T', 'W', 'Th', 'F', 'S', 'S'];
  const headerRow = document.createElement('div');

  daysOfWeek.forEach(day => {
    const dayCell = document.createElement('div');
    dayCell.classList.add('day-header');
    dayCell.classList.add('date-cell');
    dayCell.textContent = day;
    calendar.appendChild(dayCell);
  });

  const firstDay = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;
  const monthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('date-cell', 'empty');
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= monthDays; day++) {
    const dateCell = document.createElement('div');
    dateCell.classList.add('date-cell');
    dateCell.textContent = day;

    const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
    const date = new Date(dateString);

    if (isDateWithinPeriod(dateString)) {
      dateCell.classList.add('red');
    }
    if(date.getDay() == 6 || date.getDay() == 0) {
      dateCell.classList.add('weekend');
    }

    if(date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
      dateCell.classList.add('today');
    }

    dateCell.addEventListener('click', () => openMenu(dateString));
    calendar.appendChild(dateCell);
  }

  highlightEstimatedPeriod();
}


function isDateWithinPeriod(dateString) {
  const dateObj = new Date(dateString);
  for (let entry of periodData) {
    const startDate = new Date(entry.startDate);
    for (let i = 0; i < entry.length; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      if (checkDate.toISOString().split('T')[0] === dateObj.toISOString().split('T')[0]) {
        return true;
      }
    }
  }
  return false;
}


function openMenu(dateString) {
  menu.style.display = 'block';

  const selectedDateElement = document.getElementById('selected-date');
  if (selectedDateElement) {
    selectedDateElement.textContent = `Selected Date: ${new Date(dateString).toLocaleDateString()}`;
  }

}


function openMenu(dateString) {
  menu.style.display = 'block';

  const clickedDate = new Date(dateString);
  const isWithinPeriod = isDateWithinPeriod(dateString);

  const startPeriodButton = document.getElementById('start-period');
  const endPeriodButton = document.getElementById('end-period');
  const deletePeriodButton = document.getElementById('delete-period');
  const cancelMenuButton = document.getElementById('cancel-menu');


  const selectedDateElement = document.getElementById('selected-date');
  if (selectedDateElement) {
    selectedDateElement.textContent = `${new Date(dateString).toLocaleDateString()}`;
  } else {
    console.error("selected-date element not found");
  }

  if (startPeriodButton) {
    if (!isWithinPeriod) {
      startPeriodButton.style.display = 'block';
      startPeriodButton.onclick = () => addPeriod(dateString);
    } else {
      startPeriodButton.style.display = 'none';
    }
  } else {
    console.error("start-period button not found");
  }

  if (endPeriodButton) {
    endPeriodButton.style.display = 'block';
    endPeriodButton.onclick = () => endPeriod(dateString);
  }

  if (deletePeriodButton) {
    const periodToDelete = findPeriodByDate(clickedDate);
    if (periodToDelete) {
      deletePeriodButton.style.display = 'block';
      deletePeriodButton.onclick = () => deletePeriod(periodToDelete);
    } else {
      deletePeriodButton.style.display = 'none';
    }
  } else {
    console.error("delete-period button not found");
  }

  if (cancelMenuButton) {
    cancelMenuButton.onclick = () => {
      menu.style.display = 'none';
    };
  } else {
    console.error("cancel-menu button not found");
  }
}


function findPeriodByDate(date) {
  return periodData.find(entry => {
    const startDate = new Date(entry.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + entry.length - 1);
    return date >= startDate && date <= endDate;
  });
}

function deletePeriod(period) {
  const confirmDelete = confirm(`Are you sure you want to delete the period starting on ${period.startDate}?`);
  if (confirmDelete) {
    periodData = periodData.filter(entry => entry !== period);

    localStorage.setItem('periodData', JSON.stringify(periodData));

    renderCalendar();
  }
}


function endPeriod(dateString) {
  const selectedDate = new Date(dateString);

  const activePeriod = periodData.find(entry => {
    const startDate = new Date(entry.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + entry.length - 1);

    return selectedDate >= startDate;
  });

  if (activePeriod) {
    const startDate = new Date(activePeriod.startDate);

    if (selectedDate > startDate) {
      const newLength = Math.floor((selectedDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      activePeriod.length = newLength;

      localStorage.setItem('periodData', JSON.stringify(periodData));
      renderCalendar();
    } else {
      alert("Selected date is before the start of the period.");
    }
  } else {
    const newPeriod = {
      startDate: dateString,
      length: 7,
    };

    periodData.push(newPeriod);
    localStorage.setItem('periodData', JSON.stringify(periodData));
    alert(`New period started on ${selectedDate.toLocaleDateString()}`);
    renderCalendar();
  }

  menu.style.display = 'none';
}


function addPeriod(dateString) {
  if (!dateString) {
    console.error("Invalid start date:", dateString);
    return;
  }
  
    const startDate = new Date(dateString);
    const periodEntry = {
      startDate: dateString,
      length: 7
    };

    periodData.push(periodEntry);
    localStorage.setItem('periodData', JSON.stringify(periodData));
    menu.style.display = 'none';
    renderCalendar();
  }

  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  

function getEstimatedNextPeriod() {
  if (periodData.length === 0) {
    return { estimatedStart: null, estimatedEnd: null };
  }

  periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const relevantPeriods = periodData.slice(0, Math.min(5, periodData.length));
  if (relevantPeriods.length < 2) {
    const lastPeriodStart = new Date(relevantPeriods[0].startDate);
    const estimatedStart = new Date(lastPeriodStart);
    const estimatedEnd = new Date(lastPeriodStart);
    estimatedStart.setDate(lastPeriodStart.getDate() + 28);
    estimatedEnd.setDate(lastPeriodStart.getDate() + 28 + 6);

    return { estimatedStart, estimatedEnd };
  }

  let totalDays = 0;
  for (let i = 1; i < relevantPeriods.length; i++) {
    const startDate1 = new Date(relevantPeriods[i - 1].startDate);
    const startDate2 = new Date(relevantPeriods[i].startDate);
    
    if (isNaN(startDate1) || isNaN(startDate2)) {
      console.error(`Invalid startDate at index ${i - 1} or ${i}:`, relevantPeriods[i - 1].startDate, relevantPeriods[i].startDate);
      continue;
    }

    totalDays += Math.floor((startDate1 - startDate2) / (1000 * 60 * 60 * 24));
  }

  const averageCycleLength = Math.round(totalDays / (relevantPeriods.length - 1));


  const lastPeriodStart = new Date(relevantPeriods[0].startDate);
  const estimatedStart = new Date(lastPeriodStart);
  estimatedStart.setDate(lastPeriodStart.getDate() + averageCycleLength);

  const estimatedEnd = new Date(estimatedStart);
  estimatedEnd.setDate(estimatedStart.getDate() + 6);


  return { estimatedStart, estimatedEnd };
}


function getAverageCycleLength() {
  if (periodData.length < 2) {
    return 28;
  }

  periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const relevantPeriods = periodData.slice(0, Math.min(5, periodData.length));

  let totalDays = 0;
  for (let i = 1; i < relevantPeriods.length; i++) {
    const startDate1 = new Date(relevantPeriods[i - 1].startDate);
    const startDate2 = new Date(relevantPeriods[i].startDate);
    totalDays += Math.floor((startDate1 - startDate2) / (1000 * 60 * 60 * 24));
  }

  const averageCycleLength = Math.round(totalDays / (relevantPeriods.length - 1));
  return averageCycleLength;
}


function highlightEstimatedPeriod() {
  const dateCells = document.querySelectorAll('.date-cell');

  if (periodData.length === 0) return;

  periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const lastPeriod = periodData[0];
  let lastStartDate = new Date(lastPeriod.startDate);
  let lastLength = lastPeriod.length || 7;
  const averageCycleLength = getAverageCycleLength();

  const today = new Date();
  const futurePredictions = [];
  while (lastStartDate < new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())) {
    lastStartDate = new Date(lastStartDate);
    lastStartDate.setDate(lastStartDate.getDate() + averageCycleLength);

    const predictedStart = new Date(lastStartDate);
    const predictedEnd = new Date(predictedStart);
    predictedEnd.setDate(predictedStart.getDate() + lastLength - 1);

    futurePredictions.push({ start: predictedStart, end: predictedEnd });
  }

  dateCells.forEach(cell => {
    const cellDate = new Date(
      `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${cell.textContent}`
    );

    if (isNaN(cellDate)) return;

    let isPredicted = false;

    for (const { start, end } of futurePredictions) {
      if (cellDate >= start && cellDate <= end) {
        const dateString = cellDate.toISOString().split('T')[0];

        if (!isDateWithinPeriod(dateString)) {
          cell.classList.add('pink');
        } else {
          cell.classList.remove('pink');
        }
        isPredicted = true;
        break;
      }
    }

    if (!isPredicted) {
      cell.classList.remove('pink');
    }
  });
}


document.getElementById("openInfoBtn").addEventListener("click", function() {
    document.getElementById("overlay").style.display = "flex";
});

document.getElementById("closeOverlayBtn").addEventListener("click", function() {
    document.getElementById("overlay").style.display = "none";
});

document.addEventListener('DOMContentLoaded', () => {
  const storedData = localStorage.getItem('periodData');
  if (storedData) {
    try {
      periodData = JSON.parse(storedData);
    } catch (error) {
      console.error("Failed to parse stored data:", error);
      periodData = [];
    }
  }
  const startPeriodButton = document.getElementById('start-period');
  if (startPeriodButton) {
    startPeriodButton.addEventListener('click', () => addPeriod(selectedDate));
  } else {
    console.error("start-period button not found during DOMContentLoaded");
  }
  
  renderCalendar();
  
  document.getElementById("importDataBtn").addEventListener("click", () => {
    document.getElementById("importDataInput").click();
  });

  document.getElementById("importDataInput").addEventListener("change", importData);
  document.getElementById("exportDataBtn").addEventListener("click", exportData);
  document.getElementById("deleteDataBtn").addEventListener("click", deleteAllData);
});
