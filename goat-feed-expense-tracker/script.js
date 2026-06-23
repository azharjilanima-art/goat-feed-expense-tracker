let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

let cashBalance = Number(localStorage.getItem("cashBalance")) || 0;
let onlineBalance = Number(localStorage.getItem("onlineBalance")) || 0;

let editIndex = -1;

/* ---------------- TODAY DATE ---------------- */
function getTodayDate() {
    let d = new Date();
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

/* ---------------- SAVE ---------------- */
function saveData() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("cashBalance", cashBalance);
    localStorage.setItem("onlineBalance", onlineBalance);
}

/* ---------------- RESET ERRORS ---------------- */
function resetErrors() {
    ["date", "feed", "amount", "payment"].forEach(id => {
        document.getElementById(id).style.border = "none";
    });
}

/* ---------------- ERROR HIGHLIGHT ---------------- */
function showError(id) {
    let el = document.getElementById(id);
    el.style.border = "2px solid red";
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------------- ADD BALANCE ---------------- */
function addBalance() {
    let cashInput = Number(document.getElementById("cashInput").value || 0);
    let onlineInput = Number(document.getElementById("onlineInput").value || 0);

    cashBalance += cashInput;
    onlineBalance += onlineInput;

    saveData();
    updateUI();

    document.getElementById("cashInput").value = "";
    document.getElementById("onlineInput").value = "";
}

/* ---------------- ADD EXPENSE ---------------- */
function addExpense() {

    resetErrors();
    

    resetErrors();
    
    let date = document.getElementById("date").value;
    let feed = document.getElementById("feed").value;
    let quantity = document.getElementById("quantity").value;
    let amount = document.getElementById("amount").value;
    let payment = document.getElementById("payment").value;
    
    if (!date) {
        showError("date");
        return;
    }
    
    if (!feed) {
        showError("feed");
        return;
    }
    
    if (!amount) {
        showError("amount");
        return;
    }
    
    if (!payment) {
        showError("payment");
        return;
    }
    // if (!date) return showError("date"), alert("Please fill required fields!");
    // if (!feed) return showError("feed"), alert("Please fill required fields!");
    // if (!quantity) return showError("quantity"), alert("Please fill required fields!");
    // if (!amount) return showError("amount"), alert("Please fill required fields!");
    // if (!payment) return showError("payment"), alert("Please fill required fields!");
    addFeedType(feed);
    // resetErrors();

    if (!date) return showError("date");
    if (!feed) return showError("feed");
    if (!amount) return showError("amount");
    if (!payment) return showError("payment");

    let expense = {
        date,
        feed,
        quantity: quantity || "-",
        amount: Number(amount),
        payment
    };

    /* EDIT MODE */
    if (editIndex >= 0) {

        let old = expenses[editIndex];

        if (old.payment === "Cash") cashBalance += old.amount;
        else onlineBalance += old.amount;

        expenses[editIndex] = expense;
        editIndex = -1;

    } else {
        expenses.push(expense);
    }

    /* Deduct new */
    if (expense.payment === "Cash") cashBalance -= expense.amount;
    else onlineBalance -= expense.amount;

    saveData();
    updateUI();

    /* CLEAR FORM */
    document.getElementById("date").value = getTodayDate();
    document.getElementById("quantity").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("feed").value = "";
    document.getElementById("payment").selectedIndex = 0;
}

/* ---------------- EDIT ---------------- */
function editExpense(index) {

    let e = expenses[index];

    document.getElementById("date").value = e.date;
    document.getElementById("feed").value = e.feed;
    document.getElementById("quantity").value = e.quantity;
    document.getElementById("amount").value = e.amount;
    document.getElementById("payment").value = e.payment;

    editIndex = index;

    // 👇 Scroll to form
    document.querySelector(".section").scrollIntoView({
        behavior: "smooth"
    });

    // 👇 Focus first input
    document.getElementById("date").focus();
}

/* ---------------- DELETE ---------------- */
function deleteExpense(index) {

    let e = expenses[index];

    if (e.payment === "Cash") cashBalance += e.amount;
    else onlineBalance += e.amount;

    expenses.splice(index, 1);

    saveData();
    updateUI();
}

/* ---------------- UPDATE UI ---------------- */
function updateUI() {

    let table = document.getElementById("tableBody");
    table.innerHTML = "";

    let total = 0;

    expenses.forEach((e, index) => {

        total += e.amount;

        table.innerHTML += `
        <tr>
            <td>${e.date}</td>
            <td>${e.feed}</td>
            <td>${e.quantity}</td>
            <td>Rs. ${e.amount}</td>
            <td>${e.payment}</td>
            <td>
                <button class="action-btn edit" onclick="editExpense(${index})">✏️</button>
                <button class="action-btn delete" onclick="deleteExpense(${index})">🗑️</button>
            </td>
        </tr>
        `;
    });

    document.getElementById("cashBalance").innerText = "Rs. " + cashBalance;
    document.getElementById("onlineBalance").innerText = "Rs. " + onlineBalance;
    document.getElementById("totalBalance").innerText = "Rs. " + (cashBalance + onlineBalance);
    document.getElementById("totalExpense").innerText = "Rs. " + total;
    document.getElementById("transactions").innerText = expenses.length;
}

/* ---------------- ENTER BUTTON ---------------- */
document.addEventListener("keydown", function (event) {

    if (event.key !== "Enter") return;

    let active = document.activeElement.id;

    // 🧠 If user is in search fields → do nothing
    if (active === "searchDate" ||
        active === "searchFeed" ||
        active === "searchPayment") {
        return;
    }

    // 💰 If user is in balance section
    if (active === "cashInput" || active === "onlineInput") {
        addBalance();
        return;
    }

    // 🐐 If user is in expense form
    if (
        active === "date" ||
        active === "feed" ||
        active === "quantity" ||
        active === "amount" ||
        active === "payment"
    ) {
        addExpense();
        return;
    }
});

/* ---------------- EXPORT PDF ---------------- */
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Goat Feed Expense Report", 10, 10);

    let y = 20;

    expenses.forEach((e, i) => {
        doc.text(
            `${i+1}. ${e.date} | ${e.feed} | ${e.quantity}Kg | Rs.${e.amount} | ${e.payment}`,
            10,
            y
        );
        y += 10;
    });

    doc.save("expense-report.pdf");
}

