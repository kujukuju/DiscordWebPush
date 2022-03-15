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

    // notification.close();
    e.waitUntil(self.clients.matchAll({type: 'window'}).then(clientsArr => {
        self.clients.openWindow(notification.data).then(windowClient => windowClient ? windowClient.focus() : null);
    }));
});
