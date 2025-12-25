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

