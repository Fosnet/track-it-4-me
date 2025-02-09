let selectedDate = null;
let periodData = JSON.parse(localStorage.getItem('periodData')) || [];
let moodData = JSON.parse(localStorage.getItem('moodData')) || {};
let flowData = JSON.parse(localStorage.getItem('flowData')) || {};

const moodList = [
  " ", "😃", "😢", "😡", "😰", "😴", "🤢", "😍", "🤯", "🤔"
];
const flowList = [
  " ", "💧", "💦", "🌊"
];

function exportData() {
  const data = {
    periodData,
    moodData,
    flowData
  };

  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "trackit4me.json";
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

        if (importedData.periodData && importedData.moodData && importedData.flowData) {
          periodData = importedData.periodData;
          moodData = importedData.moodData;
          flowData = importedData.flowData;
        }

        else if (Array.isArray(importedData)) {
          periodData = importedData;
          moodData = {};
          flowData = {};
        }
        else if (importedData.periodData) {
          periodData = importedData.periodData;
          moodData = importedData.moodData || {};
          flowData = importedData.flowData || {};
        }
        else {
          throw new Error("Invalid JSON format");
        }

        localStorage.setItem('periodData', JSON.stringify(periodData));
        localStorage.setItem('moodData', JSON.stringify(moodData));
        localStorage.setItem('flowData', JSON.stringify(flowData));

        alert("Data imported successfully!");
        renderCalendar();
      } catch (error) {
        console.log("Failed to import as JSON. Attempting custom format...");
        try {
            const customFormatData = parseMyCalendarAndroid(e.target.result);
            if (customFormatData.length > 0) {
              periodData = customFormatData;
              moodData = {};
              flowData = {};
              localStorage.setItem('periodData', JSON.stringify(periodData));
              alert("Data imported successfully!");
              renderCalendar();
            } else {
              throw new Error("No valid data found in custom format");
            }
          } catch (error) {
            alert("Failed to import data. Please ensure the file format is correct.");
            console.error("Import error:", error);
          }
      }



    };
    reader.readAsText(file);
  }
}



function parseMyCalendarAndroid(fileContent) {
  const lines = fileContent.split('\n');
  const parsedPeriods = [];

  let startDate = null;
  lines.forEach(line => {
    const [datePart, eventType] = line.trim().split(/\s{2,}|\t+/);
    if (!datePart || !eventType) return;

    const parsedDate = new Date(datePart);
    if (isNaN(parsedDate)) {
      console.warn(`Invalid date format: ${datePart}`);
      return;
    }

    if (eventType.toLowerCase() === 'period starts') {
      startDate = parsedDate.toISOString().split('T')[0];
    } else if (eventType.toLowerCase() === 'period ends' && startDate) {
      const endDate = parsedDate;
      const length = Math.floor((endDate - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      parsedPeriods.push({ startDate, length });
      startDate = null;
    }
  });

  return parsedPeriods;
}



function deleteAllData() {
  const confirmDelete = confirm("Are you sure you want to delete all data? This action cannot be undone.");
  if (confirmDelete) {
    periodData = [];
    moodData = {};
    flowData = {};
    localStorage.removeItem('periodData');
    localStorage.removeItem('moodData');
    localStorage.removeItem('flowData');
    alert("All data has been deleted.");
    renderCalendar();
  }
}


function dateToString(date) {
    return date.getFullYear() + '-' +
                   String(date.getMonth() + 1).padStart(2, '0') + '-' +
                   String(date.getDate()).padStart(2, '0');
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

    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = dateToString(date)

    const dayNumber = document.createElement('div');
    dayNumber.textContent = day;
    dayNumber.classList.add('day-number');

    const emojiContainer = document.createElement('div');
    emojiContainer.classList.add('mood-container');
    const moods = getMoodsForDate(dateString);
    let flows = [];
    if (isDateWithinPeriod(dateString)) {
      flows = getFlowsForDate(dateString);
      dateCell.classList.add('red');
    }
    emojiContainer.textContent = moods.join(" ") + flows.join(" ") || "\xa0";

    dateCell.appendChild(dayNumber);
    dateCell.appendChild(emojiContainer);

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
      if (dateToString(checkDate) === dateToString(dateObj)) {
        return true;
      }
    }
  }
  return false;
}



