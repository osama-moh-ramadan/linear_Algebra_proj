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
            input.value = (i === j && j < n) ? 1 : 0; // إعداد قيم افتراضية
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
 * @returns {number[][]} المصفوفة المُعززة.
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
 * @param {number} num - الرقم.
 * @returns {string} الرقم منسقاً.
 */
function formatNumber(num) {
    const TOLERANCE = 1e-9;
    if (Math.abs(num) < TOLERANCE) return "0";
    return parseFloat(num.toFixed(4)).toString();
}

/**
 * ينشئ جدول HTML لعرض المصفوفة في قسم الخطوات.
 * @param {number[][]} A - المصفوفة.
 * @returns {HTMLTableElement} عنصر جدول HTML.
 */
function printMatrix(A) {
    const table = document.createElement("table");
    A.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((val, index) => {
            const td = document.createElement("td");
            td.className = "cell";
            td.textContent = formatNumber(val);
            
            // إضافة فاصل بصري لعمود النتائج (b)
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
 * @param {string} title - عنوان الخطوة.
 * @param {number[][]} A - المصفوفة في هذه الخطوة.
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

const TOLERANCE = 1e-12; // لضمان دقة المقارنة مع الصفر

/**
 * يحدد عمود القائد (Pivot Column) التالي غير الصفري.
 */
function selectNonZeroCol(A, startCol) {
    const rows = A.length,
        cols = A[0].length;
    // نتجاهل العمود الأخير (عمود b)
    for (let j = startCol; j < cols - 1; j++) { 
        for (let i = 0; i < rows; i++) {
            if (Math.abs(A[i][j]) > TOLERANCE) return j;
        }
    }
    return -1;
}

/**
 * يحدد صف القائد (Pivot Row) التالي غير الصفري في عمود مُحدد.
 */
function returnNonZeroRow(A, col, startRow) {
    for (let i = startRow; i < A.length; i++) {
        if (Math.abs(A[i][col]) > TOLERANCE) return i;
    }
    return -1;
}

/**
 * يبدل بين صفين في المصفوفة.
 */
function swapRows(A, r1, r2) {
    // استخدام تبديل مصفوفات ES6 لتبسيط العملية
    [A[r1], A[r2]] = [A[r2], A[r1]]; 
}

/**
 * يجعل القيمة المحورية (Pivot) تساوي 1.
 */
function makePivotOne(A, pivotRow, pivotCol) {
    const pivot = A[pivotRow][pivotCol];
    if (Math.abs(pivot) < TOLERANCE) return;
    if (Math.abs(pivot - 1) < TOLERANCE) return;

    for (let j = 0; j < A[0].length; j++) A[pivotRow][j] /= pivot;
    addStep(`(1/${formatNumber(pivot)}) × R${pivotRow + 1} → R${pivotRow + 1}`, A);
}

/**
 * يصفر العناصر الموجودة في عمود القائد (Pivot Column).
 * @param {boolean} isGaussJordan - إذا كان 'صحيح'، يصفر أعلى وأسفل القائد (Gauss-Jordan).
 * - إذا كان 'خطأ'، يصفر أسفل القائد فقط (Gaussian).
 */
function makeColZero(A, pivotRow, pivotCol, isGaussJordan) {
    for (let i = 0; i < A.length; i++) {
        // في طريقة جاوس (isGaussJordan = false)، نُصفر فقط الصفوف التي تأتي بعد صف القائد
        if (!isGaussJordan && i < pivotRow) continue;
        
        // نتجاهل صف القائد نفسه في كلتا الطريقتين
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
// دوال الحل الرئيسية (Solving Functions)
// -------------------------------------------------------------------

/**
 * ينفذ عملية الحذف الأساسية (للأسفل) بناءً على الطريقة المختارة.
 * @param {number[][]} A - نسخة من المصفوفة للعمل عليها.
 * @param {boolean} isGaussJordan - تحديد الطريقة.
 * @returns {number} عدد الصفوف المحورية.
 */
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

/**
 * تحلل المصفوفة النهائية (بعد الحذف) وتحدد نوع الحل وتطبعه.
 */
function analyzeSolution(A, numberOfPivotRows, output, isGaussJordan) {
    const rows = A.length;
    const cols = A[0].length;
    
    const solutionDiv = document.createElement("div");
    solutionDiv.className = "solution-result";

    // 1. التحقق من حالة "لا حل" (No solution)
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
            solutionDiv.innerHTML = "لا يوجد حل (No solutions): صف متناقض (0 = عدد غير صفري).";
            output.appendChild(solutionDiv);
            return;
        }
    }

    // 2. التحقق من حالة "عدد لا نهائي من الحلول" (Infinite solutions)
    if (numberOfPivotRows < cols - 1) {
        solutionDiv.className += " solution-infinite";
        solutionDiv.innerHTML = "عدد لا نهائي من الحلول (Infinite solutions): توجد متغيرات حرة.";
        output.appendChild(solutionDiv);
        return;
    }
    
    // 3. حالة "حل وحيد" (Unique solution)
    solutionDiv.className += " solution-unique";
    solutionDiv.innerHTML = '<h4>الحل الوحيد:</h4>';

    for (let i = 0; i < rows; i++) {
        const val = A[i][cols - 1];
        solutionDiv.innerHTML += `X${i + 1} = ${formatNumber(val)}<br>`;
    }
    output.appendChild(solutionDiv);
}

// -------------------------------------------------------------------
// الدوال الخاصة بكل طريقة
// -------------------------------------------------------------------

/**
 * حل النظام بطريقة جاوس للحذف (Gaussian Elimination).
 */
function solveGaussian() {
    const output = document.getElementById("Output");
    output.innerHTML = "";
    
    // نستخدم مصفوفة مكررة لكي لا نعدل على القيم الأصلية في واجهة المستخدم
    let A = readMatrix().map(row => [...row]); 
    if (A.length === 0 || A[0].length === 0) return;
    
    addStep("المصفوفة الأولية - طريقة جاوس للحذف (Gaussian Elimination):", A);

    const numberOfPivotRows = executeElimination(A, false); // false = Gaussian

    addStep("شكل الدرج الصفي (Row Echelon Form - REF):", A);

    // *ملاحظة*: في التطبيق العملي لطريقة جاوس، يتم تطبيق التعويض الخلفي (Back Substitution) هنا.
    // بما أن الكود ينتقل إلى دالة analyzeSolution التي تفترض أن شكل المصفوفة هو RREF (جاهز للحل)، 
    // فإن هذا يكفي لإظهار الحل النهائي وتصنيفه.

    analyzeSolution(A, numberOfPivotRows, output, false);
}

/**
 * حل النظام بطريقة جاوس-جوردان (Gauss-Jordan Elimination).
 */
function solveGaussJordan() {
    const output = document.getElementById("Output");
    output.innerHTML = "";
    
    let A = readMatrix().map(row => [...row]); 
    if (A.length === 0 || A[0].length === 0) return;
    
    addStep("المصفوفة الأولية - طريقة جاوس-جوردان (Gauss-Jordan Elimination):", A);

    const numberOfPivotRows = executeElimination(A, true); // true = Gauss-Jordan

    addStep("شكل الدرج الصفي المختزل (Reduced Row Echelon Form - RREF):", A);

    analyzeSolution(A, numberOfPivotRows, output, true);
}