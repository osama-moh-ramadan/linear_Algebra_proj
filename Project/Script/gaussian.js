document.getElementById("build").addEventListener("click", buildMatrix);
document.getElementById("solve").addEventListener("click", solveSystem);
document.getElementById("clear").addEventListener("click", clearAll);

function buildMatrix() {
  const n = parseInt(document.getElementById("n").value);
  const table = document.getElementById("MatrixTable");
  const matrixContainer = document.querySelector(".Matrix");
  table.innerHTML = "";

  matrixContainer.classList.remove("grow", "shrink");
  void matrixContainer.offsetWidth; 
  matrixContainer.classList.add("grow");
  setTimeout(() => matrixContainer.classList.remove("grow"), 400);

  for (let i = 0; i < n; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < n + 1; j++) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.className = "cell";
      input.step = "any";
      input.style.opacity = "0"; 
      input.style.transform = "scale(0.8)";
      cell.appendChild(input);
      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  const cells = table.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    setTimeout(() => {
      cell.style.transition = "all 0.3s ease";
      cell.style.opacity = "1";
      cell.style.transform = "scale(1)";
    }, index * 140); 
  });

  matrixContainer.classList.remove("expand", "smooth-back");
  void matrixContainer.offsetWidth;
  matrixContainer.classList.add("expand");

  setTimeout(() => {
    matrixContainer.classList.remove("expand");
    matrixContainer.classList.add("smooth-back");
  }, 600);
}

function clearAll() {
  document.getElementById("MatrixTable").innerHTML = "";
  document.getElementById("Output").innerHTML =
    '<div class="Area">The steps will appear here after clicking Solve.</div>';
}

function formatNumber(num) {
  if (Math.abs(num) < 1e-9) return "0";
  return parseFloat(num.toFixed(3)).toString();
}

function readMatrix() {
  const rows = document.querySelectorAll("#MatrixTable tr");
  const A = [];
  rows.forEach((row) => {
    const values = [];
    row.querySelectorAll("input").forEach((input) => {
      values.push(parseFloat(input.value) || 0);
    });
    A.push(values);
  });
  return A;
}

function printMatrix(A) {
  const table = document.createElement("table");
  A.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((val) => {
      const td = document.createElement("td");
      td.className = "cell";
      td.textContent = formatNumber(val);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  return table;
}

function addStep(title, A) {
  const output = document.getElementById("Output");
  const stepDiv = document.createElement("div");
  stepDiv.style.backgroundColor = "#2f3234";
  stepDiv.style.borderRadius = "12px";
  stepDiv.style.padding = "10px";
  stepDiv.style.marginTop = "10px";
  stepDiv.style.color = "white";
  stepDiv.style.fontFamily = "monospace";

  const titleDiv = document.createElement("div");
  titleDiv.textContent = title;
  titleDiv.style.marginBottom = "6px";
  titleDiv.style.color = "#dcdcdc";

  stepDiv.appendChild(titleDiv);
  stepDiv.appendChild(printMatrix(A));

  output.appendChild(stepDiv);
}

function selectNonZeroCol(A, startCol) {
  const rows = A.length,
    cols = A[0].length;
  for (let j = startCol; j < cols - 1; j++) {
    for (let i = 0; i < rows; i++) {
      if (Math.abs(A[i][j]) > 1e-12) return j;
    }
  }
  return -1;
}

function returnNonZeroRow(A, col, startRow) {
  for (let i = startRow; i < A.length; i++) {
    if (Math.abs(A[i][col]) > 1e-12) return i;
  }
  return -1;
}

function swapRows(A, r1, r2) {
  [A[r1], A[r2]] = [A[r2], A[r1]];
}

function makePivotOne(A, pivotRow, pivotCol) {
  const pivot = A[pivotRow][pivotCol];
  if (Math.abs(pivot) < 1e-12) return;
  if (Math.abs(pivot - 1) < 1e-12) return;

  for (let j = 0; j < A[0].length; j++) A[pivotRow][j] /= pivot;
  addStep(`(1/${formatNumber(pivot)}) × R${pivotRow + 1} → R${pivotRow + 1}`, A);
}

function makeColZero(A, pivotRow, pivotCol) {
  for (let i = 0; i < A.length; i++) {
    if (i === pivotRow) continue;
    const factor = -A[i][pivotCol];
    if (Math.abs(factor) < 1e-12) continue;

    for (let j = 0; j < A[0].length; j++) {
      A[i][j] += factor * A[pivotRow][j];
    }
    addStep(`${formatNumber(factor)} × R${pivotRow + 1} + R${i + 1} → R${i + 1}`, A);
  }
}

function solveSystem() {
  const output = document.getElementById("Output");
  output.innerHTML = "";
  let A = readMatrix();
  if (A.length === 0) return;

  addStep("Initial Augmented Matrix (A | b):", A);

  let startRow = 0,
      startCol = 0;

  let numberOfPivotRows = 0;

  while (startRow < A.length && startCol < A[0].length - 1) {
    const pivotCol = selectNonZeroCol(A, startCol);
    if (pivotCol === -1) break;

    const pivotRow = returnNonZeroRow(A, pivotCol, startRow);
    if (pivotRow === -1) {
      startCol++;
      continue;
    }

    numberOfPivotRows++;

    if (pivotRow !== startRow) {
      swapRows(A, pivotRow, startRow);
      addStep(`Swap R${pivotRow + 1} ↔ R${startRow + 1}`, A);
    }

    makePivotOne(A, startRow, pivotCol);
    makeColZero(A, startRow, pivotCol);

    startRow++;
    startCol = pivotCol + 1;
  }

  addStep("Final Reduced Row-Echelon Form:", A);

  const rows = A.length;
  const cols = A[0].length;

  const solutionDiv = document.createElement("div");
  solutionDiv.style.backgroundColor = "#2f3234";
  solutionDiv.style.borderRadius = "12px";
  solutionDiv.style.padding = "10px";
  solutionDiv.style.marginTop = "10px";
  solutionDiv.style.color = "#00ffae";
  solutionDiv.style.fontFamily = "monospace";

  for (let i = 0; i < rows; i++) {
    let isZeroRow = true;
    for (let j = 0; j < cols - 1; j++) {
      if (Math.abs(A[i][j]) > 1e-12) {
        isZeroRow = false;
        break;
      }
    }
    if (isZeroRow && Math.abs(A[i][cols - 1]) > 1e-12) {
      solutionDiv.style.color = "red";
      solutionDiv.innerHTML = "No solutions.";
      output.appendChild(solutionDiv);
      return;
    }
  }

  if (numberOfPivotRows < cols - 1) {
    solutionDiv.style.color = "orange";
    solutionDiv.innerHTML = "Infinite solutions.";
    output.appendChild(solutionDiv);
    return;
  }

  for (let i = 0; i < rows; i++) {
    const val = Math.abs(A[i][cols - 1]) < 1e-12 ? 0 : A[i][cols - 1];
    solutionDiv.innerHTML += `X${i + 1} = ${formatNumber(val)}<br>`;
  }
  output.appendChild(solutionDiv);
}