function openMenu(dateString) {
  const menu = document.getElementById("menu");
  if (!menu) {
    console.error("Menu element not found!");
    return;
  }
  menu.innerHTML = ''; // Clear previous content

  const selectedPeriodEntry = periodData.find(entry => entry.startDate === dateString);

  const selectedMoodEntry = moodData[dateString];
  const selectedFlowEntry = flowData[dateString];
  menu.style.display = 'block';

  const clickedDate = new Date(dateString);
  const isWithinPeriod = isDateWithinPeriod(dateString);
  const moodsForDate = getMoodsForDate(dateString);
  const flowsForDate = getFlowsForDate(dateString);

  const menuContent = document.createElement("div");
  menuContent.setAttribute("id", "menu-content")

  const selectedDateElement = document.createElement("p");
  selectedDateElement.textContent = `Selected Date: ${clickedDate.toLocaleDateString()}`;
  menuContent.appendChild(selectedDateElement);

  const dropdownsContent = document.createElement("div");
  dropdownsContent.setAttribute("class", "menu-item")

  const moodDropdown = document.createElement("select");
  moodDropdown.setAttribute("class", "dropdown")
  moodDropdown.style.fontSize = "24px";
  moodList.forEach(mood => {
      const moodOption = document.createElement("option");
      moodOption.textContent = mood;
      moodOption.value = mood;

      if (selectedMoodEntry === mood) {
        moodOption.selected = true;
      }
      moodDropdown.appendChild(moodOption);
    });

    moodDropdown.addEventListener("change", (event) => {
      const selectedMood = event.target.value;
      toggleMood(dateString, selectedMood);
    });
  dropdownsContent.appendChild(moodDropdown);

  const flowDropdown = document.createElement("select");
  flowDropdown.setAttribute("class", "dropdown")
  flowDropdown.style.fontSize = "24px";
  flowList.forEach(flow => {
      const flowOption = document.createElement("option");
      flowOption.textContent = flow;
      flowOption.value = flow;

      if (selectedFlowEntry === flow) {
        flowOption.selected = true;
      }
      flowDropdown.appendChild(flowOption);
    });

    flowDropdown.addEventListener("change", (event) => {
      const selectedFlow = event.target.value;
      toggleFlow(dateString, selectedFlow);
    });
  flowDropdown.style.display = isWithinPeriod ? "block" : "none";
  dropdownsContent.appendChild(flowDropdown);

  menuContent.appendChild(dropdownsContent);

  // Start Period Button
  const startButtonContent = document.createElement("div");
  startButtonContent.setAttribute("class", "menu-item")
  const startPeriodButton = document.createElement("button");
  startPeriodButton.textContent = "Start Period";
  startPeriodButton.style.display = isWithinPeriod ? "none" : "block";
  startPeriodButton.onclick = () => addPeriod(dateString);
  startButtonContent.appendChild(startPeriodButton);
  menuContent.appendChild(startButtonContent);

  // End Period Button
  const endButtonContent = document.createElement("div");
  endButtonContent.setAttribute("class", "menu-item")
  const endPeriodButton = document.createElement("button");
  endPeriodButton.textContent = "End Period";
  endPeriodButton.style.display = "block"
  endPeriodButton.onclick = () => endPeriod(dateString);
  endButtonContent.appendChild(endPeriodButton);
  menuContent.appendChild(endButtonContent);

  // Delete Period Button
  const deleteButtonContent = document.createElement("div");
  deleteButtonContent.setAttribute("class", "menu-item")
  const deletePeriodButton = document.createElement("button");
  const periodToDelete = findPeriodByDate(clickedDate);
  deletePeriodButton.textContent = "Delete Period";
  deletePeriodButton.style.display = periodToDelete ? "block" : "none";
  deletePeriodButton.onclick = () => deletePeriod(periodToDelete);
  deleteButtonContent.appendChild(deletePeriodButton);
  menuContent.appendChild(deleteButtonContent);

  // Close Button
  const cancelButtonContent = document.createElement("div");
  cancelButtonContent.setAttribute("class", "menu-item")
  const cancelMenuButton = document.createElement("button");
  cancelMenuButton.textContent = "Close";
  cancelMenuButton.onclick = () => (menu.style.display = 'none');
  cancelButtonContent.appendChild(cancelMenuButton);
  menuContent.appendChild(cancelButtonContent);

  menu.appendChild(menuContent);
}


