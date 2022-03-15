window.onload = () => {
    var endpoint;
    var key;
    var authSecret;

    document.getElementById('doIt').addEventListener('click', event => {
        Notification.requestPermission().then(function(result) {
            // Register a Service Worker.
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('registered 1');
                // Use the PushManager to get the user's subscription to the push service.
                return registration.pushManager.getSubscription().then((subscription) => {
                    // If a subscription was found, return it.
                    if (subscription) {
                        return subscription;
                    }

                    // Otherwise, subscribe the user (userVisibleOnly allows to specify that we don't plan to
                    // send notifications that don't have a visible effect for the user).
                    return registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(PUBLIC_KEY)});
                });
            }).then((subscription) => {
                console.log('registered 2');
                // Retrieve the user's public key.
                var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
                key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
                var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
                authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';
                endpoint = subscription.endpoint;

                // Send the subscription details to the server using the Fetch API.
                fetch('./register', {
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                        key: key,
                        authSecret: authSecret,
                    }),
                });
            });
        });
    });

    function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};