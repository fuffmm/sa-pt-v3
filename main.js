let globalPercent = 0;
const incrementValue = 0.534759358;

const toggleDivs = document.querySelectorAll(".toggleDiv");
const levelDivs = document.querySelectorAll(".levelDiv");
const globalPercentDisplay = document.getElementById("completionPercent");

const rangeInputs = document.querySelectorAll(".myRangeClass");
const btnSubtracts = document.querySelectorAll(".btnSubtractClass");
const btnAdds = document.querySelectorAll(".btnAddClass");

const checkboxes = document.querySelectorAll('input[type="checkbox"]');

document.addEventListener("keydown", function (event) {
  if (event.key === "O" || event.key === "o") {
    const quickMenuDiv = document.querySelector(".quick-menu");
    if (quickMenuDiv) {
      quickMenuDiv.classList.toggle("visible");
    }
  }
});

// Debounce function to limit saveState calls
function debounce(func, wait = 200) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Save current state to localStorage
function saveState() {
  localStorage.setItem("globalPercent", globalPercent);

  toggleDivs.forEach((div, index) => {
    localStorage.setItem(
      `toggleDivState_${index}`,
      div.getAttribute("data-state")
    );
  });

  rangeInputs.forEach((rangeInput, index) => {
    localStorage.setItem(`rangeInputValue_${index}`, rangeInput.value);
  });

  document.querySelectorAll(".listGroup").forEach((parentDiv, pIndex) => {
    const checkboxList = parentDiv.querySelectorAll('input[type="checkbox"]');
    checkboxList.forEach((cb, cbIndex) => {
      localStorage.setItem(
        `listGroup_${pIndex}_checkbox_${cbIndex}`,
        cb.checked.toString()
      );
    });
    localStorage.setItem(
      `listGroup_${pIndex}_dataComplete`,
      parentDiv.getAttribute("data-complete")
    );
  });

  document.querySelectorAll(".listGroupAll").forEach((parentDivAll, pIndex) => {
    const checkboxList = parentDivAll.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxList.forEach((cb, cbIndex) => {
      localStorage.setItem(
        `listGroupAll_${pIndex}_checkbox_${cbIndex}`,
        cb.checked.toString()
      );
    });
    localStorage.setItem(
      `listGroupAll_${pIndex}_dataComplete`,
      parentDivAll.getAttribute("data-complete")
    );
  });
}

// Debounced saveState for performance
const debouncedSaveState = debounce(saveState, 200);

// Update range input value and UI; skipSave to avoid save during load
function updateValue(index, change = 0, skipSave = false) {
  const rangeInput = rangeInputs[index];
  const elementsToToggle = document.querySelectorAll(`[data-group="${index}"]`);
  const rangeValueDisplay =
    document.querySelectorAll(".rangeValueClass")[index];

  let currentValue = Number(rangeInput.value);
  const min = Number(rangeInput.min);
  const max = Number(rangeInput.max);

  currentValue += change;
  currentValue = Math.min(Math.max(currentValue, min), max);

  rangeInput.value = currentValue;
  rangeValueDisplay.textContent = `${currentValue} / ${rangeInput.max}`;

  if (!skipSave) {
    localStorage.setItem(`rangeInputValue_${index}`, currentValue);
  }

  if (currentValue === max) {
    elementsToToggle.forEach((el) => el.setAttribute("data-complete", "true"));
  } else {
    elementsToToggle.forEach((el) => el.setAttribute("data-complete", "false"));
  }

  if (!skipSave) {
    debouncedSaveState();
  }
}

const levelDivObservers = [];

// Setup observers for levelDivs and store them
function setupLevelDivObservers() {
  levelDivs.forEach((div) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-complete"
        ) {
          const oldValue = mutation.oldValue;
          const newValue = div.getAttribute("data-complete");

          if (newValue !== oldValue) {
            if (newValue === "true") {
              globalPercent += incrementValue;
            } else if (newValue === "false") {
              globalPercent -= incrementValue;
            }

            globalPercent = Math.min(Math.max(globalPercent, 0), 100);
            globalPercentDisplay.textContent = `${globalPercent.toFixed(2)}%`;

            debouncedSaveState();
          }
        }
      });
    });

    observer.observe(div, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-complete"],
    });

    levelDivObservers.push(observer);
  });
}

