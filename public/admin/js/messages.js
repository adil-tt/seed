let messages = [];
let currentMessageId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
});

// Fetch messages from backend
async function fetchMessages() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({ text: "Authentication required", icon: 'error' });
            window.location.href = "login.html";
            return;
        }

        const response = await fetch('/api/admin/messages', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            messages = data.messages;
            renderTable();
            updateUnreadCount();
        } else {
            console.error("Failed to fetch messages:", data.message);
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

// Render the messages table
function renderTable() {
    const tableBody = document.getElementById('messageTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    messages.forEach(msg => {
        const row = document.createElement('tr');
        const statusClass = msg.status === 'Unread' ? 'status-unread' : 'status-replied';

        const dateObj = new Date(msg.createdAt);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <td>${msg.name}</td>
            <td class="small text-secondary">${msg.email}</td>
            <td class="fw-bold small">${msg.subject}</td>
            <td class="small text-muted msg-preview">${msg.message}</td>
            <td class="small">${dateStr}</td>
            <td><span class="badge ${msg.status === 'Unread' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-success bg-opacity-10 text-success'} rounded-pill px-3">${msg.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="viewMessage('${msg._id}')">View</button>
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
    const msg = messages.find(m => m._id === id);
    if (!msg) return;

    currentMessageId = id;

    const dateObj = new Date(msg.createdAt);
    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.getElementById('modalUserName').textContent = msg.name;
    document.getElementById('modalUserEmail').textContent = msg.email;
    document.getElementById('modalDate').textContent = dateStr;
    document.getElementById('modalSubject').textContent = msg.subject;
    document.getElementById('modalFullMessage').textContent = msg.message;

    const replySection = document.getElementById('replySection');
    const repliedSection = document.getElementById('repliedSection');
    const replyTextarea = document.getElementById('replyTextarea');

    if (msg.status === 'Replied') {
        replySection.style.display = 'none';
        repliedSection.style.display = 'block';
        
        const replyDateObj = new Date(msg.replyDate);
        const replyDateStr = replyDateObj.toLocaleDateString() + ' ' + replyDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        document.getElementById('repliedInfo').textContent = `Sent on ${replyDateStr}`;
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
document.getElementById('sendReplyBtn')?.addEventListener('click', async () => {
    const replyText = document.getElementById('replyTextarea').value.trim();
    if (!replyText) {
        Swal.fire({ text: "Please enter a reply message.", icon: 'info' });
        return;
    }

    const btn = document.getElementById('sendReplyBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
    btn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/messages/${currentMessageId}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reply: replyText })
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({ text: `Reply sent successfully!`, icon: 'success' });
            
            // Hide modal
            const modalElement = document.getElementById('messageModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            // Refresh messages
            fetchMessages();
        } else {
            Swal.fire({ text: data.message || "Failed to send reply", icon: 'error' });
        }
    } catch (error) {
        console.error("Error sending reply:", error);
        Swal.fire({ text: "An error occurred while sending the reply", icon: 'error' });
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
