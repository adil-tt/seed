// Mock data for messages
let messages = [
    {
        id: 1,
        userName: "Alice Johnson",
        email: "alice@example.com",
        subject: "Product Inquiry",
        message: "Hello, I'm interested in the Blue Ceramic Vase. Do you offer bulk discounts for 20+ units? Please let me know the pricing.",
        date: "2025-02-20",
        status: "Unread",
        reply: null,
        replyDate: null
    },
    {
        id: 2,
        userName: "Bob Smith",
        email: "bob.smith@email.com",
        subject: "Shipping Delay",
        message: "My order #ORD-5542 has been stuck in processing for 3 days. Can you provide an update on the shipping status?",
        date: "2025-02-19",
        status: "Replied",
        reply: "Hello Bob, we apologize for the delay. Your order has been shipped today. You should receive a tracking link shortly.",
        replyDate: "2025-02-19 14:30"
    },
    {
        id: 3,
        userName: "Charlie Brown",
        email: "charlie@web.com",
        subject: "Custom Design",
        message: "I love your artisan mugs! Do you take custom orders for wedding favors? Looking for 50 mugs with initials.",
        date: "2025-02-18",
        status: "Unread",
        reply: null,
        replyDate: null
    },
    {
        id: 4,
        userName: "Diana Ross",
        email: "diana@records.com",
        subject: "Return Policy",
        message: "I received my plate but it has a small chip. What is your return or replacement policy for damaged items?",
        date: "2025-02-17",
        status: "Unread",
        reply: null,
        replyDate: null
    },
    {
        id: 5,
        userName: "Edward Norton",
        email: "ed@fightclub.com",
        subject: "Account Issue",
        message: "I can't seem to reset my password. The link says it's expired immediately. Can you help?",
        date: "2025-02-16",
        status: "Replied",
        reply: "Hi Edward, we've reset your account manually. Please check your inbox for a new secure link valid for 24 hours.",
        replyDate: "2025-02-17 09:15"
    }
];

let currentMessageId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    updateUnreadCount();
});

// Render the messages table
function renderTable() {
    const tableBody = document.getElementById('messageTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    messages.forEach(msg => {
        const row = document.createElement('tr');
        const statusClass = msg.status === 'Unread' ? 'status-unread' : 'status-replied';

        row.innerHTML = `
            <td>${msg.userName}</td>
            <td class="small text-secondary">${msg.email}</td>
            <td class="fw-bold small">${msg.subject}</td>
            <td class="small text-muted msg-preview">${msg.message}</td>
            <td class="small">${msg.date}</td>
            <td><span class="badge ${msg.status === 'Unread' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-success bg-opacity-10 text-success'} rounded-pill px-3">${msg.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="viewMessage(${msg.id})">View</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update unread badge in header
function updateUnreadCount() {
    const unreadCount = messages.filter(m => m.status === 'Unread').length;
    const badge = document.getElementById('unreadBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// Open modal and populate data
function viewMessage(id) {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    currentMessageId = id;

    document.getElementById('modalUserName').textContent = msg.userName;
    document.getElementById('modalUserEmail').textContent = msg.email;
    document.getElementById('modalDate').textContent = msg.date;
    document.getElementById('modalSubject').textContent = msg.subject;
    document.getElementById('modalFullMessage').textContent = msg.message;

    const replySection = document.getElementById('replySection');
    const repliedSection = document.getElementById('repliedSection');
    const replyTextarea = document.getElementById('replyTextarea');

    if (msg.status === 'Replied') {
        replySection.style.display = 'none';
        repliedSection.style.display = 'block';
        document.getElementById('repliedInfo').textContent = `Sent on ${msg.replyDate}`;
        document.getElementById('sentReplyContent').textContent = msg.reply;
    } else {
        replySection.style.display = 'block';
        repliedSection.style.display = 'none';
        replyTextarea.value = '';
    }

    const modal = new bootstrap.Modal(document.getElementById('messageModal'));
    modal.show();
}

// Handle reply submission
document.getElementById('sendReplyBtn')?.addEventListener('click', () => {
    const replyText = document.getElementById('replyTextarea').value.trim();
    if (!replyText) {
        alert("Please enter a reply message.");
        return;
    }

    const index = messages.findIndex(m => m.id === currentMessageId);
    if (index !== -1) {
        // Mocking backend update
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0] + ' ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        messages[index].status = 'Replied';
        messages[index].reply = replyText;
        messages[index].replyDate = timestamp;

        // Mocking email notification
        console.log(`[Backend Simulation] Sending email to ${messages[index].email}...`);
        console.log(`Email Content: ${replyText}`);

        // Update UI
        renderTable();
        updateUnreadCount();

        // Hide modal
        const modalElement = document.getElementById('messageModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();

        // Show success toast (optional, alert for now)
        alert(`Reply sent to ${messages[index].userName} successfully! Status updated.`);
    }
});