// Recalculate globalPercent based on states of UI elements
function recalculateGlobalPercent() {
  let newPercent = 0;

  // Sum toggleDivs with data-state="on" and data-counted="true"
  toggleDivs.forEach((div) => {
    if (
      div.getAttribute("data-state") === "on" &&
      div.getAttribute("data-counted") === "true"
    ) {
      newPercent += incrementValue;
    }
  });

  // Sum levelDivs with data-complete="true"
  levelDivs.forEach((div) => {
    if (div.getAttribute("data-complete") === "true") {
      newPercent += incrementValue;
    }
  });

  // Sum completed .listGroup
  document.querySelectorAll(".listGroup").forEach((parentDiv) => {
    if (parentDiv.getAttribute("data-complete") === "true") {
      newPercent += incrementValue;
    }
  });

  // Sum completed .listGroupAll
  document.querySelectorAll(".listGroupAll").forEach((parentDivAll) => {
    if (parentDivAll.getAttribute("data-complete") === "true") {
      newPercent += incrementValue;
    }
  });

  newPercent = Math.min(Math.max(newPercent, 0), 100);

  globalPercent = newPercent;
  globalPercentDisplay.textContent = `${globalPercent.toFixed(2)}%`;
}

// Load saved state from localStorage
function loadState() {
  // Disconnect observers before changing attributes to avoid unwanted triggers
  levelDivObservers.forEach((observer) => observer.disconnect());

  // Load globalPercent - will be recalculated later for accuracy
  let savedGlobal = localStorage.getItem("globalPercent");
  if (savedGlobal !== null) {
    globalPercent = parseFloat(savedGlobal);
    globalPercent = Math.min(Math.max(globalPercent, 0), 100);
    globalPercentDisplay.textContent = `${globalPercent.toFixed(2)}%`;
  }

  // Load toggleDiv states
  toggleDivs.forEach((div, index) => {
    const savedState = localStorage.getItem(`toggleDivState_${index}`);
    if (savedState === "on" || savedState === "off") {
      div.setAttribute("data-state", savedState);
    }
  });

  // Load range input values without triggering save
  rangeInputs.forEach((rangeInput, index) => {
    const savedValue = localStorage.getItem(`rangeInputValue_${index}`);
    if (savedValue !== null) {
      rangeInput.value = Number(savedValue);
    }
  });

  // Sync UI display for ranges, skip saving during this
  rangeInputs.forEach((_, index) => {
    updateValue(index, 0, true);
  });

  // Load checkboxes and data-complete in .listGroup
  document.querySelectorAll(".listGroup").forEach((parentDiv, pIndex) => {
    const checkboxList = parentDiv.querySelectorAll('input[type="checkbox"]');
    checkboxList.forEach((cb, cbIndex) => {
      const savedChecked = localStorage.getItem(
        `listGroup_${pIndex}_checkbox_${cbIndex}`
      );
      if (savedChecked !== null) {
        cb.checked = savedChecked === "true";
      }
    });
    const savedComplete = localStorage.getItem(
      `listGroup_${pIndex}_dataComplete`
    );
    if (savedComplete === "true" || savedComplete === "false") {
      parentDiv.setAttribute("data-complete", savedComplete);
    }
  });

  // Load checkboxes and data-complete in .listGroupAll
  document.querySelectorAll(".listGroupAll").forEach((parentDivAll, pIndex) => {
    const checkboxList = parentDivAll.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxList.forEach((cb, cbIndex) => {
      const savedChecked = localStorage.getItem(
        `listGroupAll_${pIndex}_checkbox_${cbIndex}`
      );
      if (savedChecked !== null) {
        cb.checked = savedChecked === "true";
      }
    });
    const savedComplete = localStorage.getItem(
      `listGroupAll_${pIndex}_dataComplete`
    );
    if (savedComplete === "true" || savedComplete === "false") {
      parentDivAll.setAttribute("data-complete", savedComplete);
    }
  });

  // Recalculate globalPercent based on loaded states to ensure consistency
  recalculateGlobalPercent();

  // Reconnect observers after state restoration
  levelDivs.forEach((div, index) => {
    levelDivObservers[index].observe(div, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-complete"],
    });
  });
}