/* ---------------- EXPORT EXCEL ---------------- */
function exportExcel() {

    let csv = "Date,Feed,Quantity,Amount,Payment\n";

    expenses.forEach(e => {
        csv += `${e.date},${e.feed},${e.quantity},${e.amount},${e.payment}\n`;
    });

    let blob = new Blob([csv], { type: "text/csv" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "expense-report.csv";
    a.click();
}

/* ---------------- CLEAR ALL DATA ---------------- */
function clearAll() {

    let confirmDelete = confirm("Are you sure you want to delete all data?");

    if (!confirmDelete) return;

    expenses = [];
    cashBalance = 0;
    onlineBalance = 0;

    localStorage.clear();

    updateUI();
}

document.addEventListener("keydown", function(event){
    if(event.key === "Enter"){
        if(document.activeElement.tagName === "INPUT" ||
           document.activeElement.tagName === "SELECT"){
            addExpense();
        }
    }
});

const fields = ["date","feed","quantity","amount","payment"];

fields.forEach((id, index) => {
    let el = document.getElementById(id);
    if(!el) return;

    el.addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            e.preventDefault();
            let next = fields[index + 1];
            if(next) document.getElementById(next).focus();
        }
    });
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

/* ---------------- ADD FEED TYPE ---------------- */
function addFeedType(feedName) {

    let feedTypes = JSON.parse(localStorage.getItem("feedTypes")) || [
        "Grass",
        "Lucerne",
        "Dana",
        "Gandum Ka Daliya",
        "Tori",
        "Chokar",
        "Khul"
    ];

    if (!feedTypes.includes(feedName)) {
        feedTypes.push(feedName);
        localStorage.setItem("feedTypes", JSON.stringify(feedTypes));
    }
}

/* ---------------- LOAD FEED TYPES ---------------- */
function loadFeedTypes() {

    let feedTypes = JSON.parse(localStorage.getItem("feedTypes")) || [
        "Grass",
        "Lucerne",
        "Dana",
        "Gandum Ka Daliya",
        "Tori",
        "Chokar",
        "Khul"
    ];

    let datalist = document.getElementById("feedTypes");
    datalist.innerHTML = "";

    feedTypes.forEach(type => {
        datalist.innerHTML += `<option value="${type}">`;
    });
}

loadFeedTypes();

/* ---------------- INIT ---------------- */
document.getElementById("date").value = getTodayDate();
updateUI();
