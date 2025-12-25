document.addEventListener("DOMContentLoaded", function () {

    /* ===============================
       1️⃣ AUTH CHECK
    =============================== */
    const userData = sessionStorage.getItem("loggedInUser");
    if (!userData) {
        window.location.href = "signin.html";
        return;
    }

    const user = JSON.parse(userData);
    const userEmail = user.email;

    /* ===============================
       2️⃣ NAVBAR
    =============================== */
    const userNameEl = document.getElementById("userName");
    const userTypeEl = document.getElementById("userType");

    if (userNameEl) userNameEl.innerText = user.fullName;
    if (userTypeEl) {
        userTypeEl.innerText =
            user.userType === "student"
                ? "🎓 Student Financial Planner"
                : "💼 Professional Financial Planner";
    }

    /* ===============================
       3️⃣ DOM ELEMENTS
    =============================== */
    const expenseForm = document.getElementById("expenseForm");
    const expenseList = document.getElementById("expenseList");
    const totalExpenseEl = document.getElementById("totalExpense");
    const spendingInsightList = document.getElementById("spendingInsightList");
    const smartInsightList = document.getElementById("insightList");

    const budgetInput = document.getElementById("budgetInput");
    const saveBudgetBtn = document.getElementById("saveBudgetBtn");
    const budgetDisplay = document.getElementById("budgetDisplay");

    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const overspendAlert = document.getElementById("overspendAlert");

    const quickViewInvestments = document.getElementById("quickViewInvestments");
    const incomeKey = `income_${user.email}`;



quickViewInvestments?.addEventListener("click", () => {
    window.location.href = "investments.html";
});


    /* ===============================
       4️⃣ STORAGE KEYS (PER USER)
    =============================== */
    const expenseKey = `expenses_${userEmail}`;
    const budgetKey = `budget_${userEmail}`;
    // const incomeKey = `income_${userEmail}`;

    let expenses = JSON.parse(localStorage.getItem(expenseKey)) || [];
    let expenseChart = null;

    function updateLowerSummaryCards() {
    const budget = Number(localStorage.getItem(budgetKey)) || 0;
    const spent = getTotalExpenses();

    document.getElementById("totalExpensesValue").innerText = `₹${spent}`;
    document.getElementById("budgetLeftValue").innerText =
        budget ? `₹${budget - spent}` : "—";

    const totals = getCategoryTotals();
    let topCat = "—", max = 0;

    for (let cat in totals) {
        if (totals[cat] > max) {
            max = totals[cat];
            topCat = cat;
        }
    }

    document.getElementById("topCategoryValue").innerText = topCat;
}


const goalsKey = `goals_${userEmail}`;
let goals = JSON.parse(localStorage.getItem(goalsKey)) || [];


    /* ===============================
       5️⃣ HELPERS
    =============================== */
    function parseCSV(text) {
    const lines = text
        .replace(/\r/g, "")
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    const rows = [];

    lines.forEach((line, index) => {

        // Skip header row
        if (index === 0 && line.toLowerCase().includes("date")) return;

        const cols = line.includes(";")
            ? line.split(";")
            : line.split(",");

        if (cols.length < 3) return;

        const date = cols[0]?.trim();
        const description = cols[1]?.replace(/"/g, "").trim();

        // 🔥 FIX: CLEAN AMOUNT PROPERLY
        let amountStr = cols.slice(2).join(""); // handles commas in amount
        amountStr = amountStr
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .replace(/"/g, "")
            .trim();

        const rawAmount = parseFloat(amountStr);

        if (!date || !description || isNaN(rawAmount)) return;

        rows.push({
            date,
            description,
            amount: Math.abs(rawAmount),
            type: rawAmount < 0 ? "Expense" : "Income",
            category: autoCategorize(description)
        });
    });

    console.log("✅ Parsed CSV rows:", rows);
    return rows;
}



function autoCategorize(desc) {
    desc = desc.toLowerCase();

    if (desc.includes("food") || desc.includes("restaurant")) return "Food";
    if (desc.includes("uber") || desc.includes("ola")) return "Travel";
    if (desc.includes("amazon") || desc.includes("flipkart")) return "Shopping";
    if (desc.includes("rent")) return "Rent";
    if (desc.includes("netflix") || desc.includes("spotify")) return "Subscriptions";

    return "Others";
}
function importTransactions(transactions) {

    let totalIncomeFromPDF = 0;

    transactions.forEach(txn => {

        if (txn.type === "Expense") {
            expenses.push({
                title: txn.description,
                amount: txn.amount,
                category: txn.category,
                date: txn.date
            });
        }

        if (txn.type === "Income") {
            totalIncomeFromPDF += txn.amount;
        }
    });

    // ✅ SAVE EXPENSES
    localStorage.setItem(expenseKey, JSON.stringify(expenses));

    // ✅ SAVE INCOME (this was missing)
    if (totalIncomeFromPDF > 0) {
        const existingIncome =
            JSON.parse(localStorage.getItem(incomeKey)) || { monthlyIncome: 0 };

        existingIncome.monthlyIncome += totalIncomeFromPDF;

        localStorage.setItem(
            incomeKey,
            JSON.stringify(existingIncome)
        );
    }

    // 🔁 FULL UI UPDATE
    localStorage.setItem(expenseKey, JSON.stringify(expenses));

renderExpenses();          // handles expense UI
updateSummaryCards();      // 🔥 income + expense + savings
updateLowerSummaryCards();
generateSmartInsights();
renderExpenseChart();      // 🔥 chart must render even if only PDF data

}


let extractedTransactions = [];

document
.getElementById("uploadStatementBtn")
.addEventListener("click", () => {

    const fileInput = document.getElementById("statementInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a CSV or PDF file");
        return;
    }

    console.log("📄 Uploaded file:", file.name, file.type);

    const fileName = file.name.toLowerCase();
    const status = document.getElementById("uploadStatus");

    if (
        file.type === "text/csv" ||
        fileName.includes(".csv")
    ) {
        const reader = new FileReader();

        reader.onload = () => {
            console.log("📄 CSV file read successfully");
            extractedTransactions = parseCSV(reader.result);
            console.log("✅ Parsed CSV rows:", extractedTransactions);
            showPreview(extractedTransactions);
            status.innerText = "✅ CSV parsed successfully";
        };

        reader.readAsText(file);

    } else if (
        file.type === "application/pdf" ||
        fileName.includes(".pdf")
    ) {
        status.innerText = "📄 Extracting PDF transactions...";
        parsePDF(file);
    } else {
        alert("Unsupported file format");
    }
});


function showPreview(transactions) {
    const section = document.getElementById("previewSection");
    const tbody = document.querySelector("#previewTable tbody");

    tbody.innerHTML = "";

    transactions.slice(0, 20).forEach(txn => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${txn.date}</td>
            <td>${txn.description}</td>
            <td>₹${txn.amount}</td>
            <td>${txn.type}</td>
        `;
        tbody.appendChild(row);
    });

    section.classList.remove("hidden");

    // ✅ GENERATE AI SUMMARY HERE
    const aiText = generateAISpendingSummary(transactions);
    document.getElementById("aiSummaryText").innerText = aiText;
}



document
.getElementById("confirmImportBtn")
.addEventListener("click", () => {

    importTransactions(extractedTransactions);

    // ✅ Re-run AI after final import
    const aiText = generateAISpendingSummary(extractedTransactions);
    document.getElementById("aiSummaryText").innerText = aiText;

    alert("🎉 Transactions imported successfully!");
    document.getElementById("previewSection").classList.add("hidden");
});

async function parsePDF(file) {
    let transactions = [];

    try {
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        const pdf = await pdfjsLib.getDocument({
            data: typedArray
        }).promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            textContent.items.forEach(item => {
                fullText += item.str + "\n";
            });
        }

        console.log("📄 Extracted PDF Text:", fullText);

        transactions = extractTransactionsFromText(fullText);

        if (!transactions || transactions.length === 0) {
            alert("Unable to read PDF. Please upload a text-based bank statement.");
            return;
        }

        extractedTransactions = transactions;

        showPreview(extractedTransactions);
        document.getElementById("uploadStatus").innerText =
            "✅ PDF parsed successfully";

    } catch (err) {
        console.error("❌ PDF parsing failed:", err);
        // alert("Unable to read PDF. Please upload a text-based bank statement.");
    }
}



function extractTransactionsFromText(text) {
    const lines = text
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    const transactions = [];

    for (let i = 0; i < lines.length; i++) {

        // 1️⃣ Match date
        const dateMatch = lines[i].match(/\d{2}-\d{2}-\d{4}/);
        if (!dateMatch) continue;

        const date = dateMatch[0];

        // 2️⃣ Next line → description
        const description = lines[i + 1] || "";

        // 3️⃣ Next numeric value → amount
        let amount = null;
        for (let j = i + 2; j < i + 5; j++) {
            if (!lines[j]) continue;

            const clean = lines[j].replace(/[₹,]/g, "");
            if (!isNaN(clean)) {
                amount = parseFloat(clean);
                break;
            }
        }

        if (!description || amount === null) continue;

        // 4️⃣ Decide type
        const isIncome =
            description.toLowerCase().includes("credit") ||
            description.toLowerCase().includes("salary") ||
            description.toLowerCase().includes("interest") ||
            description.toLowerCase().includes("payment");

        transactions.push({
            date,
            description,
            amount: Math.abs(amount),
            type: isIncome ? "Income" : "Expense",
            category: autoCategorize(description)
        });
    }

    console.log("✅ Parsed PDF rows:", transactions);
    return transactions;
}

function autoCategorize(description) {
    description = description.toLowerCase();

    if (description.includes("amazon") || description.includes("flipkart"))
        return "Shopping";
    if (description.includes("zomato") || description.includes("swiggy"))
        return "Food";
    if (description.includes("uber") || description.includes("ola"))
        return "Transport";
    if (description.includes("salary"))
        return "Income";

    return "Others";
}
function generateAISpendingSummary(transactions) {

    if (!transactions || transactions.length === 0) {
        return "No transaction data available for analysis.";
    }

    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    transactions.forEach(tx => {
        if (tx.type === "Income") {
            income += tx.amount;
        } else {
            expense += tx.amount;
            categoryTotals[tx.category] =
                (categoryTotals[tx.category] || 0) + tx.amount;
        }
    });

    const savings = income - expense;

    // 🔍 Find highest spending category
    let topCategory = "";
    let maxSpent = 0;

    for (let cat in categoryTotals) {
        if (categoryTotals[cat] > maxSpent) {
            maxSpent = categoryTotals[cat];
            topCategory = cat;
        }
    }

    // 🧠 AI-style reasoning
    let summary = "";

    summary += `Your total income is ₹${income.toFixed(0)}, `;
    summary += `while your total expenses are ₹${expense.toFixed(0)}. `;

    if (savings > 0) {
        summary += `You managed to save ₹${savings.toFixed(0)} this period. `;
    } else {
        summary += `You are spending more than your income. `;
    }

    if (topCategory) {
        const percent = ((maxSpent / expense) * 100).toFixed(0);
        summary += `Most of your money (${percent}%) was spent on ${topCategory}. `;
    }

    // 🎯 Actionable advice
    if (topCategory === "Food") {
        summary += "Reducing outside food expenses by even 20% can improve your savings significantly.";
    } else if (topCategory === "Shopping") {
        summary += "Try applying a 24-hour rule before making non-essential purchases.";
    } else if (savings < 0) {
        summary += "Consider setting a monthly budget to regain financial control.";
    } else {
        summary += "You are maintaining healthy financial habits. Keep it up!";
    }

    return summary;
}

// document.addEventListener("DOMContentLoaded", () => {

//     const fileInput = document.getElementById("statementUpload");
//     const previewBody = document.getElementById("previewBody");
//     const confirmBtn = document.getElementById("confirmImport");

//     let parsedTransactions = [];

//     fileInput.addEventListener("change", () => {
//         const file = fileInput.files[0];
//         if (!file) return;

//         console.log("📄 Uploaded file:", file.name, file.type);

//         previewBody.innerHTML = "";
//         parsedTransactions = [];
//         confirmBtn.disabled = true;

//         if (file.type === "text/csv") {
//             parseCSV(file);
//         } else {
//             alert("Only CSV supported for now");
//         }
//     });

//     function parseCSV(text) {
//     console.log("📄 RAW CSV TEXT ↓↓↓");
//     console.log(text);

//     // Remove BOM + normalize minus
//     text = text
//         .replace(/\uFEFF/g, "")
//         .replace(/–/g, "-");

//     const lines = text
//         .split(/\r?\n/)
//         .map(l => l.trim())
//         .filter(Boolean);

//     if (lines.length === 0) return [];

//     // 🔍 AUTO-DETECT DELIMITER
//     let delimiter = ",";
//     if (lines[0].includes("\t")) delimiter = "\t";
//     else if (lines[0].includes(";")) delimiter = ";";

//     console.log("🧩 Detected delimiter:", JSON.stringify(delimiter));

//     const rows = [];

//     lines.forEach((line, index) => {

//         // Skip header
//         if (index === 0 && /date/i.test(line)) return;

//         const cols = line.split(delimiter).map(c => c.trim());

//         if (cols.length < 2) return;

//         const date = cols[0].replace(/"/g, "");

//         let description = "";
//         let amount = null;

//         cols.forEach(col => {
//             let v = col
//                 .replace(/₹|,/g, "")
//                 .replace(/"/g, "")
//                 .trim();

//             // (123.45) format
//             if (/^\(\d+(\.\d+)?\)$/.test(v)) {
//                 v = "-" + v.replace(/[()]/g, "");
//             }

//             if (!isNaN(v) && v !== "") {
//                 amount = parseFloat(v);
//             } else {
//                 description += " " + col;
//             }
//         });

//         if (!date || amount === null) return;

//         rows.push({
//             date,
//             description: description.trim(),
//             amount: Math.abs(amount),
//             type: amount < 0 ? "Expense" : "Income"
//         });
//     });

//     console.log("✅ Parsed CSV rows:", rows);
//     return rows;
// }

// async function handlePDF(file) {
//     console.log("📘 Parsing PDF...");

//     const arrayBuffer = await file.arrayBuffer();
//     const loadingTask = pdfjsLib.getDocument({
//   data: typedArray,
//   disableWorker: false
// });

//    try {
//   const pdf = await pdfjsLib.getDocument({
//     data: typedArray,
//     disableWorker: false
//   }).promise;
//   // normal parsing
// } catch (e) {
//   console.warn("⚠️ Worker failed, using fallback", e);

//   const pdf = await pdfjsLib.getDocument({
//     data: typedArray,
//     disableWorker: true
//   }).promise;
// }



//     let fullText = "";

//     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//         const page = await pdf.getPage(pageNum);
//         const content = await page.getTextContent();

//         const pageText = content.items
//             .map(item => item.str)
//             .join(" ");

//         fullText += "\n" + pageText;
//     }

//     console.log("📄 Extracted PDF text ↓↓↓");
//     console.log(fullText);

//     const rows = parsePDFText(fullText);
//     console.log("✅ Parsed PDF rows:", rows);

//     renderTransactionPreview(rows);
// }
// function parsePDFText(text) {
//     const lines = text
//         .split(/\n/)
//         .map(l => l.trim())
//         .filter(Boolean);

//     const transactions = [];

//     lines.forEach(line => {

//         // Detect date (dd-mm-yyyy or dd/mm/yyyy)
//         const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
//         if (!dateMatch) return;

//         // Detect amount
//         const amountMatch = line.match(/(-?\(?₹?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?)/);
//         if (!amountMatch) return;

//         let amountStr = amountMatch[0]
//             .replace(/[₹,]/g, "")
//             .replace(/[()]/g, "");

//         let amount = parseFloat(amountStr);
//         if (isNaN(amount)) return;

//         const type = amount < 0 ? "Expense" : "Income";

//         const description = line
//             .replace(dateMatch[0], "")
//             .replace(amountMatch[0], "")
//             .trim();

//         transactions.push({
//             date: dateMatch[0],
//             description,
//             amount: Math.abs(amount),
//             type
//         });
//     });

//     return transactions;
// }
// document.getElementById("statementFile").addEventListener("change", e => {
//     const file = e.target.files[0];
//     if (!file) return;

//     console.log("📄 Uploaded file:", file.name, file.type);

//     if (file.type === "text/csv") {
//         const reader = new FileReader();
//         reader.onload = e => {
//             const rows = parseCSV(e.target.result);
//             renderTransactionPreview(rows);
//         };
//         reader.readAsText(file);
//     }

//     else if (file.type === "application/pdf") {
//         handlePDF(file);
//     }

//     else {
//         alert("Unsupported file type");
//     }
// });




//     function renderPreview(transactions) {
//         previewBody.innerHTML = "";

//         transactions.forEach(tx => {
//             const row = document.createElement("tr");

//             row.innerHTML = `
//                 <td>${tx.date}</td>
//                 <td>${tx.description}</td>
//                 <td>₹${tx.amount}</td>
//                 <td>${tx.type}</td>
//             `;

//             previewBody.appendChild(row);
//         });

//         if (transactions.length > 0) {
//             confirmBtn.disabled = false;
//         }
//     }
// 
// });




    function getUserIncome() {
    const data = JSON.parse(localStorage.getItem(incomeKey));
    return data?.monthlyIncome || 0;
}


    function getTotalExpenses() {
        return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    }

    function getCategoryTotals() {
        const totals = {};
        expenses.forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + e.amount;
        });
        return totals;
    }
    
    
    function renderGoals() {
            

    const goalsContainer = document.getElementById("goalsContainer");
    if (!goalsContainer) return;

    goalsContainer.innerHTML = "";

    if (goals.length === 0) {
        goalsContainer.innerHTML = "<p>No goals created yet.</p>";
        return;
    }

    goals.forEach(goal => {
        const percent = Math.min(
            Math.round((goal.saved / goal.target) * 100),
            100
        );

        const div = document.createElement("div");
        div.className = "goal-card";

        div.innerHTML = `
            <h4>${goal.name}</h4>
            <p>₹${goal.saved} / ₹${goal.target}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>

            <input 
                type="number" 
                placeholder="Add amount"
                id="add_${goal.id}"
            />
            <button onclick="addMoneyToGoal(${goal.id})">
                Add
            </button>
        `;

        goalsContainer.appendChild(div);
    });
}
// if (goals.length === 0) {
//     goals = [
//     { name: "🚗 New Car", target: 600000, saved: 120000 }
// ];
//     localStorage.setItem(goalsKey, JSON.stringify(goals));
// }


    function addMoneyToGoal(goalId) {
    const input = document.getElementById(`add_${goalId}`);
    const amount = Number(input.value);

    if (!amount || amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    goal.saved += amount;

    localStorage.setItem(goalsKey, JSON.stringify(goals));
    renderGoals();
generateSmartInsights();

}

// ✅ ADD THIS LINE
window.addMoneyToGoal = addMoneyToGoal;

    /* ===============================
       6️⃣ SUMMARY CARDS
    =============================== */
    function updateSummaryCards() {
    const income = getUserIncome();
    const spent = getTotalExpenses();
    const savings = income - spent;

    document.getElementById("incomeAmount").innerText =
        `₹${income.toLocaleString()}`;

    document.getElementById("expenseAmount").innerText =
        `₹${spent.toLocaleString()}`;

    document.getElementById("savingsAmount").innerText =
        `₹${savings.toLocaleString()}`;
}


    /* ===============================
       7️⃣ RENDER EXPENSES
    =============================== */
    function renderExpenses() {
        expenseList.innerHTML = "";
        let total = 0;

        expenses.forEach(exp => {
            total += exp.amount;
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${exp.title} (${exp.category})</span>
                <strong>₹${exp.amount}</strong>
            `;
            expenseList.appendChild(li);
        });

        totalExpenseEl.innerText = total;

        renderExpenseChart();
        generateInsights();
        displayBudget();
        updateBudgetProgress();
        checkOverspending();
        updateLowerSummaryCards();
        updateSummaryCards();
        generateSmartInsights();


    }

    /* ===============================
       8️⃣ ADD EXPENSE
    =============================== */
    expenseForm?.addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("expenseTitle").value;
        const amount = Number(document.getElementById("expenseInputAmount").value);
        const category = document.getElementById("expenseCategory").value;

        expenses.push({
            title,
            amount,
            category,
            date: new Date().toISOString()
        });

        localStorage.setItem(expenseKey, JSON.stringify(expenses));
        expenseForm.reset();
        renderExpenses();
    });

    /* ===============================
       9️⃣ CHART
    =============================== */
    function renderExpenseChart() {
        const canvas = document.getElementById("expenseChart");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const totals = getCategoryTotals();

        if (expenseChart) expenseChart.destroy();

        expenseChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: Object.keys(totals),
                datasets: [{
                    data: Object.values(totals),
                    backgroundColor: [
                        "#6366f1", "#22c55e", "#f97316",
                        "#ef4444", "#0ea5e9", "#a855f7"
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" } }
            }
        });
    }

    /* ===============================
       🔟 INSIGHTS
    =============================== */
    function generateInsights() {
    if (!spendingInsightList) return;

    spendingInsightList.innerHTML = "";

    if (expenses.length === 0) {
        spendingInsightList.innerHTML =
            "<li>No spending data yet.</li>";
        return;
    }

    const totals = getCategoryTotals();
    let topCat = "", max = 0;

    for (let cat in totals) {
        if (totals[cat] > max) {
            max = totals[cat];
            topCat = cat;
        }
    }

    const percent = Math.round((max / getTotalExpenses()) * 100);

    spendingInsightList.innerHTML = `
        <li>
            You spent <strong>${percent}%</strong> of your money on
            <strong>${topCat}</strong>.
        </li>
    `;
}


function generateSmartInsights() {
    if (!smartInsightList) return;

    smartInsightList.innerHTML = "";

    const income = getUserIncome();
    const spent = getTotalExpenses();
    const savings = income - spent;

    if (income === 0) {
        smartInsightList.innerHTML =
            "<li>Add income to unlock insights.</li>";
        return;
    }

    if (savings < 0) {
        smartInsightList.innerHTML += `
            <li>⚠️ You are overspending every month.</li>
        `;
    } else {
        smartInsightList.innerHTML += `
            <li>👍 You saved ₹${savings} this month.</li>
        `;
    }

    if (goals.length > 0) {
        const goal = goals[0];
        const monthlySavings = Math.max(savings, 1);
        const months = Math.ceil(
            (goal.target - goal.saved) / monthlySavings
        );

        smartInsightList.innerHTML += `
            <li>
                🎯 <strong>${goal.name}</strong> goal can be achieved in
                <strong>${months}</strong> months.
            </li>
        `;
    }
}

    /* ===============================
       1️⃣1️⃣ BUDGET (PER USER)
    =============================== */
    function displayBudget() {
    const budget = Number(localStorage.getItem(budgetKey)) || 0;
    budgetDisplay.innerText = budget
        ? `Monthly Budget: ₹${budget}`
        : "No budget set";
}


   saveBudgetBtn?.addEventListener("click", () => {
    const budget = Number(budgetInput.value);
    if (!budget || budget <= 0) {
        alert("Enter valid budget");
        return;
    }

    localStorage.setItem(budgetKey, budget);

    budgetInput.value = ""; // UX improvement

    displayBudget();
    updateBudgetProgress();
    updateLowerSummaryCards();   // ✅ FIX
    updateSummaryCards();        // ✅ FIX
    checkOverspending();
});


    function updateBudgetProgress() {
        const budget = Number(localStorage.getItem(budgetKey)) || 0;
        const spent = getTotalExpenses();
       if (!budget) {
        progressFill.style.width = "0%";
        progressText.innerText = "Set a budget";
        return;
    }

        const percent = Math.min((spent / budget) * 100, 150);
        progressFill.style.width = percent + "%";
        progressText.innerText = `₹${spent} / ₹${budget}`;

        if (spent > budget) {
            progressFill.style.background = "#ef4444"; // 🔴
        } else if (spent >= 0.7 * budget) {
            progressFill.style.background = "#f59e0b"; // 🟠
        } else {
            progressFill.style.background = "#10b981"; // 🟢
        }
    }

    function checkOverspending() {
        const budget = Number(localStorage.getItem(budgetKey)) || 0;
        overspendAlert.style.display =
            budget && getTotalExpenses() > budget ? "block" : "none";
    }

    /* ===============================
       🚀 INIT
    =============================== */
    renderExpenses();
renderGoals();
updateSummaryCards();
updateLowerSummaryCards();   // 🔥 missing
renderExpenseChart();        // 🔥 missing
generateSmartInsights();


    const addGoalBtn = document.getElementById("addGoalBtn");

addGoalBtn?.addEventListener("click", () => {
    const name = document.getElementById("goalName").value.trim();
    const target = Number(document.getElementById("goalTarget").value);

    if (!name || !target || target <= 0) {
        alert("Enter valid goal details");
        return;
    }

    const newGoal = {
        id: Date.now(),
        name,
        target,
        saved: 0,
        createdAt: new Date().toISOString()
    };

    goals.push(newGoal);
    localStorage.setItem(goalsKey, JSON.stringify(goals));

    document.getElementById("goalName").value = "";
    document.getElementById("goalTarget").value = "";

    renderGoals();
generateSmartInsights();

});

/* ===============================
   ⚡ QUICK ACTIONS
================================ */

const quickAddExpense = document.getElementById("quickAddExpense");
const quickCreateGoal = document.getElementById("quickCreateGoal");
// const quickViewInvestments = document.getElementById("quickViewInvestments");

quickAddExpense?.addEventListener("click", () => {
    document
        .getElementById("expenseForm")
        .scrollIntoView({ behavior: "smooth" });

    document.getElementById("expenseTitle")?.focus();
});

quickCreateGoal?.addEventListener("click", () => {
    document
        .querySelector(".goal-form")
        .scrollIntoView({ behavior: "smooth" });

    document.getElementById("goalName")?.focus();
});

quickViewInvestments?.addEventListener("click", () => {
    window.location.href = "investments.html";
});

window.logout = function () {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "signin.html";
};

window.openIncomeModal = function () {
    document.getElementById("incomeModal").classList.remove("hidden");

    const savedIncome = JSON.parse(localStorage.getItem(incomeKey));
    if (savedIncome) {
        document.getElementById("incomeInput").value = savedIncome.monthlyIncome;
    }
};

window.closeIncomeModal = function () {
    document.getElementById("incomeModal").classList.add("hidden");
};

window.saveIncome = function () {
    const income = Number(document.getElementById("incomeInput").value);

    if (!income || income <= 0) {
        alert("Please enter a valid income");
        return;
    }

    localStorage.setItem(
        incomeKey,
        JSON.stringify({ monthlyIncome: income })
    );

    closeIncomeModal();

    updateSummaryCards();
    generateSmartInsights();
};




});
