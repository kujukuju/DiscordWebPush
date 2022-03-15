console.log('Starting worker.');

self.addEventListener('push', function(event) {
    const payload = event.data ? event.data.text() : '';
    const parts = payload.split(' ');
    const link = parts[parts.length - 1];

    event.waitUntil(
        self.registration.showNotification('Discord', {
            body: payload,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            renotify: true,
            data: link,
        })
    );
});

self.addEventListener('notificationclick', e => {
    const notification = e.notification;
    const action = e.action;

    console.log(notification, action);

    if (!action || action === 'dismiss') {
        console.log('Closed notification');
    } else {

    }
});
