document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       1️⃣ INVESTMENT DATA
    =============================== */
    const INVESTMENTS = {
        short: [
            {
                name: "Liquid Mutual Funds",
                risk: "Low Risk",
                returns: "4–6% annually",
                reason: "Ideal for emergency funds & short-term goals"
            },
            {
                name: "Recurring Deposit",
                risk: "Very Low Risk",
                returns: "5–6% annually",
                reason: "Safe and predictable savings"
            }
        ],
        medium: [
            {
                name: "Hybrid Mutual Funds",
                risk: "Moderate Risk",
                returns: "8–10% annually",
                reason: "Balanced growth with limited risk"
            },
            {
                name: "Index Funds",
                risk: "Moderate Risk",
                returns: "10–12% annually",
                reason: "Stable long-term market exposure"
            }
        ],
        long: [
            {
                name: "Equity Mutual Funds",
                risk: "High Risk",
                returns: "12–15% annually",
                reason: "Best for long-term wealth creation"
            },
            {
                name: "NPS / Retirement Funds",
                risk: "Moderate Risk",
                returns: "10–12% annually",
                reason: "Perfect for retirement planning"
            }
        ]
    };

    /* ===============================
       2️⃣ AUTH CHECK
    =============================== */
    const userData = sessionStorage.getItem("loggedInUser");
    if (!userData) {
        window.location.href = "signin.html";
        return;
    }

    const user = JSON.parse(userData);
    const goalsKey = `goals_${user.email}`;
    const goals = JSON.parse(localStorage.getItem(goalsKey)) || [];

    const goalHint = document.getElementById("goalHint");

    if (goals.length === 0) {
        goalHint.innerText =
            "No goals found. Showing general investment ideas.";
    }

    /* ===============================
       3️⃣ CATEGORIZE GOALS
    =============================== */
    const userGoals = {
        "Short-term": [],
        "Medium-term": [],
        "Long-term": []
    };

    goals.forEach(goal => {
        if (goal.target <= 100000) {
            userGoals["Short-term"].push(goal);
        } else if (goal.target <= 500000) {
            userGoals["Medium-term"].push(goal);
        } else {
            userGoals["Long-term"].push(goal);
        }
    });

    /* ===============================
       4️⃣ PRIMARY GOAL HINT
    =============================== */
    if (goals.length > 0) {
        const primaryGoal = goals[0];
        let goalType = "";

        if (primaryGoal.target <= 100000) goalType = "Short-term";
        else if (primaryGoal.target <= 500000) goalType = "Medium-term";
        else goalType = "Long-term";

        goalHint.innerText =
            `Based on your goal: ${primaryGoal.name} (${goalType})`;
    }

    /* ===============================
       5️⃣ RENDER SECTIONS
    =============================== */
    function renderSection(goalType, goalsForType) {
        const sectionMap = {
            "Short-term": "shortTerm",
            "Medium-term": "midTerm",
            "Long-term": "longTerm"
        };

        const investmentKeyMap = {
            "Short-term": "short",
            "Medium-term": "medium",
            "Long-term": "long"
        };

        const section = document.getElementById(sectionMap[goalType]);
        const list = section.querySelector(".investment-list");

        list.innerHTML = "";

        // 🚫 NO GOALS → SHOW MESSAGE
        if (!goalsForType || goalsForType.length === 0) {
            list.innerHTML = `
                <div class="empty-investment">
                    No ${goalType.toLowerCase()} goals found.<br/>
                    Add one from your dashboard to get investment ideas.
                </div>
            `;
            return;
        }

        // ✅ GOALS EXIST → SHOW INVESTMENTS
        INVESTMENTS[investmentKeyMap[goalType]].forEach(inv => {
            const card = document.createElement("div");
            card.className = "investment-card";

            card.innerHTML = `
                <h3>${inv.name}</h3>
                <p><strong>Risk:</strong> ${inv.risk}</p>
                <p><strong>Expected Returns:</strong> ${inv.returns}</p>
                <p class="reason">${inv.reason}</p>
            `;

            list.appendChild(card);
        });
    }

    /* ===============================
       6️⃣ INITIAL RENDER
    =============================== */
    renderSection("Short-term", userGoals["Short-term"]);
    renderSection("Medium-term", userGoals["Medium-term"]);
    renderSection("Long-term", userGoals["Long-term"]);

});
