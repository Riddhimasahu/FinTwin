// Get stored users
let users = JSON.parse(localStorage.getItem("users")) || [];

/* ================= SIGN UP ================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const fullName = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const userType = document.getElementById("userType").value;

        // Check duplicate email
        const userExists = users.some(user => user.email === email);
        if (userExists) {
            alert("Email already registered!");
            return;
        }

        // Save user in localStorage
        const newUser = { name: fullName, email, password, userType };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        // ✅ Save CLEAN data in sessionStorage
        sessionStorage.setItem("loggedInUser", JSON.stringify({
            fullName: fullName,
            email: email,
            userType: userType
        }));

        window.location.href = "dashboard.html";
    });
}

/* ================= SIGN IN ================= */
const signinForm = document.getElementById("signinForm");

if (signinForm) {
    signinForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const user = users.find(
            u => u.email === email && u.password === password
        );

        if (!user) {
            alert("Invalid credentials!");
            return;
        }

        // ✅ Save CLEAN data in sessionStorage
        sessionStorage.setItem("loggedInUser", JSON.stringify({
            fullName: user.name,
            email: user.email,
            userType: user.userType
        }));

        window.location.href = "dashboard.html";
    });
}