function renderMoodSelection(selectedDate) {
    const moodContainer = document.getElementById('mood-container');
    moodContainer.innerHTML = '';

    moods.forEach(mood => {
        const moodButton = document.createElement('button');
        moodButton.textContent = mood;
        moodButton.classList.add('mood-button');

        const existingEntry = periodData.find(entry => entry.startDate === selectedDate);
        if (existingEntry && existingEntry.moods && existingEntry.moods.includes(mood)) {
            moodButton.classList.add('selected');
        }

        moodButton.addEventListener('click', () => toggleMood(selectedDate, mood, moodButton));
        moodContainer.appendChild(moodButton);
    });
}


function renderFlowSelection(selectedDate) {
    const flowContainer = document.getElementById('flow-container');
    flowContainer.innerHTML = '';

    flows.forEach(flow => {
        const flowButton = document.createElement('button');
        flowButton.textContent = flow;
        flowButton.classList.add('flow-button');

        const existingEntry = periodData.find(entry => entry.startDate === selectedDate);
        if (existingEntry && existingEntry.flows && existingEntry.flows.includes(flow)) {
            moodButton.classList.add('selected');
        }

        flowButton.addEventListener('click', () => toggleFlow(selectedDate, flow, flowButton));
        flowContainer.appendChild(flowButton);
    });
}


function toggleMood(dateString, mood) {
    moodData[dateString] = mood; // Replace existing mood for that date
    localStorage.setItem('moodData', JSON.stringify(moodData));
    renderCalendar();
}


function toggleFlow(dateString, flow) {
    flowData[dateString] = flow; // Replace existing mood for that date
    localStorage.setItem('flowData', JSON.stringify(flowData));
    renderCalendar();
}


function getMoodsForDate(dateString) {
    return moodData[dateString] ? [moodData[dateString]] : [];
}

function getFlowsForDate(dateString) {
    return flowData[dateString] ? [flowData[dateString]] : [];
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
    renderCalendar();
  }

  menu.style.display = 'none';
}


function addPeriod(dateString) {
  if (!dateString) {
    console.error("Invalid start date:", dateString);
    return;
  }

    let predictedLength = getAverageBleedLength() || 7;
    const startDate = new Date(dateString);
    const periodEntry = {
      startDate: dateString,
      length: predictedLength
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


function getAverageBleedLength() {
  if (periodData.length < 1) {
    return 7;
  }

  periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const relevantPeriods = periodData.slice(0, Math.min(5, periodData.length));

  let totalBleedLength = 0;
  for (let i = 0; i < relevantPeriods.length; i++) {
    totalBleedLength += relevantPeriods[i].length;
  }

  const averageBleedLength = Math.round(totalBleedLength / relevantPeriods.length);
  return averageBleedLength;
}


function highlightEstimatedPeriod() {
  const dateCells = document.querySelectorAll('.date-cell');

  if (periodData.length === 0) return;

  periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const lastPeriod = periodData[0];
  let lastStartDate = new Date(lastPeriod.startDate);
  let averageBleedLength = getAverageBleedLength() || 7;
  const averageCycleLength = getAverageCycleLength();

  const today = new Date();
  const futurePredictions = [];
  while (lastStartDate < new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())) {
    lastStartDate = new Date(lastStartDate);
    lastStartDate.setDate(lastStartDate.getDate() + averageCycleLength);

    const predictedStart = new Date(lastStartDate);
    const predictedEnd = new Date(predictedStart);
    predictedEnd.setDate(predictedStart.getDate() + averageBleedLength - 1);

    futurePredictions.push({ start: predictedStart, end: predictedEnd });
  }

  dateCells.forEach(cell => {
    const cellDate = new Date(
      `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${cell.textContent.trim()}`
    );

    if (isNaN(cellDate)) return;

    let isPredicted = false;

    for (const { start, end } of futurePredictions) {
      if (cellDate >= start && cellDate <= end) {
        const dateString = dateToString(cellDate);

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
