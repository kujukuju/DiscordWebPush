console.log('Starting worker.');

self.addEventListener('push', function(event) {
    const payload = event.data ? event.data.text() : '';
    const parts = payload.split(' ');
    const link = parts.pop();
    const message = parts.join(' ');

    event.waitUntil(
        self.registration.showNotification('Discord', {
            body: message,
            icon: './icon-64.png',
            badge: './icon-192.png',
            data: link,
        })
    );
});

self.addEventListener('notificationclick', e => {
    const notification = e.notification;
    const action = e.action;

    if (!action || action === 'dismiss') {
        notification.close();
        console.log('Closed notification');
    } else {
        notification.close();
        self.clients.openWindow(notification.data);
        // window.open(notification.data, 'Discord Link', '_blank');
    }
});
