document.getElementById("build").addEventListener("click", buildMatrix);
document.getElementById("solveGaussianBtn").addEventListener("click", solveGaussian);
document.getElementById("solveGaussJordanBtn").addEventListener("click", solveGaussJordan);
document.getElementById("clear").addEventListener("click", clearAll);

// -------------------------------------------------------------------
// الدوال المساعدة للتحكم في واجهة المستخدم (UI Helpers)
// -------------------------------------------------------------------

/**
 * تبني مصفوفة الإدخال بناءً على القيمة المُدخلة لحجم N.
 */
function buildMatrix() {
    const n = parseInt(document.getElementById("n").value);
    const table = document.getElementById("MatrixTable");
    table.innerHTML = "";

    if (isNaN(n) || n < 2) {
        alert("يرجى إدخال عدد صحيح أكبر من أو يساوي 2.");
        document.getElementById("n").value = 2;
        return;
    }

    for (let i = 0; i < n; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < n + 1; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.className = "cell";
            input.step = "any";
            input.value = (i === j && j < n) ? 1 : 0;
            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

/**
 * يمسح جميع حقول الإدخال والنتائج.
 */
function clearAll() {
    document.getElementById("MatrixTable").innerHTML = "";
    document.getElementById("Output").innerHTML =
        '<div class="Area">سيتم عرض الخطوات هنا بعد النقر على زر الحل.</div>';
}

/**
 * يقرأ القيم من حقول إدخال المصفوفة ويُرجعها كمصفوفة ثنائية الأبعاد (A | b).
 */
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

/**
 * ينسق الأرقام المعروضة في الخطوات.
 */
function formatNumber(num) {
    const TOLERANCE = 1e-9;
    if (Math.abs(num) < TOLERANCE) return "0";
    return parseFloat(num.toFixed(4)).toString();
}

/**
 * دالة القاسم المشترك الأكبر.
 */
function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

// -------------------------------------------------------------------
//  *** التعديل الوحيد في الملف — دالة تحويل الرقم إلى كسر قريب ***
// -------------------------------------------------------------------
function toFraction(num) {
    const TOLERANCE = 1e-12;

    if (Math.abs(num) < TOLERANCE) return "0";

    const sign = num < 0 ? "-" : "";
    num = Math.abs(num);

    const maxDen = 1000; // أقصى مقام للكسر

    if (Math.abs(num - Math.round(num)) < TOLERANCE) {
        return sign + Math.round(num).toString();
    }

    let h1 = 1, h2 = 0;
    let k1 = 0, k2 = 1;
    let b = num;

    do {
        let a = Math.floor(b);
        let h = a * h1 + h2;
        let k = a * k1 + k2;

        if (k > maxDen) break;

        h2 = h1; h1 = h;
        k2 = k1; k1 = k;

        let frac = b - a;
        if (frac < TOLERANCE) break;

        b = 1 / frac;

    } while (true);

    return sign + h1 + "/" + k1;
}

// -------------------------------------------------------------------

/**
 * ينشئ جدول HTML لعرض المصفوفة في قسم الخطوات.
 */
function printMatrix(A) {
    const table = document.createElement("table");
    A.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((val, index) => {
            const td = document.createElement("td");
            td.className = "cell";

            td.textContent = toFraction(val);

            if (index === A[0].length - 1) {
                td.style.borderRight = '3px solid #00ffae';
            }

            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    return table;
}

/**
 * يضيف خطوة جديدة إلى قسم المخرجات.
 */
function addStep(title, A) {
    const output = document.getElementById("Output");
    const stepDiv = document.createElement("div");
    stepDiv.className = "solution-step";

    const titleDiv = document.createElement("div");
    titleDiv.className = "step-title";
    titleDiv.textContent = title;

    stepDiv.appendChild(titleDiv);
    stepDiv.appendChild(printMatrix(A));

    output.appendChild(stepDiv);
}

// -------------------------------------------------------------------
// الدوال الأساسية للعمليات على المصفوفات (Matrix Operations)
// -------------------------------------------------------------------

const TOLERANCE = 1e-12;

function selectNonZeroCol(A, startCol) {
    const rows = A.length,
        cols = A[0].length;
    for (let j = startCol; j < cols - 1; j++) { 
        for (let i = 0; i < rows; i++) {
            if (Math.abs(A[i][j]) > TOLERANCE) return j;
        }
    }
    return -1;
}

function returnNonZeroRow(A, col, startRow) {
    for (let i = startRow; i < A.length; i++) {
        if (Math.abs(A[i][col]) > TOLERANCE) return i;
    }
    return -1;
}

function swapRows(A, r1, r2) {
    [A[r1], A[r2]] = [A[r2], A[r1]];
}

function makePivotOne(A, pivotRow, pivotCol) {
    const pivot = A[pivotRow][pivotCol];
    if (Math.abs(pivot) < TOLERANCE) return;
    if (Math.abs(pivot - 1) < TOLERANCE) return;

    for (let j = 0; j < A[0].length; j++) A[pivotRow][j] /= pivot;
    addStep(`(1/${formatNumber(pivot)}) × R${pivotRow + 1} → R${pivotRow + 1}`, A);
}

function makeColZero(A, pivotRow, pivotCol, isGaussJordan) {
    for (let i = 0; i < A.length; i++) {
        if (!isGaussJordan && i < pivotRow) continue;
        if (i === pivotRow) continue;
        
        const factor = -A[i][pivotCol];
        if (Math.abs(factor) < TOLERANCE) continue;

        for (let j = 0; j < A[0].length; j++) {
            A[i][j] += factor * A[pivotRow][j];
        }
        addStep(`${formatNumber(factor)} × R${pivotRow + 1} + R${i + 1} → R${i + 1}`, A);
    }
}

// -------------------------------------------------------------------
// دوال الحل الرئيسية
// -------------------------------------------------------------------

function executeElimination(A, isGaussJordan) {
    let startRow = 0, startCol = 0;
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
        makeColZero(A, startRow, pivotCol, isGaussJordan);

        startRow++;
        startCol = pivotCol + 1;
    }
    
    return numberOfPivotRows;
}

function analyzeSolution(A, numberOfPivotRows, output) {
    const rows = A.length;
    const cols = A[0].length;
    
    const solutionDiv = document.createElement("div");
    solutionDiv.className = "solution-result";

    for (let i = 0; i < rows; i++) {
        let isZeroRow = true;
        for (let j = 0; j < cols - 1; j++) {
            if (Math.abs(A[i][j]) > TOLERANCE) {
                isZeroRow = false;
                break;
            }
        }
        if (isZeroRow && Math.abs(A[i][cols - 1]) > TOLERANCE) {
            solutionDiv.className += " solution-none";
            solutionDiv.innerHTML = "لا يوجد حل (No solutions): صف متناقض.";
            output.appendChild(solutionDiv);
            return;
        }
    }

    if (numberOfPivotRows < cols - 1) {
        solutionDiv.className += " solution-infinite";
        solutionDiv.innerHTML = "عدد لا نهائي من الحلول (Infinite solutions).";
        output.appendChild(solutionDiv);
        return;
    }
    
    solutionDiv.className += " solution-unique";
    solutionDiv.innerHTML = '<h4>الحل الوحيد:</h4>';

    for (let i = 0; i < rows; i++) {
        const val = A[i][cols - 1];
        solutionDiv.innerHTML += `X${i + 1} = ${toFraction(val)}<br>`;
    }
    output.appendChild(solutionDiv);
}

function solveGaussian() {
    const output = document.getElementById("Output");
    output.innerHTML = "";
    
    let A = readMatrix().map(row => [...row]); 
    if (A.length === 0 || A[0].length === 0) return;
    
    addStep("المصفوفة الأولية - طريقة جاوس (Gaussian):", A);

    const numberOfPivotRows = executeElimination(A, false);

    addStep("شكل الدرج الصفي (REF):", A);

    analyzeSolution(A, numberOfPivotRows, output);
}

function solveGaussJordan() {
    const output = document.getElementById("Output");
    output.innerHTML = "";
    
    let A = readMatrix().map(row => [...row]); 
    if (A.length === 0 || A[0].length === 0) return;
    
    addStep("المصفوفة الأولية - طريقة جاوس-جوردان:", A);

    const numberOfPivotRows = executeElimination(A, true);

    addStep("شكل الدرج الصفي المختزل (RREF):", A);

    analyzeSolution(A, numberOfPivotRows, output);
}