// Event Listeners for toggleDivs with saving
toggleDivs.forEach((div) => {
  div.addEventListener("click", () => {
    const currentState = div.getAttribute("data-state");
    const countsToTotal = div.getAttribute("data-counted");
    const newState = currentState === "off" ? "on" : "off";
    div.setAttribute("data-state", newState);

    if (newState === "on" && countsToTotal === "true") {
      globalPercent += incrementValue;
    } else if (newState === "off" && countsToTotal === "true") {
      globalPercent -= incrementValue;
    }

    globalPercent = Math.min(Math.max(globalPercent, 0), 100);
    globalPercentDisplay.textContent = `${globalPercent.toFixed(2)}%`;

    debouncedSaveState();
  });
});

// Initialize observers
setupLevelDivObservers();

// Event listeners for range inputs & buttons
rangeInputs.forEach((rangeInput, index) => {
  rangeInput.addEventListener("input", () => updateValue(index, 0));
  btnSubtracts[index].addEventListener("click", () => updateValue(index, -1));
  btnAdds[index].addEventListener("click", () => updateValue(index, 1));
});

// Setup for .listGroup checkboxes
const parentDivs = document.querySelectorAll(".listGroup");

parentDivs.forEach((parentDiv) => {
  const checkboxList = parentDiv.querySelectorAll('input[type="checkbox"]');
  let percent = 0;

  function updatePercentOnChange() {
    const allChecked = Array.from(checkboxList).every((cb) => cb.checked);
    const oldComplete = parentDiv.getAttribute("data-complete") === "true";

    if (allChecked && !oldComplete) {
      percent += incrementValue;
      globalPercent += incrementValue;
      parentDiv.setAttribute("data-complete", "true");
    } else if (!allChecked && oldComplete) {
      percent -= incrementValue;
      globalPercent -= incrementValue;
      parentDiv.setAttribute("data-complete", "false");
    }

    percent = Math.min(Math.max(percent, 0), 100);
    globalPercent = Math.min(Math.max(globalPercent, 0), 100);

    globalPercentDisplay.textContent = `${globalPercent.toFixed(2)}%`;

    debouncedSaveState();
  }

  checkboxList.forEach((cb) => {
    cb.addEventListener("change", updatePercentOnChange);
  });

  parentDiv.setAttribute("data-complete", "false");
  updatePercentOnChange();
});

// Setup for .listGroupAll checkboxes
const parentDivsAll = document.querySelectorAll(".listGroupAll");

parentDivsAll.forEach((parentDivAll) => {
  const checkboxList = parentDivAll.querySelectorAll('input[type="checkbox"]');
  let percent =
    Array.from(checkboxList).filter((cb) => cb.checked).length * incrementValue;

  function updatePercentOnChange(event) {
    if (event.target.checked) {
      percent += incrementValue;
      globalPercent += incrementValue;
    } else {
      percent -= incrementValue;
      globalPercent -= incrementValue;
    }

    percent = Math.min(Math.max(percent, 0), 100);
    globalPercent = Math.min(Math.max(globalPercent, 0), 100);

    parentDivAll.setAttribute(
      "data-complete",
      percent === 100 ? "true" : "false"
    );
    globalPercentDisplay.textContent = `${globalPercent.toFixed(2)}%`;

    debouncedSaveState();
  }

  checkboxList.forEach((cb) => {
    cb.addEventListener("change", updatePercentOnChange);
  });

  parentDivAll.setAttribute(
    "data-complete",
    percent === 100 ? "true" : "false"
  );
});

// Function to save selected radio button value to localStorage
function saveSelectedRadio() {
  const selected = document.querySelector('input[name="theme"]:checked');
  if (selected) {
    localStorage.setItem("selectedScheme", selected.value);
  }
}

// Function to load saved radio button state from localStorage and check radio button
function loadSelectedRadio() {
  const saved = localStorage.getItem("selectedScheme");
  if (saved) {
    const radioToCheck = document.querySelector(
      `input[name="theme"][value="${saved}"]`
    );
    if (radioToCheck) {
      radioToCheck.checked = true;
    }
  }
}

// Attach change event listener to radio buttons to save selection
document.querySelectorAll('input[name="theme"]').forEach((radio) => {
  radio.addEventListener("change", saveSelectedRadio);
});

// Load saved state on page load
window.addEventListener("load", loadState);
window.addEventListener("load", loadSelectedRadio);

// Backup save on unload to guarantee data persistence
window.addEventListener("beforeunload", saveState);
window.addEventListener("pagehide", saveState);
